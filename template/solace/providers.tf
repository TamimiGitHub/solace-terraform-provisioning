terraform {
  required_providers {
    solacebroker = {
      source = "registry.terraform.io/solaceproducts/solacebroker"
    }
  }
}

# Configure the   provider
provider "solacebroker" {
  username = var.semp_username
  password = var.semp_password
  url      = var.solace_url
}