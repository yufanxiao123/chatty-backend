#!/bin/bash

DIT="/home/ec2-user/udemy-chatty-backend"
if [ -d "$DIR" ]; then
  cd /home/ec2-user
  sudo rm -rf udemy-chatty-backend
else
  echo "Directory does not exist"
fi
