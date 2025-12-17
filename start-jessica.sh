#!/bin/bash
# Wrapper script to start Jessica services
# This calls the actual script in scripts/ directory

cd "$(dirname "$0")"
bash scripts/start-jessica.sh

