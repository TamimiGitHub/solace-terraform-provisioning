const fs = require('fs')

// Input: EP_CONFIG
// Output:
//    1. Topics in JSON format. See confluent example
//    2. ACLs in HCL format - Terraform Resource

try {
  const target_messaging_service = process.env.SOLACE_MESSAGING_SERVICE || "DEV-Kafka"
  const EP_CONFIG = JSON.parse(fs.readFileSync(`ep-config/${target_messaging_service}.json`, 'utf8'))

  // Generate Topic and ACL Resource Terraform configuration files for the list of providers
  let provider_type = ["msk", "confluent"]
  provider_type.map(type => {
    generate_topic_list(EP_CONFIG, type)
    generate_hcl_json(EP_CONFIG, type)
  })

} catch (err) {
  console.error(err);
}

function generate_topic_list(EP_CONFIG, provider_type) {
  topic_list = {}
  EP_CONFIG.events.map(event =>{
    if (provider_type == 'msk') {
      topic_list[event.topic] = {
        config: generate_topic_config(event.runtime_config),
        replication_factor: event.runtime_config.kafkaTopic.partitions[0].isrCount,
        partitions_count: event.runtime_config.kafkaTopic.partitions[0].isrCount
      }
    } else {
      topic_list[event.topic] = {
        config: generate_topic_config(event.runtime_config),
        partitions_count: event.runtime_config.kafkaTopic.partitions[0].isrCount
      }
    }
  })
  fs.writeFile(`terraform-config/${EP_CONFIG.target_messaging_service.name}_topic_list_${provider_type}.json`, JSON.stringify(topic_list, null, 2), (err) => {
    if (err) throw err;
   });
}

function generate_topic_config(runtime_config){
  let config =  {
      "compression.type": runtime_config.kafkaTopic['compression.type'] ? runtime_config.kafkaTopic['compression.type'].toString() : null,
			"leader.replication.throttled.replicas": runtime_config.kafkaTopic['leader.replication.throttled.replicas'] ? runtime_config.kafkaTopic['leader.replication.throttled.replicas'].toString() : null,
			"message.downconversion.enable": runtime_config.kafkaTopic['message.downconversion.enable'] ? runtime_config.kafkaTopic['message.downconversion.enable'].toString() : null,
			"min.insync.replicas": runtime_config.kafkaTopic['min.insync.replicas'] ? runtime_config.kafkaTopic['min.insync.replicas'].toString() : null,
			"segment.jitter.ms": runtime_config.kafkaTopic['segment.jitter.ms'] ? runtime_config.kafkaTopic['segment.jitter.ms'].toString() : null,
			"cleanup.policy": runtime_config.kafkaTopic['cleanup.policy'] ? runtime_config.kafkaTopic['cleanup.policy'].toString() : null,
			"flush.ms": "9223372036854775807",
			// "flush.ms": runtime_config.kafkaTopic['flush.ms'] ? runtime_config.kafkaTopic['flush.ms'].toString() : null,
			"follower.replication.throttled.replicas": runtime_config.kafkaTopic['follower.replication.throttled.replicas'] ? runtime_config.kafkaTopic['follower.replication.throttled.replicas'].toString() : null,
			"segment.bytes": runtime_config.kafkaTopic['segment.bytes'] ? runtime_config.kafkaTopic['segment.bytes'].toString() : null,
			"retention.ms": runtime_config.kafkaTopic['retention.ms'] ? runtime_config.kafkaTopic['retention.ms'].toString() : null,
			"flush.messages": "9223372036854775807",
			// "flush.messages": runtime_config.kafkaTopic['flush.messages'] ? runtime_config.kafkaTopic['flush.messages'].toString() : null,
			"message.format.version": runtime_config.kafkaTopic['message.format.version'] ? runtime_config.kafkaTopic['message.format.version'].toString() : null,
			"max.compaction.lag.ms": "9223372036854775807",
			// "max.compaction.lag.ms": runtime_config.kafkaTopic['max.compaction.lag.ms'] ? runtime_config.kafkaTopic['max.compaction.lag.ms'].toString() : null,
			"file.delete.delay.ms": runtime_config.kafkaTopic['file.delete.delay.ms'] ? runtime_config.kafkaTopic['file.delete.delay.ms'].toString() : null,
			"max.message.bytes": runtime_config.kafkaTopic['max.message.bytes'] ? runtime_config.kafkaTopic['max.message.bytes'].toString() : null,
			"min.compaction.lag.ms": runtime_config.kafkaTopic['min.compaction.lag.ms'] ? runtime_config.kafkaTopic['min.compaction.lag.ms'].toString() : null,
			"message.timestamp.type": runtime_config.kafkaTopic['message.timestamp.type'] ? runtime_config.kafkaTopic['message.timestamp.type'].toString() : null,
			"preallocate": runtime_config.kafkaTopic['preallocate'] ? runtime_config.kafkaTopic['preallocate'].toString() : null,
			"min.cleanable.dirty.ratio": runtime_config.kafkaTopic['min.cleanable.dirty.ratio'] ? runtime_config.kafkaTopic['min.cleanable.dirty.ratio'].toString() : null,
			"index.interval.bytes": runtime_config.kafkaTopic['index.interval.bytes'] ? runtime_config.kafkaTopic['index.interval.bytes'].toString() : null,
			"unclean.leader.election.enable": runtime_config.kafkaTopic['unclean.leader.election.enable'] ? runtime_config.kafkaTopic['unclean.leader.election.enable'].toString() : null,
			"retention.bytes": runtime_config.kafkaTopic['retention.bytes'] ? runtime_config.kafkaTopic['retention.bytes'].toString() : null,
			"delete.retention.ms": runtime_config.kafkaTopic['delete.retention.ms'] ? runtime_config.kafkaTopic['delete.retention.ms'].toString() : null,
			"segment.ms": runtime_config.kafkaTopic['segment.ms'] ? runtime_config.kafkaTopic['segment.ms'].toString() : null,
			"message.timestamp.difference.max.ms": "9223372036854775807",
			// "message.timestamp.difference.max.ms": runtime_config.kafkaTopic['message.timestamp.difference.max.ms'] ? runtime_config.kafkaTopic['message.timestamp.difference.max.ms'].toString() : null,
			"segment.index.bytes": runtime_config.kafkaTopic['segment.index.bytes'] ? runtime_config.kafkaTopic['segment.index.bytes'].toString() : null
  }

  // Remove null vars
  Object.keys(config).forEach(key => {
    if (config[key] == null) {
      delete config[key];
    }
  });

  return sortObject(config)
}

function sortObject(obj) {
  return Object.keys(obj).sort().reduce(function (result, key) {
      result[key] = obj[key];
      return result;
  }, {});
}

function generate_hcl_json(EP_CONFIG, provider_type) {
  let tf = []
  var [operation, topic, app_name, alias, acl_principal] = "" 
  EP_CONFIG.applications.map(application => {
    app_name = application.application_name.replaceAll(" ", "-").replaceAll("(", "").replaceAll(")", "").replaceAll(">", "").replaceAll("<", "")
    acl_principal = application.acl_principal

    // Create resource for all consumed events
    application.consumedEventsVersions.map(consumedEventVersion =>{
      operation = "Read",
      topic = EP_CONFIG.events.filter(event => event.event_version_id == consumedEventVersion)[0].topic
      alias = `${app_name}_${operation}_${topic}`
      tf.push(format_tf_resource(operation, topic, alias, acl_principal, provider_type))
    })

    // Create resource for all produced events
    application.producedEventsVersions.map(producedEventVersion =>{
      operation = "Write",
      topic = EP_CONFIG.events.filter(event => event.event_version_id == producedEventVersion)[0].topic
      alias = `${app_name}_${operation}_${topic}`
      tf.push(format_tf_resource(operation, topic, alias, acl_principal, provider_type))
    })
  })
  fs.writeFile(`terraform-config/${EP_CONFIG.target_messaging_service.name}_acl_terraform_${provider_type}.tf.json`, JSON.stringify(tf, null, 2), (err) => {
    if (err) throw err;
   })
}

function format_tf_resource(operation, topic, alias, acl_principal, provider_type) {
  let config = {}
  switch(provider_type) {
    case 'msk':
      config = {
        "resource": {
          "kafka_acl": {
            [alias] : {
              "resource_name": topic,
              "resource_type": "Topic",
              "acl_principal": `User:${acl_principal}`,
              "acl_host": "*",
              "acl_operation": operation, 
              "acl_permission_type": "Allow"
            }
          }
        }
      }
      break;
    case 'confluent':
      config = {
        "resource": {
          "confluent_kafka_acl": {
            [alias] : {
              "resource_type": "Topic",
              "resource_name": topic,
              "pattern_type" : "LITERAL",
              "principal": `User:${acl_principal}`,
              "host": "*",
              "operation" : operation, 
              "permission": "Allow",
              "lifecycle" : {
                "prevent_destroy" : true
              }
            },
          }
        }
      }
      break;
    default:
      throw new Error(`Provider type ${provider_type} not supported for ACL generation`)
  }

  return config
}