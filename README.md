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

| Env variable name  | Required/Optional | Description | Default |
| ------------- | ------------- | ------------- | ------------- |
| `SOLACE_CLOUD_TOKEN`  | Required  | Solace Cloud token | NA |
| `SOLACE_MESSAGING_SERVICE`  | Optional  | The target messaging service to provision | `DEV-Kafka` |
| `CONFLUENT_CLUSTER_USER_ID`  | Optional  | kafka cluster user resource ID. For confluent deployment only | `sa-566o5z` |

- Rename the `env-config-confluent-TEMPLATE.list` to `env-config-confluent.list` and fill in the required fields

## Steps
1. `npm i`: install the required dependencies
1. `npm run promote -- -av <applicationVersionID> -mes <TargetMessagingService>`: Promote an application version and all it's associated events to the target messaging service
1. `npm run provision`: Provision the underlying kafka cluster to reflect Solace Pubsub+ Event Portal messaging service configuration

- Tip: You can set a different messaging service before running the provisioning script as follows
`SOLACE_MESSAGING_SERVICE="PROD-Kafka" npm run provision`

## Note on provisioning steps:
When running `npm run provision`, the following steps happens:
- Query the configuration for the target messaging service from Event Portal and store in [ep-config](./ep-config)
- Generate terraform configuration files for all supported broker providers and store in [terraform-config](./terraform-config)
- Provision the underlying cluster

## Configuration Files

1. `{Messaging_Service}_topic_list_{Broker_Provider_Type}.json` - Contains the list of topics in the target messaging service to be provisioned 
1. `{Messaging_Service}_acl_terraform_{Broker_Provider_Type}.json` - Contains the ACL configuration in HCL format to be provisioned
