# The following environment variables are required 

| Env variable name  | Required/Optional | Description | Default |
| ------------- | ------------- | ------------- | ------------- | 
| `SOLACE_CLOUD_TOKEN`  | Required  | Solace Cloud token | NA |
| `TF_VAR_confluent_cloud_api_key`  | Required  | Confluent cloud API Key with global access type| NA |
| `TF_VAR_confluent_cloud_api_secret`  | Required  | Confluent cloud API Secret with global access type| NA |
| `AWS_ACCESS_KEY_ID`  | Required  | AWS Key ID | NA |
| `AWS_SECRET_ACCESS_KEY`  | Required  | AWS Access Key | NA |
| `SOLACE_MESSAGING_SERVICE`  | Optional  | The target messaging service to provision | The first messaging service in EP |

- Bucket name `terraform-ep-state-files` must exist on S3
