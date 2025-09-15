#!/bin/bash

# Start Firebase emulators (excluding hosting due to port conflicts)
firebase emulators:start --only auth,firestore,functions,storage