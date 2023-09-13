const fs = require('fs')

// Globals
const target_messaging_service = process.env.SOLACE_MESSAGING_SERVICE
const broker_type = process.env.BROKER_TYPE || "confluent"

if (!target_messaging_service) {
  throw new Error('You must define a target messaging service as an environment variable !!')
}

const EP_CONFIG = JSON.parse(fs.readFileSync(`ep-config/${target_messaging_service}.json`, 'utf8'))

try {

  // Read in all template files
  const main_tf_json = fs.readFileSync(`template/${broker_type}/main.tf.json`, 'utf8').replaceAll("$ENVNAME", target_messaging_service)
  const providers_tf = fs.readFileSync(`template/${broker_type}/providers.tf`, 'utf8').replaceAll("$ENVNAME", target_messaging_service)
  const variables_tf = fs.readFileSync(`template/${broker_type}/variables.tf`, 'utf8')

  switch (broker_type) {
    case "confluent":
       // Read confluent specific templates
      generate_confluent_config(main_tf_json, providers_tf, variables_tf)
      break;
    case "solace":
      generate_solace_config()
      break;
    default:
      throw new Error(`Generating terraform configurations for Broker Type: ${broker_type} not yet supported`)
  }

} catch (err) {
  console.error(err);
}

function generate_confluent_config(main_tf_json, providers_tf, variables_tf) {
  let tf = JSON.parse(main_tf_json)

  tf = populate_resources(tf)
  tf.resource.confluent_kafka_topic = generate_confluent_kafka_topics()
  
  // Output files
  // main.tf.json
  fs.writeFile(`terraform-config/main.tf.json`, JSON.stringify(tf, null, 2), (err) => {
    if (err) throw err;
   });
  // providers.tf
  fs.writeFile(`terraform-config/providers.tf`, providers_tf, (err) => {
    if (err) throw err;
   });
   // variables.tf
  fs.writeFile(`terraform-config/variables.tf`, variables_tf, (err) => {
    if (err) throw err;
  });
}

function populate_resources(tf) {
  var [topic, app_name] = "" 
  EP_CONFIG.applications.map(application => {
    app_name = application.application_name.replaceAll(" ", "-").replaceAll("(", "").replaceAll(")", "").replaceAll(">", "").replaceAll("<", "")
    
    // Populate confluent_kafka_acl resource for all consumed events
    application.consumedEventsVersions.map(consumedEventVersion =>{
      topic = EP_CONFIG.events.filter(event => event.event_version_id == consumedEventVersion)[0].topic
      tf.resource.confluent_kafka_acl[`${app_name}_${target_messaging_service}_Read_${topic}`] = format_confluent_acl("READ", app_name, topic, "TOPIC")
      tf.resource.confluent_kafka_acl[`${app_name}_${target_messaging_service}_Read_${topic}_group`] = format_confluent_acl("READ", app_name, topic, "GROUP")
    })

    // Populate confluent_kafka_acl resource for all produced events
    application.producedEventsVersions.map(producedEventVersion =>{
      topic = EP_CONFIG.events.filter(event => event.event_version_id == producedEventVersion)[0].topic
      tf.resource.confluent_kafka_acl[`${app_name}_${target_messaging_service}_Write_${topic}`] = format_confluent_acl("WRITE", app_name, topic, "TOPIC")
    })
    
    // Populate confluent_service_account resource
    tf.resource.confluent_service_account[`${app_name}_${target_messaging_service}`] = {
      "description": `Service account to manage '${target_messaging_service}' Kafka cluster`,
      "display_name": `${app_name}-${target_messaging_service}`
    }
    // Populate confluent_api_key resource
    tf.resource.confluent_api_key[`${app_name}_${target_messaging_service}`] = {
        "description": `Kafka API Key that is owned by ${app_name} service account`,
        "display_name": `${app_name}_${target_messaging_service}`,
        "managed_resource": [
          {
            "api_version": `\${confluent_kafka_cluster.cluster-${target_messaging_service}.api_version}`,
            "environment": [
              {
                "id": `\${confluent_environment.${target_messaging_service}.id}`
              }
            ],
            "id": `\${confluent_kafka_cluster.cluster-${target_messaging_service}.id}`,
            "kind": `\${confluent_kafka_cluster.cluster-${target_messaging_service}.kind}`
          }
        ],
        "owner": [
          {
            "api_version": `\${confluent_service_account.${app_name}_${target_messaging_service}.api_version}`,
            "id": `\${confluent_service_account.${app_name}_${target_messaging_service}.id}`,
            "kind": `\${confluent_service_account.${app_name}_${target_messaging_service}.kind}`
          }
        ]
    }
  })
  return tf
}

function format_confluent_acl(operation, app_name, topic, resource_type) {
  return {
    "host": "*",
    "operation": `${operation}`,
    "pattern_type": "LITERAL",
    "permission": "ALLOW",
    "principal": `User:\${confluent_service_account.${app_name}_${target_messaging_service}.id}`,
    "resource_name": `${topic}`,
    "resource_type": `${resource_type}`,
    "provider": "confluent.kafka"
  }

}

function generate_confluent_kafka_topics() {
  topic_list = {}
  EP_CONFIG.events.map(event =>{
    topic_list[event.topic] = {
      config: generate_topic_config(event.runtime_config),
      partitions_count: event.runtime_config.kafkaTopic.partitions[0].isrCount,
      topic_name: event.topic,
      provider: "confluent.kafka",
      "lifecycle": {
        "ignore_changes": [
          "config[ \"compression.type\" ]",
          "config[ \"leader.replication.throttled.replicas\" ]",
          "config[ \"message.downconversion.enable\" ]",
          "config[ \"segment.jitter.ms\" ]",
          "config[ \"flush.ms\" ]",
          "config[ \"follower.replication.throttled.replicas\" ]",
          "config[ \"flush.messages\" ]",
          "config[ \"message.format.version\" ]",
          "config[ \"file.delete.delay.ms\" ]",
          "config[ \"max.message.bytes\" ]",
          "config[ \"min.compaction.lag.ms\" ]",
          "config[ \"preallocate\" ]",
          "config[ \"min.cleanable.dirty.ratio\" ]",
          "config[ \"index.interval.bytes\" ]",
          "config[ \"unclean.leader.election.enable\" ]",
          "config[ \"segment.index.bytes\"]"
        ]
      }
    }
  })
  return topic_list
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

function generate_solace_config() {
  console.log("Solace Terraform config generation not yet implemented")
}