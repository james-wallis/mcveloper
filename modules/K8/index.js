const k8sApi = require('kubernetes-client');
const Client = require('kubernetes-client').Client;
const config = require('kubernetes-client').config;
var client;
const os = require('os');
const fs = require('fs');
const cTable = require('console.table');
const openInBrowser = require('open');
const util = require('util');
const utils = require('../utils.js');
const execSync = require('child_process').execSync;
const { URL } = require('url');

const shortMaxSubstring = 12;
const longMaxSubstring = 30;
const portal = 'microclimate-portal';
const fw = 'microclimate-file-watcher';

const kubeConfigPath = os.homedir() + '/.kube/config';
var kubeConfigMissing = false;
if (!fs.existsSync(kubeConfigPath)) {
  console.log('\nKubectl config does not exist\nExiting\n');
  kubeConfigMissing = true;
} else {
  client = new Client({ config: config.fromKubeconfig(), version: '1.9' });
}

/**
 * Kubectl exec
 * Function to execute a command in a container
 */
module.exports.exec = async function exec(cont, opts) {
  if (kubeConfigMissing) return;
  try {
    // Find microclimate pod name.
    // TODO handle multiple microclimate pods
    let processes = [];
    let getPods =  await client.api.v1.pods.get();
    let pods = getPods.body.items;
    let pod = '';
    for (var i = 0; i < pods.length; i++) {
      if (pods[i].metadata.namespace == 'default' && pods[i].metadata.labels.app) {
        if (pods[i].metadata.labels.app == `${pods[i].metadata.labels.release}-ibm-microclimate`) {
          pod = pods[i].metadata.name;
        } else if (i+1 == pods.length) {
          console.log('\nUnable to find a Microclimate pod\n');
          return;
        }
      }
    }
    let cmd = '/bin/bash';
    if (opts.cmd) cmd = opts.cmd;
    // Switch for some container names
    if (cont == 'p' || cont == 'portal') {
      cont = portal;
    } else if (cont == 'f' || cont == 'fw' || cont == 'file-watcher') {
      cont = fw;
    }
    execSync(`kubectl exec -it ${pod} -c ${cont} ${cmd}`, { stdio: 'inherit' });
  } catch(err) {
    if (err.message.indexOf('Command failed') > -1) {
      return;
    } else if (err.message == 'Unauthorized') {
      utils.unauthorized();
    } else {
      console.error(err);
    }
  }
}

/**
 * Kubectl images
 * Function to show the output from a custom 'docker images'
 */
module.exports.images = async function images(opts, docker) {
  if (kubeConfigMissing) return;
  console.log('\nUnable to get the Image on the K8 machine.\n');
}

/**
 * Kubectl logs
 * Function to show the output from a custom 'docker logs'
 */
module.exports.logs = async function logs(cont, opts) {
  if (kubeConfigMissing) return;
  try {
    // Find microclimate pod name.
    // TODO handle multiple microclimate pods
    let processes = [];
    let getPods =  await client.api.v1.pods.get();
    let pods = getPods.body.items;
    let pod = '';
    for (var i = 0; i < pods.length; i++) {
      if (pods[i].metadata.namespace == 'default' && pods[i].metadata.labels.app) {
        if (pods[i].metadata.labels.app == `${pods[i].metadata.labels.release}-ibm-microclimate`) {
          pod = pods[i].metadata.name;
        } else if (i+1 == pods.length) {
          console.log('\nUnable to find a Microclimate pod\n');
          return;
        }
      }
    }
    if (cont == 'p' || cont == 'portal') {
      cont = portal;
    } else if (cont == 'f' || cont == 'fw' || cont == 'file-watcher') {
      cont = fw;
    }
    let exec = require('child_process').exec;
    let containerLogs = exec(`kubectl logs -f ${pod} -c ${cont}`);
    containerLogs.stdout.on('data', function(data) {
        process.stdout.write(data);
    });
    containerLogs.stderr.on('data', function(data) {
        process.stdout.write(data);
    });
  } catch (err) {
    console.error(err);
  }
}

/**
 * Kubectl ps
 * Function to show the output from a custom 'docker ps'
 */
module.exports.ps = async function ps(opts) {
  if (kubeConfigMissing) return;
  try {
    let processes = [];
    let getPods =  await client.api.v1.pods.get();
    let pods = getPods.body.items;
    // console.log(pods[3]);
    // console.log(pods[3].status.containerStatuses[0]);
    for (var i = 0; i < pods.length; i++) {
      let pod = pods[i];
      if (pod.metadata.namespace == 'default') {
        let noContainers = '?';
        let runningContainers = 0;
        let restartCount = 0;
        if (pod.spec.containers) {
          noContainers = pod.spec.containers.length;
          for (var j = 0; j < noContainers; j++) {

            if (pod.status.containerStatuses) {
              restartCount += pod.status.containerStatuses[j].restartCount;
              if (Object.keys(pod.status.containerStatuses[j].state)[0] == 'running') {
                runningContainers++;
              }
            }
          }
        }
        let pro = {};
        pro.NAME = pod.metadata.name;
        pro.READY = `${runningContainers}/${noContainers}`;
        pro.STATUS = pod.status.phase;
        pro.RESTARTS = restartCount;
        // console.log(pod);
        // console.log(i);
        // console.log(pod.status.conditions[1].type);
        processes.push(pro);
      }
      if (i+1 == pods.length) console.table(processes);
    }
  } catch(err) {
    if (err.message == 'Unauthorized') {
      utils.unauthorized();
    } else {
      console.error(err);
    }
  }
}

/**
 * Function to call the run script to start the ICP Microclimate (dev run)
 */
module.exports.run = function run(opts) {
  console.log('\nNo run command for the K8 context yet.\n');
}

/**
 * Function to call the stop script to start the ICP Microclimate (dev stop)
 */
module.exports.stop = function stop(opts) {
  console.log('\nNo stop command for the K8 context yet.\n');
  // let exec = require('child_process').exec;
  // utils.getStopCommand(function(command) {
  //   let stop = exec(command);
  //   stop.stdout.on('data', function(data) {
  //       process.stdout.write(data);
  //   });
  //   stop.stderr.on('data', function(data) {
  //       process.stdout.write(data);
  //   });
  // });
}

/**
 * Function to open Microclimate in the browser
 */
module.exports.open = async function open(cont, opts) {
  if (kubeConfigMissing) return;
  try {
    let processes = [];
    let getServices =  await client.api.v1.services.get();
    let getConfig = await config.fromKubeconfig();
    let services = getServices.body.items;
    let nodeport = '';
    for (var i = 0; i < services.length; i++) {
      if (services[i].metadata.namespace == 'default' && services[i].metadata.labels) {
        if (services[i].metadata.labels.app == `${services[i].metadata.labels.release}-ibm-microclimate`) {
          for (var j = 0; j < services[i].spec.ports.length; j++) {
            let name = services[i].spec.ports[j].name;
            if (name.indexOf('portal') > -1) {
              nodeport = services[i].spec.ports[j].nodePort;
            }
          }
        } else if (i+1 == services.length) {
          console.log('\nUnable to find a Microclimate portal service\n');
          return;
        }
      }
    }
    let configUrl = new URL(getConfig.url);
    let address = `http://${configUrl.hostname}:${nodeport}`;
    openInBrowser(address);
  } catch(err) {
    if (err.message == 'Unauthorized') {
      utils.unauthorized();
    } else {
      console.error(err);
    }
  }
}
