CURSED
======

> Node.js distrobuted computation

Cursed sets up a collection of node processes locally, or remotely, that share the load
of some computational process.

Status
======
experimental but actively developed (September 2010) 
- Does trivial things, inefficiently
- some components are tested
- api is unstable

Use
===
Discription pending solid api.
see github.com/brapse/cursed_examples

Architecture:
=============


TODO
========
- Logging interface
    - Event based, listen on each event
- Client should setup a server, results should be streamed directly to them
    - Responses should not go through the router but instead be streamed directly to the client
- Nodes should be configurable to how many jobs they will acceepts at a time, buffering
  a certain amount of requests for their workers but not getting overloaded.
- Job should be persisted with nimbus

- executable interface: [DONE]
    - start a router [DONE]
    - start a node [DONE]
    - run a command [DONE]

- Should have task management
    - easy deployment
    - auto restart errors
    - logging
    - Track failures
    - Stats 
    - Atomic tasks and retry-ability
