const EventPortal = require('./util/ep')
const ep = new EventPortal()
const commander = require("commander")
const fs = require('fs')
const path = require('path');
const YAML = require('yaml')

async function main() {
  commander
    .name("solace-ep-promote")
    .description(
      "This script promotes an application and all its associated consumed and produced events to a target messaging service"
    )
    .version("0.0.1", "-v, --version")
    .usage("[OPTIONS]...")
    .requiredOption(
      "-f, --specFilePath <AsyncAPI file path>",
      "The path to the AsyncAPI spec file to extract eh application version ID to be promoted"
    )
    .requiredOption(
      "-mes, --messagingService <Messaging Service Name>",
      "The target messaging service to promote to"
    )
    .option('-d, --demote', 'Demote the passed application')
    .parse(process.argv);

  const options = commander.opts();

  let spec = fs.readFileSync(`${options.specFilePath}`, 'utf8')

  switch (path.extname(options.specFilePath)) {
    case ".json":
      spec = JSON.parse(spec)
      break
    case ".yaml":
    case ".yml":
      spec = YAML.parse(spec)
      break
    default:
      throw new Error("Extension not supported")
  }
  let applicationVersionID = spec.info['x-ep-application-version-id']
  // Get the target messaging service object from EP
  let {data: ms} = await ep.getMessagingServices()
  targetMs = ms.filter(service => service.name == options.messagingService)

  if (targetMs.length == 0) 
      throw new Error(`No messaging service with the name '${options.messagingService}' found`)

  // Get the application version object from EP
  let {data: applicationVersionObject} = await ep.getApplicationByVersionID({
    id: applicationVersionID
  })

  // Get list of produced and consumed events of application version
  let consumedEventsVersions = applicationVersionObject.declaredConsumedEventVersionIds
  let producedEventsVersions = applicationVersionObject.declaredProducedEventVersionIds
  let eventsToPromote = Array.from(new Set(consumedEventsVersions.flat().concat(producedEventsVersions.flat())));
  let eventsToDemote = Array.from(new Set(producedEventsVersions.flat()));

  if (options.demote == true ) {
    demote({
      applicationVersion: applicationVersionObject,
      eventVersionIDs: eventsToDemote,
      messagingServiceID: targetMs[0].id,
      messagingServiceName: options.messagingService,
      applicationName: spec.info.title
    })
  } else {
    promote({
      applicationVersion: applicationVersionObject,
      eventVersionIDs: eventsToPromote,
      messagingServiceID: targetMs[0].id,
      messagingServiceName: options.messagingService,
      applicationName: spec.info.title
    })
  }
}

async function promote({
  applicationVersion = null,
  eventVersionIDs = null,
  messagingServiceID = null, 
  messagingServiceName = null, 
  applicationName = null, 
} = {}) {
  if (applicationVersion && eventVersionIDs == null)
    throw new Error("Promotion requires application version or event version IDs")
  
    if (messagingServiceID == null)
      throw new Error("Promotion requires target messaging service")
    
  // Execute promotion logic for application versions
  await ep.promoteApplicationVersion({
    id: applicationVersion.id,
    messagingServiceIds: Array.from(new Set(applicationVersion.messagingServiceIds.concat(messagingServiceID)))
  })

  // Execute promotion logic for event versions
  // First, get existing messaging services for every event
  // Then add the new messaging service ID to the list

  for (const eventVersionID of eventVersionIDs) {
    let {data: eventVersionObject} = await ep.getEventByVersionID({
      id: eventVersionID
    })
    await ep.promoteEventVersion({
      id: eventVersionID,
      messagingServiceIds: Array.from(new Set(eventVersionObject.messagingServiceIds.concat(messagingServiceID)))
    })
  }

  console.log(`Application ${applicationName} successfully promoted to ${messagingServiceName}!`)
}

async function demote({
  applicationVersion = null,
  eventVersionIDs = null,
  messagingServiceID = null, 
  messagingServiceName = null, 
  applicationName = null, 
} = {}) {
  if (applicationVersion && eventVersionIDs == null)
    throw new Error("Promotion requires application version or event version IDs")
  
    if (messagingServiceID == null)
      throw new Error("Promotion requires target messaging service")
  
  // Execute demotion logic for application versions
  await ep.promoteApplicationVersion({
    id: applicationVersion.id,
    messagingServiceIds: Array.from(new Set(applicationVersion.messagingServiceIds.filter(a => a !== messagingServiceID)))
  })

  // Execute demotion logic for event versions
  // First, get existing messaging services for every event
  // Then add the new messaging service ID to the list

  for (const eventVersionID of eventVersionIDs) {
    let {data: eventVersionObject} = await ep.getEventByVersionID({
      id: eventVersionID
    })
    await ep.promoteEventVersion({
      id: eventVersionID,
      messagingServiceIds: Array.from(new Set(eventVersionObject.messagingServiceIds.filter(a => a !== messagingServiceID)))
    })
  }

  console.log(`Application ${applicationName} successfully demoted from ${messagingServiceName}!`)
}


if (require.main === module) {
  main();
}
