# Solace Terraform Provisioning

This repo contains tools that will enable moving from Solace PubSub+ Event Portal to infrastructure provisioning. The following broker types providers are supported:

1. Confluent Cloud
1. Solace

## Environment setup

- Node 16+
- [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)

## Providers

Configurations for the following providers are generated: 

1. [Confluent Cloud](https://registry.terraform.io/providers/confluentinc/confluent/latest/docs)
1. [Solace Native](https://registry.terraform.io/providers/SolaceProducts/solacebroker/latest)

## Prerequisites

Set the following environment variables based on the provider of choice:

| Provider  | 
| ------------- |
| [Confluent](./template/confluent/envvars.md) |
| [Solace](./template/solace/envvars.md) |

## Steps
1. `npm i`: install the required dependencies
1. `npm run promote -- -f <path_to_AsyncAPI_specfile> -mes <Target_Messaging_Service>`: Promote an application version and all it's associated events to the target messaging service
1. `SOLACE_MESSAGING_SERVICE=<Target_Messaging_Service> npm run provision`: Provision the underlying kafka cluster to reflect Solace Pubsub+ Event Portal messaging service configuration

### Tips 

- You can set a different messaging service before running the provisioning script as follows
`SOLACE_MESSAGING_SERVICE="PROD-Kafka" npm run provision`
- Query the EP configuration file by running `npm run config`
- Generate the terraform configuration files by running `npm run generate`
- You can demote an application from an environment by passing a `-d` flag to the promote script as follows `npm run promote -- -f <path_to_AsyncAPI_specfile> -mes <Target_Messaging_Service> -d`

## Note on provisioning steps:
When running `npm run provision`, the following steps happens:
- Query the configuration for the target messaging service from Event Portal and store in [ep-config](./ep-config)
- Generate terraform configuration files for all supported broker providers and store in [terraform-config](./terraform-config)
- Provision the underlying cluster

## Flow
![flow](./flow.png)
