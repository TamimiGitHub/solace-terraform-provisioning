# Solace Terraform Provisioning

This repo contains tools that will enable moving from Solace PubSub+ Event Portal to infrastructure provisioning. The following broker types providers are supported:

1. Confluent Cloud
1. MSK 
1. Vanilla Kafka

## Environment setup

- Node 16+
- Docker v 20.10+

## Prerequisites

Set the following environment variables

- `SOLACE_CLOUD_TOKEN`: Solace Cloud token. Mandatory.
- `SOLACE_MESSAGING_SERVICE`: The target messaging service to provision. Default: "DEV-Kafka"
- `CONFLUENT_CLUSTER_USER_ID`: kafka cluster user resource ID. For confluent deployment only. Default:sa-566o5z
- Rename the `env-config-confluent-TEMPLATE.list` to `env-config-confluent.list` and fill in the required fields

## Steps
1. `npm i`: install the required dependencies
1. `npm run provision`: Provision the underlying kafka cluster to reflect Solace Pubsub+ Event Portal messaging service configuration

## Note on provisioning steps:
When running `npm run provision`, the following steps happens:
- Query the configuration for the target messaging service from Event Portal
- Generate terraform configuration files for all supported broker providers and store in [terraform-config](./terraform-config)
- Provision the underlying cluster

## Configuration Files

1. `{Messaging_Service}_topic_list_{Broker_Provider_Type}.json` - Contains the list of topics in the target messaging service to be provisioned 
1. `{Messaging_Service}_acl_terraform_{Broker_Provider_Type}.json` - Contains the ACL configuration in HCL format to be provisioned
