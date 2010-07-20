CURSED
======

> Node.js distrobuted computation

Cursed sets up a collection of node processes locally, or remotely, that share the load
of some computational process. Inter process comunication via http.


Architecture:
=============

Routers distrobute jobs
    Whats the anatomy of a job?
    A command to execute, with arguments,
    the server responds with success or failure

    Result forwarding:
    When a task is complete, the server running the job might want to forward the
    result to another node for reducing. Success of the sending node might require
    acceptance of the result by the receiver.

server: A running node proccess that accepts jobs, does work and forwards the result
to a 



========

- Should be able to write a simple script that runs in parallel
-   Should run in parallel accross processes
-   Should run in parallel accross machines

- Should have task management
    - Track failures
    - Stats 
    - Atomic tasks and retry-ability

TODO (in order)
==============
- Create a seperate repo for examples
- Abstract the moving parts of
    - Task definition
    - Partitioning
    - Worker process spawning

