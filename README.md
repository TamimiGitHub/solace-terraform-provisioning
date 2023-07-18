# Solace Terraform Provisioning

This repo contains tools that will enable moving from Solace PubSub+ Event Portal to infrastructure provisioning

## Environment setup

- Node 16+
- `npm i` - install the required dependencies

## Environment Variables

Set the following environment variables

- `SOLACE_CLOUD_TOKEN`: Solace Cloud token
- `SOLACE_MESSAGING_SERVICE`: The target messaging service to provision

## Steps

1. Query the configuration for the target messaging service from Event Portal `node getConfig.js`
1. Generate the terraform configuration files `node generateTerraform.js`
1. All configuration files are stored in the `terraform-config` directory


## Configuration Files

1. `{Messaging_Service}_topic_list_{Broker_Type}.json` - Contains the list of topics in the target messaging service to be provisioned 
1. `{Messaging_Service}_acl_terraform_{Broker_Type}.json` - Contains the ACL configuration in HCL format to be provisioned