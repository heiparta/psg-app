#!/bin/bash
source ~/.nvm/nvm.sh
node server.js >> /var/log/psg/app.log 2>&1
