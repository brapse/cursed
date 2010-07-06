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


500 words: node client.js 4  0.15s user 0.02s system 0% cpu 35.158 total
500 words (INDEXED) node client.js 4  0.13s user 0.02s system 6% cpu 2.287 total

Whole dictionary (RAW): node client.js 4  9.12s user 0.69s system 0% cpu 44:12.29 total
Success:
Whole dictionary (INDEXED)node client.js 4  6.82s user 0.20s system 4% cpu 2:36.35 total
While Dictionary (binary_search): node client.js 4  5.35s user 0.15s system 66% cpu 8.267 total

========

- Should be able to write a simple script that runs in parallel
-   Should run in parallel accross processes
-   Should run in parallel accross machines

- Should have task management
    - Track failures
    - Stats 
    - Atomic tasks and retry-ability

