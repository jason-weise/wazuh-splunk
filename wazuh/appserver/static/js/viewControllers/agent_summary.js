/*
 * Wazuh app - Overview agent summary controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

require([
  "jquery",
  "splunkjs/mvc/layoutview",
  "/static/app/wazuh/js/customViews/agentsTable.js",
  "/static/app/wazuh/js/utilLib/services.js",
  "/static/app/wazuh/js/customViews/toaster.js",
  "/static/app/wazuh/js/utilLib/promisedReq.js"

],
  function (
    $,
    LayoutView,
    agentsTable,
    services,
    Toast,
    promisedReq

  ) {

    const service = new services()
    service.checkConnection().then(() => {

      /**
       * Initializes agent table
       */
      const initializeAgentTable = async () => {
        try {
          const { baseUrl, jsonData } = await service.loadCredentialData()
          const urlData = {
            baseUrl: baseUrl,
            ipApi: jsonData.url,
            portApi: jsonData.portapi,
            userApi: jsonData.userapi,
            passApi: jsonData.passapi
          }
          const table = new agentsTable($('#row1'))
          table.build(urlData)
        } catch (err) {
          console.error(err)
        }
      }

      /**
       * On document ready load agent table
       */
      $(document).ready(() => initializeAgentTable())

      $('header').remove()
      new LayoutView({ "hideFooter": false, "hideChrome": false, "hideSplunkBar": false, "hideAppBar": false })
        .render()
        .getContainerElement()
        .appendChild($('.dashboard-body')[0])

    }).catch((err) => { window.location.href = '/en-US/app/wazuh/API' })
  }
)

