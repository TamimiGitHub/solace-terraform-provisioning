terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.4.0"
    }
    solacebroker = {
      source = "registry.terraform.io/solaceproducts/solacebroker"
    }
  }

  backend "s3" {
    bucket         = "terraform-ep-state-files"
    key            = "solace/$ENVNAME/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Configure the   provider
provider "solacebroker" {
  username = var.semp_username
  password = var.semp_password
  url      = var.solace_url
}