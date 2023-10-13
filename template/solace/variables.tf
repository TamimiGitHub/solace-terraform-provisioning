variable "solace_url" {
  description = "Soalce host URL"
  type        = string
}

variable "semp_username" {
  description = "SEMP username"
  type        = string
  sensitive   = true
}

variable "semp_password" {
  description = "SEMP password"
  type        = string
  sensitive   = true
}