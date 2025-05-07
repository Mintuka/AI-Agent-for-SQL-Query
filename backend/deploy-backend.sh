#!/bin/bash
kubectl create configmap backend-config --from-env-file=.env --dry-run=client -o yaml | kubectl replace -f -
#build frontend docker image
docker build -t mintuka2015/querygpt-backend:v1.1 . --no-cache
#push the image to docker hub
docker push mintuka2015/querygpt-backend:v1.1

kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

kubectl get service backend-service