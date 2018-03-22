# mcveloper
CLI to reduce the amount of kubectl exec and docker logs I have to do

## Installation
```
npm install -g https://github.com/jamesemwallis/mcveloper  
```
or 
```
https://github.com/jamesemwallis/mcveloper.git && \
cd mcveloper && \
npm install -g
```

## Problem

Currently working on a project day-to-day which requires typing the same `kubectl` and `docker` commands with minimal variation.

Having to type the whole command over and over again is tedious and so is finding it in my bash history.

## Fix

This CLI takes the commands I need and in some places shortens what I need to type but in others, such as open, will stop me having to load a webpage and work out how to get the ip and port of a Kubernetes service.

## Features

* `m exec` - `docker exec -it` and `kubectl exec -it`, takes the container name and defaults the command to `/bin/bash`.
* `m images` - `docker images`, shows only microclimate related Docker images. No kubectl version. 
* `m logs` - `docker logs -f` and `kubectl logs -f`, prints and follows the log of a given container.
* `m ps` - `docker ps` and `kubectl get pods`, prints the current running Microclimate processes. Docker can take a `-a (all)` option.
* `m run` - Run a developer run script, user has to set this.
* `m stop` - Run a developer stop script, user has to set this.
* `m open` - Open mc in the browser, simple in Docker, clever in Kubernetes.
