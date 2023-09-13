terraform {
  required_providers {
    solace = {
      source = "telus-agcg/solace"
      version = "0.8.7"
    }
  }
}

provider "solace" {
  username = "us-central-dev-admin"
  password = "hct9i0mbjgcr2n3b0ev1ccvi1a"
  scheme   = "https"
  hostname = "mr-connection-6tvbh2lqo1y.messaging.solace.cloud:943"
}

resource "solace_queue_subscription" "ups_shipping" {
  queue_name      = "ups_shipping"
  msg_vpn_name    = "us-central-dev"
  subscription_topic = "acmeretail/fulfillment/order/shipped/v1/ups/>"
}

resource "solace_queue_subscription" "fedex_shipping" {
  queue_name      = "fedex_shipping"
  msg_vpn_name    = "us-central-dev"
  subscription_topic = "acmeretail/fulfillment/order/shipped/v1/fedex/>"
}


resource "solace_queue" "ups_shipping" {
  queue_name      = "ups_shipping"
  msg_vpn_name    = "us-central-dev"
  ingress_enabled = true
  egress_enabled  = true
  access_type     = "non-exclusive"
  max_ttl         = 60
}


resource "solace_queue" "fedex_shipping" {
  queue_name      = "fedex_shipping"
  msg_vpn_name    = "us-central-dev"
  ingress_enabled = true
  egress_enabled  = true
  access_type     = "non-exclusive"
  max_ttl         = 60
}


resource "solace_aclprofile" "fedex_aclprofile" {
  msg_vpn_name                   = "us-central-dev"
  acl_profile_name               = "fedex_aclprofile"
  client_connect_default_action  = "allow"
  publish_topic_default_action   = "disallow"
  subscribe_topic_default_action = "disallow"
}



resource "solace_aclprofile_publish_exception" "fedex_allow_pub" {
  msg_vpn_name = "us-central-dev"
  acl_profile_name  = "fedex_aclprofile"
  topic_syntax = "smf"
  publish_exception_topic       = "acmeretail/fulfillment/order/shipped/v1/fedex/>"
}

resource "solace_aclprofile_subscribe_exception" "fedex_allow_sub" {
  msg_vpn_name = "us-central-dev"
  acl_profile_name  = "fedex_aclprofile"
  topic_syntax = "smf"
  subscribe_exception_topic      = "#P2P/QUE/fedex_shipping"
}


resource "solace_aclprofile" "ups_aclprofile" {
  msg_vpn_name                   = "us-central-dev"
  acl_profile_name               = "ups_aclprofile"
  client_connect_default_action  = "allow"
  publish_topic_default_action   = "disallow"
  subscribe_topic_default_action = "disallow"
}



resource "solace_aclprofile_publish_exception" "ups_allow_pub" {
  msg_vpn_name = "us-central-dev"
  acl_profile_name  = "ups_aclprofile"
  topic_syntax = "smf"
  publish_exception_topic       = "acmeretail/fulfillment/order/shipped/v1/ups/>"
}

resource "solace_aclprofile_subscribe_exception" "ups_allow_sub" {
  msg_vpn_name = "us-central-dev"
  acl_profile_name  = "ups_aclprofile"
  topic_syntax = "smf"
  subscribe_exception_topic      = "#P2P/QUE/ups_shipping"
}


