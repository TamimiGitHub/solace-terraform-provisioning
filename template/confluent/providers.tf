terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.4.0"
    }
     confluent = {
      source = "confluentinc/confluent"
      version = "1.51.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-ep-state-files"
    key            = "$ENVNAME/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

provider "confluent" {
  cloud_api_key = var.confluent_cloud_api_key
  cloud_api_secret = var.confluent_cloud_api_secret
}

provider "confluent" {
  alias = "kafka"

  cloud_api_key = var.confluent_cloud_api_key
  cloud_api_secret = var.confluent_cloud_api_secret

  kafka_id = confluent_kafka_cluster.cluster-$ENVNAME.id
  kafka_rest_endpoint = confluent_kafka_cluster.cluster-$ENVNAME.rest_endpoint
  kafka_api_key = confluent_api_key.app-manager-$ENVNAME-kafka-api-key.id
  kafka_api_secret = confluent_api_key.app-manager-$ENVNAME-kafka-api-key.secret
}