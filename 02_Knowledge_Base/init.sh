#!/bin/bash
npm install ts-node --save-dev
npm install typescript -g
npm install typescript --save-dev
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16
npm install -g aws-cdk