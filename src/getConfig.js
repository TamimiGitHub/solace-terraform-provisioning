const EventPortal = require('./util/ep')
const ep = new EventPortal()
const fs = require('fs')

async function getConfig(){
  try {
    const EP_CONFIG = {}
    let {data: ms} = await ep.getMessagingServices()
    if (ms.length == 0) 
      throw new Error(`No messaging services configured in Solace PubSub+ Event Portal`)
    
    // Set target messaging service to env variable. Default to first messaging service
    const target_messaging_service = process.env.SOLACE_MESSAGING_SERVICE || ms[0].name
    // Get the target messaging service object
    target_ms = ms.filter(service => service.name == target_messaging_service)
      
    EP_CONFIG.target_messaging_service = target_ms[0]

    // Get all the applications versions associated with the target messaging service
    console.log(`Fetching all applications in '${target_messaging_service}' MS`)
    let {data: av} = await ep.getApplicationVersions({
      messagingServiceIds: target_ms[0].id
    })

    if (av.length == 0) 
      throw new Error(`No application versions in ${target_messaging_service} messaging service found`)
    
    let consumedEventsVersions = []
    let producedEventsVersions = []
    let applications = []
    
    // Get parent application of all application versions
    console.log(`Fetching configurations for every application in '${target_messaging_service}' MS`)
    for (const applicationVersion of av) {
      let {data: application_parent} = await ep.getApplicationByID({
        id: applicationVersion.applicationId
      })

      let app_summary = {
        application_name: application_parent.name,
        application_id: application_parent.id,
        consumedEventsVersions: applicationVersion.declaredConsumedEventVersionIds,
        producedEventsVersions: applicationVersion.declaredProducedEventVersionIds,
      }
      // Add consumer object for solace broker type
      EP_CONFIG.target_messaging_service.messagingServiceType == "solace" ? app_summary.consumers = applicationVersion.consumers : null
      applications.push(app_summary)
      consumedEventsVersions.push(applicationVersion.declaredConsumedEventVersionIds)
      producedEventsVersions.push(applicationVersion.declaredProducedEventVersionIds)
    }

    let events_in_MS = Array.from(new Set(consumedEventsVersions.flat().concat(producedEventsVersions.flat())));
    EP_CONFIG.applications = applications

    if (EP_CONFIG.target_messaging_service.messagingServiceType == "kafka") {
      // Get all the event versions associated with the target messaging service
      console.log(`Fetching all events in '${target_messaging_service}' MS`)
      let {data: ev} = await ep.getEventVersions({
        messagingServiceIds: target_ms[0].id
      })
  
      if (ev.length == 0) 
        throw new Error(`No event versions in '${target_messaging_service}' messaging service found`)
  
      // Get parent events of all event versions
      console.log(`Fetching configurations for every event in '${target_messaging_service}' MS`)
      let events = []
      for (const eventVersion of ev) {
        let {data: event_parent} = await ep.getEventByID({
          id: eventVersion.eventId
        })
        let {data: event_schema} = await ep.getSchemaByVersionIDs({
          ids: eventVersion.schemaVersionId
        })
        let event_summary = event_parent.customAttributes
                              .filter(attrib => attrib.customAttributeDefinitionName == "runtime-config")
                              .map(rtc => {
                                return {
                                  event_name: event_parent.name,
                                  topic: eventVersion.deliveryDescriptor.address.addressLevels[0].name,
                                  event_id: event_parent.id,
                                  event_version_id: eventVersion.id,
                                  runtime_config: JSON.parse(rtc.value),
                                  producingApplicationsVersions: eventVersion.declaredProducingApplicationVersionIds,
                                  consumingApplicationsVersions: eventVersion.declaredConsumingApplicationVersionIds,
                                  schema: {
                                    schema_version_id: eventVersion.schemaVersionId,
                                    content: JSON.parse(event_schema[0].content)
                                  },
                                }
                              })
          events.push(event_summary[0])
      }
      EP_CONFIG.events = events
    } else if (EP_CONFIG.target_messaging_service.messagingServiceType == "solace") {
      console.log(`Fetching configurations for every event in '${target_messaging_service}' MS`)
      // Populate events topics
      let events = []
      for (const eventVersion of events_in_MS) {
        let {data: event_details} = await ep.getTopicHierarchy({
          id: eventVersion
        })
        let event_summary = {
          eventVersion: eventVersion, 
          topic_hierarchy: generateHierarchy(event_details.deliveryDescriptor.address.addressLevels)
        }
        events.push(event_summary)
      }
      EP_CONFIG.events = events
    }
    console.log(`There are ${EP_CONFIG.applications.length} applications and  ${EP_CONFIG.events.length} event associated with the '${target_messaging_service}' messging service`)

    fs.writeFile(`ep-config/${target_messaging_service}.json`, JSON.stringify(EP_CONFIG, null, 2), (err) => {
      if (err) throw err;
     });

  } catch(e) {
    throw new Error(e)
  }
}

getConfig()

function generateHierarchy(levels) {
  let topic_string = ""
  levels.map(level =>{
    level.addressLevelType == "literal" ? topic_string += level.name + "/" : topic_string += "*/"
  })
  return topic_string.slice(0, -1)
}