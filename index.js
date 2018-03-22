#!/usr/bin/env node --harmony
const program = require('commander');
const package = require('./package.json');
const dataFile = __dirname + '/data.json';
const data = require(dataFile);
const openInBrowser = require('open');
const fs = require('fs');

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
  .command('*', '', {noHelp: true, isDefault: true})
  .action(function(){
    program.help();
  });

program.parse(process.argv);
if (!program.args.length) program.help();
