variable "SOL_HOSTNAME" {
  description = "The PubSub+ Solace hostname"
  type        = string
  sensitive   = true
}

variable "SOL_USERNAME" {
  description = "The PubSub+ Solace username"
  type        = string
  sensitive   = true
}

variable "SOL_PASSWORD" {
  description = "The PubSub+ Solace password"
  type        = string
  sensitive   = true
}

# TO-DO: check how to pass default values to TF variables
variable "SOL_PROTOCOL" {
  description = "The PubSub+ Solace scheme. Defualt HTTPS"
  type        = string
  sensitive   = true
}
