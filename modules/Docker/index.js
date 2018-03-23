const Docker = require('dockerode');
const docker = new Docker();
const cTable = require('console.table');
const openInBrowser = require('open');
const stream = require('stream');
const execSync = require('child_process').execSync;
const util = require('util');
const utils = require('../utils.js');

const shortMaxSubstring = 12;
const longMaxSubstring = 30;
const portal = 'microclimate-portal';
const fw = 'microclimate-file-watcher';


/**
 * Docker exec
 * Function to execute a command in a container
 */
module.exports.exec = function exec(cont, opts) {
  let cmd = '/bin/bash';
  if (opts.cmd) cmd = opts.cmd;
  // Switch for some container names
  if (cont == 'p' || cont == 'portal') {
    cont = portal;
  } else if (cont == 'f' || cont == 'fw' || cont == 'file-watcher') {
    cont = fw;
  }
  try {
    execSync(`docker exec -it ${cont} ${cmd}`, { stdio: 'inherit' });
  } catch(err) {
    if (err.message == 'Command failed') return;
  }

}

/**
 * Docker images
 * Function to show the output from a custom 'docker images'
 */
module.exports.images = function images(opts) {
  let dockerImages = [];
  console.log('');
  docker.listImages(function (err, images) {
    for (var i = 0; i < images.length; i++) {
      let info = images[i];
      let repo = '';
      // Image size conversion
      let memory = info.Size/1000000;
      memory = Math.round(memory);
      let strMem = memory + 'MB';
      if (memory > 999) {
        memory = (memory/1000).toFixed(2);
        strMem = memory + 'GB';
      }
      // Image creation conversion
      let now = new Date();
      let then = new Date(0);
      then.setUTCSeconds(info.Created);
      let ms =(now.getTime() - then.getTime());
      s = Math.floor(ms / 1000);
      m = Math.floor(s / 60);
      s = s % 60;
      h = Math.floor(m / 60);
      m = m % 60;
      d = Math.floor(h / 24);
      h = h % 24;
      let time = '';
      // If opts.time then display full time else display simple docker time
      if (opts.time) {
        if (d > 0) ((d > 1) ? time += `${d} days ` : time += `${d} day `);
        if (h > 0) ((h > 1) ? time += `${h} hours ` : time += `${h} hour `);
        if (m > 0) ((m > 1) ? time += `${m} minutes ` : time += `${m} minute `);
      } else {
        if (d > 0) ((d > 1) ? time += `${d} days ` : time += `${d} day `);
        else if (h > 0) ((h > 1) ? time += `${h} hours ` : time += `${h} hour `);
        else if (m > 0) ((m > 1) ? time += `${m} minutes ` : time += `${m} minute `);
      }

      time += 'ago';
      // Repository showing
      ((info.RepoTags) ? repo = info.RepoTags : repo = info.RepoDigests);
      for (var j = 0; j < repo.length; j++) {
        let repository = repo[j];
        // console.log(info);
        // Check that the image is a microclimate one
        utils.isMicroclimate(repository, function(mc_image) {
          if (mc_image) {
            let image = {};
            if (repository.indexOf('@sha256') > -1) {
              repository = repository.substring(0, repository.indexOf('@sha256'));
            }
            image.REPOSITORY = repository;
            ((opts.fullimage) ? image.IMAGE = info.Id.substring(7) : image.IMAGE = info.Id.substring(7, 7+shortMaxSubstring));
            image.CREATION = time;
            image.SIZE = strMem;
            dockerImages.push(image);
          };
        });
      };
      if (i+1 == images.length && dockerImages.length > 0) {
        console.table(dockerImages);
      } else if (i+1 == images.length) {
        console.log('No Microclimate images\n');
      }
    }
  });
}

/**
 * Docker logs
 * Function to show the output from a custom 'docker logs'
 */
module.exports.logs = function logs(cont, opts) {
  if (cont == 'p' || cont == 'portal') {
    cont = portal;
  } else if (cont == 'f' || cont == 'fw' || cont == 'file-watcher') {
    cont = fw;
  }
  let exec = require('child_process').exec;
  let containerLogs = exec('docker logs -f ' + cont);
  containerLogs.stdout.on('data', function(data) {
      process.stdout.write(data);
  });
  containerLogs.stderr.on('data', function(data) {
      process.stdout.write(data);
  });
}

/**
 * Docker ps
 * Function to show the output from a custom 'docker ps'
 */
module.exports.ps = function ps(opts) {
  let processes = [];
  console.log('');
  let showAll = false;
  if (opts.all) showAll = true;
  docker.listContainers({all: showAll}, function (err, containers) {
    for (var i = 0; i < containers.length; i++) {
      let info = containers[i];
      let imageName = info.Image;
      let containerName = info.Names[0];
      // Check image and container names for microclimate references
      utils.isMicroclimate([imageName, containerName], function(mc_container) {
        if (mc_container) {
          let cmd = `\"${info.Command}\"`;
          let state = info.State.charAt(0).toUpperCase() + info.State.slice(1);
          let p = info.Ports[0];
          let portString = '';
          if (p && p.IP && p.PublicPort) portString += `${p.IP}:${p.PublicPort}->`;
          if (p && p.PrivatePort) portString += `${p.PrivatePort}`;
          if (p && p.Type) portString += `/${p.Type}`;
          let ps = {};
          ps.CONTAINER_ID = info.Id.substring(0, shortMaxSubstring);
          ((opts.image) ? ps.IMAGE = info.Image : ps.IMAGE = info.Image.substring(0, longMaxSubstring));
          ps.STATE = state;
          ps.STATUS = info.Status;
          ps.PORTS = portString;
          ((opts.fullname) ? ps.NAME = info.Names[0].substring(1) : ps.NAME = info.Names[0].substring(1, longMaxSubstring))
          if (opts.cmd) ps.COMMAND = cmd;
          processes.push(ps);
        }
        if (i+1 == containers.length && processes.length > 0) {
          console.table(processes);
        } else if (i+1 == containers.length) {
          console.log('No running Microclimate processes\n');
        }
      });
    }
  });
}

/**
 * Function to call the run script to start the local Microclimate (dev run)
 */
module.exports.run = function run(opts) {
  let exec = require('child_process').exec;
  utils.getRunCommand(function(location, command) {
    let run = exec(command, { cwd: location });
    run.stdout.on('data', function(data) {
        process.stdout.write(data);
    });
    run.stderr.on('data', function(data) {
        process.stdout.write(data);
    });
  });
}

/**
 * Function to call the stop script to start the local Microclimate (dev stop)
 */
module.exports.stop = function stop(opts) {
  let exec = require('child_process').exec;
  utils.getStopCommand(function(location, command) {
    let stop = exec(command, { cwd: location });
    stop.stdout.on('data', function(data) {
        process.stdout.write(data);
    });
    stop.stderr.on('data', function(data) {
        process.stdout.write(data);
    });
  });
}

/**
 * Function to open Microclimate in the browser
 */
module.exports.open = function open(cont, opts) {
  let container = docker.getContainer(portal);
  container.inspect(function (err, data) {
    if (data && data.NetworkSettings && data.NetworkSettings.Ports) {
      let host = data.NetworkSettings.Ports[Object.keys(data.NetworkSettings.Ports)[0]];
      // Ensure that portal has exposed its port
      if (host && host[0]) {
        let address = `http://${host[0].HostIp}:${host[0].HostPort}`;
        openInBrowser(address);
      } else {
        console.log('\n' + portal + ' has not exposed its ports\n');
      }
    } else {
      console.log('\nNo ' + portal + ' container\n');
    }
  });
}
