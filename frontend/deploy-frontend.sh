#!/bin/bash
kubectl create configmap frontend-config --from-env-file=.env
#build frontend docker image
docker build -t mintuka2015/querygpt-frontend:v1.1 . --no-cache
#push the image to docker hub
docker push mintuka2015/querygpt-frontend:v1.1

kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

kubectl get service frontend-service