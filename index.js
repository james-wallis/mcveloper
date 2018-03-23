#!/usr/bin/env node --harmony
const fs = require('fs-extra');
const dataFile = __dirname + '/data.json';
console.log(dataFile);

// Check that data.json exists, if not copy and rename the template
if (!fs.existsSync(dataFile)) {
  fs.copy('./data.json.template', dataFile, err => {
    if (err) {
      console.error('Error, data.json could not be copied.\nProbably best to let James know...');
    } else {
      console.log('data.json has been created.\nRun mcveloper again to use it.');
    }
  });
} else {
  const program = require('commander');
  const package = require('./package.json');
  const openInBrowser = require('open');
  const utils = require(__dirname + '/modules/utils.js');
  const data = require(__dirname + '/data.json');
  // Variables for the api and api tools
  var api = '';

  // Check current context to get the right command
  if (data.current_context == 'Docker') {
    api = require('./modules/Docker');

  } else if (data.current_context == 'K8') {
    api = require('./modules/K8');
  } else {
    console.log('Unsupported context.');
    console.log('Current context: ' + data.current_context);
  }
  program.version(package.version);

  program
    .command('help')
    .alias('h')
    .description('Show help')
    .action(function() {
      program.help();
    });

  program
    .command('exec <container>')
    .alias('e')
    .usage('[options]')
    .option('-c, --cmd <cmd>', 'The command to run inside the container (Defaults to /bin/bash)')
    .description('Run a command in a Microclimate container')
    .action(function(container, opts) {
      api.exec(container, opts);
    });

  program
    .command('images')
    .alias('i')
    .usage('[options]')
    .description('Show current Microclimate images')
    .option('-i, --fullimage', 'Show the full image id')
    .option('-t, --time', 'Show the exact time since image creation')
    .action(function(opts) {
      api.images(opts);
    });

  program
    .command('logs <container>')
    .alias('l')
    .description('Show logs of a Microclimate container')
    .action(function(container, opts) {
      api.logs(container, opts);
    });

  program
    .command('ps')
    .usage('[options]')
    .description('Show current running Microclimate processes')
    .option('-c, --cmd', 'Show the container command')
    .option('-i, --image', 'Show the full image name')
    .option('-n, --fullname', 'Show the full container name')
    .action(function(opts) {
      api.ps(opts);
    });

  program
    .command('psa')
    .usage('[options]')
    .description('Show all Microclimate processes (running and stopped)')
    .option('-c, --cmd', 'Show the container command')
    .option('-i, --image', 'Show the full image name')
    .option('-n, --fullname', 'Show the full container name')
    .action(function(opts) {
      opts.all = true;
      api.ps(opts);
    });

  program
    .command('run')
    .alias('r')
    .option('-d, --directory', 'Specify the exact path to the run command (./run.sh for local, helm chart for ICP)')
    .description('Run Microclimate')
    .action(function(opts) {
      api.run(opts);
    });

  program
    .command('open')
    .alias('o')
    .description('Open Microclimate')
    .action(function(container, opts) {
      api.open(container, opts);
    });

  program
    .command('stop')
    .alias('s')
    .option('-d, --directory', 'Specify the exact path to the stop command (./stop.sh for local, helm chart for ICP)')
    .description('Stop Microclimate')
    .action(function(opts) {
      api.stop(opts);
    });

  // General commands (Not for Docker or Kubernetes)

  program
   .command('open-webpage')
   .alias('O')
   .description('Open the Microclimate (dev2ops) webpage')
   .action(function() {
     openInBrowser(data.web_page_url);
   });

  program
    .command('get-context')
    .alias('G')
    .description('Get the current context of this tool')
    .action(function() {
      console.log(data.current_context);
    });

  program
    .command('set-context <context>')
    .alias('S')
    .description('Set a new context for this tool')
    .action(function(context) {
      context = context.toLowerCase();
      let dockerVariations = data.command_variations.docker;
      let kubeVariations = data.command_variations.kube;
      if (dockerVariations.indexOf(context) > -1) {
        updateContext('Docker');
      } else if (kubeVariations.indexOf(context) > -1) {
        updateContext('K8');
      } else {
        console.log('Invalid context given');
      }
      function updateContext(context) {
        data.current_context = context;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing context.\n' + err);
          console.log('Context changed to: ' + data.current_context);
        });
      }
    });

  program
    .command('get-run')
    .alias('RG')
    .description('Get the run command and location for the current context')
    .action(function() {
      utils.getRunCommand(function(location, command) {
        console.log(`\nRun command for ${data.current_context}: '${command}'`);
        console.log(`Run location for ${data.current_context}: '${location}'\n`);
      });
    });

  program
    .command('set-run-command <command>')
    .alias('RC')
    .description('Set a new run command for the current context')
    .action(function(command) {
      if (data.current_context == 'Docker') {
        data.local_info.run.command = command;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing command.\n' + err);
          console.log('Local run command changed to: ' + data.local_info.run.command);
        });
      } else if (data.current_context == 'K8') {
        data.kube_info.run.command = command;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing command.\n' + err);
          console.log('K8 run command changed to: ' + data.kube_info.run.command);
        });
      }
    });

  program
    .command('set-run-location <location>')
    .alias('RL')
    .description('Set a new run location for the current context')
    .action(function(location) {
      if (data.current_context == 'Docker') {
        data.local_info.run.location = location;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing location.\n' + err);
          console.log('Local run location changed to: ' + data.local_info.run.location);
        });
      } else if (data.current_context == 'K8') {
        data.kube_info.run.location = location;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing location.\n' + err);
          console.log('K8 run location changed to: ' + data.kube_info.run.location);
        });
      }
    });

  program
    .command('get-stop')
    .alias('SG')
    .description('Get the stop command and location for the current context')
    .action(function() {
      utils.getStopCommand(function(location, command) {
        console.log(`\nStop command for ${data.current_context}: '${command}'`);
        console.log(`Stop location for ${data.current_context}: '${location}'\n`);
      });
    });

  program
    .command('set-stop-command <command>')
    .alias('SC')
    .description('Set a new stop command for the current context')
    .action(function(command) {
      if (data.current_context == 'Docker') {
        data.local_info.stop.command = command;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing command.\n' + err);
          console.log('Local stop command changed to: ' + data.local_info.stop.command);
        });
      } else if (data.current_context == 'K8') {
        data.kube_info.stop.command = command;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing command.\n' + err);
          console.log('K8 stop command changed to: ' + data.kube_info.stop.command);
        });
      }
    });

  program
    .command('set-stop-location <location>')
    .alias('SL')
    .description('Set a new stop location for the current context')
    .action(function(location) {
      if (data.current_context == 'Docker') {
        data.local_info.stop.location = location;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing location.\n' + err);
          console.log('Local run location changed to: ' + data.local_info.stop.location);
        });
      } else if (data.current_context == 'K8') {
        data.kube_info.stop.location = location;
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), function (err) {
          if (err) return console.error('Error changing location.\n' + err);
          console.log('K8 stop location changed to: ' + data.kube_info.stop.location);
        });
      }
    });

  program
    .command('*', '', {noHelp: true, isDefault: true})
    .action(function(){
      program.help();
    });

  program.parse(process.argv);
  if (!program.args.length) program.help();

}
