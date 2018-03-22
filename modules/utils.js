// General functions
const data = require('../data.json');
const fs = require('fs-extra');

/**
 * Takes a list of strings and checks them against
 * the valid_prefixes list in the data.json to determine
 * whether they contain a valid Microclimate string
 */
module.exports.isMicroclimate = function isMicroclimate(list, callback) {
  let validList = data.valid_prefixes;
  if (typeof list === 'string') list = [list];
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < validList.length; j++) {
      if (list[i].indexOf(validList[j]) > -1) {
        callback(true);
        return;
      }
    }
    if (i+1 === list.length) {
      callback(false);
    }
  }
}

module.exports.unauthorized = function unauthorized() {
  if (data.current_context == 'Docker') {
    console.log('Docker unauthorized message');
  } else if (data.current_context == 'K8') {
    console.log('\nError:\nYou are not authorized to use this Kubernetes cluster.\nUse the ICP dashboard to configure your client before continuing.\n');
  } else {
    console.error(new Error('Unknown context'));
  }
}

module.exports.getRunCommand = function getRunCommand(callback) {
  if (data.current_context == 'Docker') {
    let command = `${data.local_info.run.location}/${data.local_info.run.command}`;
    callback(command)
  } else if (data.current_context == 'K8') {
    console.log('\nError:\nYou are not authorized to use this Kubernetes cluster.\nUse the ICP dashboard to configure your client before continuing.\n');
  } else {
    console.error(new Error('Unknown context'));
  }
}

module.exports.getStopCommand = function getStopCommand(callback) {
  if (data.current_context == 'Docker') {
    let command = `${data.local_info.stop.location}/${data.local_info.stop.command}`;
    callback(command);
  } else if (data.current_context == 'K8') {
    console.log('\nError:\nYou are not authorized to use this Kubernetes cluster.\nUse the ICP dashboard to configure your client before continuing.\n');
  } else {
    console.error(new Error('Unknown context'));
  }
}