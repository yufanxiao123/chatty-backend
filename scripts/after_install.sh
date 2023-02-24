#!/bin/bash

#注意路径名和文件名的正确
cd /home/ec2-user/udemy-chatty-backend
sudo rm -rf env-file.zip
sudo rm -rf .env
sudo rm -rf .env.develop
aws s3 sync s3://chattyapp-env-files/develop .
unzip env-file.zip
#此时，.env.develop里的REDIS HOST已经被更新好了
sudo cp .env.develop .env
sudo pm2 delete all
sudo npm install
