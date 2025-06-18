@echo off
echo ============================================
echo Building Docker images in Minikube
echo ============================================

echo Setting up Minikube Docker environment...
FOR /F "tokens=*" %%i IN ('.\minikube docker-env') DO %%i

echo Building server image...
docker build -t log430-server:latest ./server

echo Building client image...
docker build -t log430-client:latest ./client

echo ============================================
echo Images built successfully!
echo ============================================ 