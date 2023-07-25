const EventPortal = require('./util/ep')
const ep = new EventPortal()
const commander = require("commander");

async function main() {
  commander
    .name("solace-ep-promote")
    .description(
      "This script promotes an application and all its associated consumed and produced events to a target messaging service"
    )
    .version("0.0.1", "-v, --version")
    .usage("[OPTIONS]...")
    .requiredOption(
      "-av, --applicationVersionID <ApplicationVersionID>",
      "The ID of the application version to be promoted"
    )
    .requiredOption(
      "-mes, --messagingService <Messaging Service Name>",
      "The target messaging service to promote to"
    )
    .parse(process.argv);

  const options = commander.opts();

  // Get the target messaging service object from EP
  let {data: ms} = await ep.getMessagingServices()
  targetMs = ms.filter(service => service.name == options.messagingService)

  // Get the application version object from EP
  let {data: applicationVersionObject} = await ep.getApplicationByVersionID({
    id: options.applicationVersionID
  })

  // Get list of produced and consumed events of application version
  let consumedEventsVersions = applicationVersionObject.declaredConsumedEventVersionIds
  let producedEventsVersions = applicationVersionObject.declaredProducedEventVersionIds
  let eventsToPromote = Array.from(new Set(consumedEventsVersions.flat().concat(producedEventsVersions.flat())));
  promote({
    applicationVersion: applicationVersionObject,
    eventVersionIDs: eventsToPromote,
    messagingServiceID: targetMs[0].id
  })

}

async function promote({
  applicationVersion = null,
  eventVersionIDs = null,
  messagingServiceID = null, 
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

}

if (require.main === module) {
  main();
}

