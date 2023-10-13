const axios = require('axios')

// Class
class EventPortal {
  constructor(solaceCloudToken) {
    if (!(solaceCloudToken || process.env.SOLACE_CLOUD_TOKEN)) {
      throw new Error('You must define the Solace Cloud token')
    }
    this.token = solaceCloudToken || process.env.SOLACE_CLOUD_TOKEN
  }

  /**
  * Get list of messaging Services in account
  */
  async getMessagingServices({
    pageSize = 20,
    pageNumber = 1,
    sort = null,
    ids = null,
    messagingServiceType = null,
    runtimeAgentId = null,
    eventMeshId = null,
    eventManagementAgentId = null
  } = {} ) {
    try{
      let params = {pageSize,pageNumber,sort,ids,messagingServiceType,runtimeAgentId,eventMeshId,eventManagementAgentId}
      return await this.api(this.token, 'GET', `messagingServices`, params)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get list of event versions
  */
  async getEventVersions({
    pageSize = 20,
    pageNumber = 1,
    eventIds = null,
    ids = null,
    messagingServiceIds = null,
    customAttributes = null,
  } = {} ) {
    try{
      let params = {pageSize, pageNumber, eventIds, ids, messagingServiceIds, customAttributes}
      return await this.api(this.token, 'GET', `eventVersions`, params)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get event by ID
  */
  async getEventByID({
    id= null,
  } = {} ) {
    try{
      if (id == null) throw new Error("Event ID must be defined")
      return await this.api(this.token, 'GET', `events/${id}`)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get list of application versions
  */
  async getApplicationVersions({
    pageSize = 20,
    pageNumber = 1,
    applicationIds = null,
    ids = null,
    messagingServiceIds = null,
    customAttributes = null,
  } = {} ) {
    try{
      let params = {pageSize, pageNumber, applicationIds, ids, messagingServiceIds, customAttributes}
      return await this.api(this.token, 'GET', `applicationVersions`, params)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get application by ID
  */
  async getApplicationByID({
    id = null,
  } = {} ) {
    try{
      if (id == null) throw new Error("Application ID must be defined")
      return await this.api(this.token, 'GET', `applications/${id}`)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get application by version ID
  */
  async getApplicationByVersionID({
    id = null,
  } = {} ) {
    try{
      if (id == null) throw new Error("Application Version ID must be defined")
      return await this.api(this.token, 'GET', `applicationVersions/${id}`)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get event by version ID
  */
  async getEventByVersionID({
    id = null,
  } = {} ) {
    try{
      if (id == null) throw new Error("Event Version ID must be defined")
      return await this.api(this.token, 'GET', `eventVersions/${id}`)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Get Schema by Version ID
  */
  async getSchemaByVersionIDs({
    pageSize = 20,
    pageNumber = 1,
    schemaIds = null,
    ids = null,
    customAttributes = null
  } = {} ) {
    try{
      let params = {pageSize, pageNumber, schemaIds, ids, customAttributes}
      if (ids == null) throw new Error("Schema ID must be defined")
      return await this.api(this.token, 'GET', `schemaVersions`, params)
    } catch (error) {
      throw new Error(error)
    }
  }
 
  /**
  * Get topic hierarchy given the event version ID
  */
    async getTopicHierarchy({
      id = null,
    } = {} ) {
      try{
        if (id == null) throw new Error("Event Version ID must be defined")
        let params = {}
        return await this.api(this.token, 'GET', `eventVersions/${id}`, params)
      } catch (error) {
        throw new Error(error)
      }
    }

  /**
  * Promote application version 
  */
  async promoteApplicationVersion({
    id = null,
    messagingServiceIds = null
  } = {} ) {
    try {
      if (id == null | messagingServiceIds == null) throw new Error("Application Version ID AND Messaging Service IDs must be defined")
      let params = {}
      let data = {
        messagingServiceIds: messagingServiceIds
      }
      await this.api(this.token, 'PUT', `applicationVersions/${id}/messagingServices`, params, data)
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
  * Promote event version 
  */
  async promoteEventVersion({
    id = null,
    messagingServiceIds = null
  } = {} ) {
    try {
      if (id == null | messagingServiceIds == null) throw new Error("Events Version ID AND Messaging Service IDs must be defined")
      let params = {}
      let data = {
        messagingServiceIds: messagingServiceIds
      }
      await this.api(this.token, 'PUT', `eventVersions/${id}/messagingServices`, params, data)
    } catch (error) {
      throw new Error(error)
    }
  }
  
  async api(token, method, endpoint, params = {}, data = {}) {
    try {
      if (!token || !method || !endpoint) {
        throw new Error('You must pass a SolaceCloud Token, method, and endpoint')
      };
      
      // Add non null parameters to endpoint
      endpoint+="?"
      Object.entries(params).map( ([key, val]) => {
        val ? endpoint+=`${key}=${val}&` : null
      })
      
      const url = `https://api.solace.cloud/api/v2/architecture/${endpoint}`;
      const response = await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${
            token
          }`
        }
      });
      return response?.data
    } catch (error) {
      throw new Error(error.response.data.message)
    }
  }

}
module.exports = EventPortal
