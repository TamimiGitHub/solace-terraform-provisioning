#!/usr/bin/env bash

DEAFUL_MESSAGING_SERVICE="DEV-Kafka"

messaging_service="${SOLACE_MESSAGING_SERVICE:-$DEAFUL_MESSAGING_SERVICE}"
topics_list="$messaging_service"_topic_list_confluent.json
acl_list="$messaging_service"_acl_terraform_confluent.tf.json

echo "==== Provisoiniong topics and ACLs in $messaging_service messaging service from $topics_list and $acl_list ===="
echo " "
docker run --rm -v $PWD/terraform-config/$topics_list:/opt/terraform/kafka/topic-list.json -v $PWD/terraform-config/$acl_list:/opt/terraform/live/confluent-topics/acls.tf.json --env-file env-config-confluent.list ghcr.io/dennis-brinley/event-portal-terraform:0.2 