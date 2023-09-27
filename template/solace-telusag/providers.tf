

terraform {
  required_providers {
    solace = {
      source = "telus-agcg/solace"
      version = "0.8.7"
    }
  }
}

provider "solace" {
  username = var.SOL_USERNAME
  password = var.SOL_PASSWORD
  scheme   = var.SOL_PROTOCOL
  hostname = var.SOL_HOSTNAME
}