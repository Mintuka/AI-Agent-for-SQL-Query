#!/bin/bash
#create cluster in google cloud kubernetes engine
gcloud container clusters create query-gpt-cluster --num-nodes=2 --machine-type=n1-standard-1 --zone=us-central1-f --project=cisc-5550-454814
#authenticate to run kubernetes commands
gcloud components install gke-gcloud-auth-plugin
gcloud container clusters get-credentials query-gpt-cluster --zone=us-central1-f