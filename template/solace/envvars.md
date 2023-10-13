# The following environment variables are required 

| Env variable name  | Required/Optional | Description | Default |
| ------------- | ------------- | ------------- | ------------- |
| `SOLACE_CLOUD_TOKEN`  | Required  | Solace Cloud token | NA |
| `TF_VAR_solace_url`  | Required  | Solace Broker URL | NA |
| `TF_VAR_semp_username`  | Required  | Solace Broker SEMP username | NA |
| `TF_VAR_semp_password`  | Required  | Solace Broker SEMP password | NA |
| `SOL_MSG_VPN`  | Required  | Solace Broker message VPN | terraform |
| `SOLACE_MESSAGING_SERVICE`  | Optional  | The target messaging service to provision | The first messaging service in EP |