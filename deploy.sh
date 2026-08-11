#!/bin/bash
# ---------------------------------------------------------
# 🚀 SYNC CODE v2.0 - AUTOMATED AWS EC2 DEPLOYMENT
# ---------------------------------------------------------
set -e 

# Navigate to the project directory on the AWS EC2 instance
cd /home/ubuntu/sync-code-v2

echo "⏬ Pulling latest configuration from Git..."
git pull origin main

echo "🛑 Stopping existing container matrix..."
sudo docker-compose down

echo "🧹 Pruning dangling Docker images to free up EBS disk space..."
sudo docker image prune -f

echo "🚀 Booting the microservices cluster..."
sudo docker-compose up -d --build

echo "✅ Deployment Successful! Validating container states:"
sudo docker ps