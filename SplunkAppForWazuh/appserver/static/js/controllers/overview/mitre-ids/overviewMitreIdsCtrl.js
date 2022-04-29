/*
 * Wazuh app - Mitre Ids controller
--
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
define([
  '../../module',
  './lib/discover-search-helper',
  '../../../services/visualizations/table/table',
  '../../../services/visualizations/inputs/time-picker',
  'FileSaver',
], function (app, SearchHelper, Table, TimePicker) {
  'use strict'

  class OverviewMitreIds {
    /**
     * Class constructor
     * @param {Object} $scope
     * @param {Object} $currentDataService
     * @param {Object} $state
     * @param {Object} $notificationService
     * @param {Object} $requestService
     * @param {Object} mitre_tactics
     * @param {*} $mdDialog
     * @param {*} $dateDiffService
     * @param {*} $urlTokenModel
     * @param {*} extensions
     */

    constructor(
      $scope,
      $currentDataService,
      $state,
      $notificationService,
      $requestService,
      mitre_tactics,
      mitre_techniques,
      $mdDialog,
      $dateDiffService,
      $urlTokenModel,
      extensions
    ) {
      this.scope = $scope
      this.currentDataService = $currentDataService
      this.currentDataService.addFilter(
        `{"rule.mitre.id{}":"*", "implicit":true, "onlyShow":true}`
      )
      this.modalOpen = false
      this.api = this.currentDataService.getApi()
      this.apiReq = $requestService.apiReq
      this.state = $state
      this.scope.extensions = extensions
      this.notification = $notificationService
      this.filters = this.currentDataService.getSerializedFilters(false)
      this.scope.tactics = mitre_tactics.map(
        tactic => {
          return {
            name: tactic.name,
            count: 0
          } 
        })
      this.scope.techniques = mitre_techniques.map(
        technique => {
          return {
            ...technique,
            count: 0
          } 
        })
      this.$mdDialog = $mdDialog
      this.urlTokenModel = $urlTokenModel
      this.setBrowserOffset = $dateDiffService.setBrowserOffset
      this.reloadFilters = this.reloadFilters.bind(this)
      this.vizz = []

      try {
        this.scope.loadingModalData = false
        this.scope.$applyAsync()
        // Initialize time tokens to default
        if (
          !this.urlTokenModel.has('earliest') &&
          !this.urlTokenModel.has('latest')
        ) {
          this.urlTokenModel.set({ earliest: '0', latest: '' })
        }
        this.timePicker = new TimePicker('#timePicker', this.reloadFilters)
        if (
          !this.urlTokenModel.has('form.when.earliest') &&
          !this.urlTokenModel.has('form.when.latest')
        ) {
          this.urlTokenModel.set({
            'form.when.earliest': '0',
            'form.when.latest': '',
          })
        }
      } catch (error) {
        console.error(error)
      }

      this.scope.$applyAsync()
    }

    /**
     * Parse the results of the MITRE Tactics Search on the index.
     * 
     * For each result (row), transform the array into a named object in order
     * to be able to merge the arrays of found tactics and general tactics.
     * 
     * 
     * @param {Array} rows array of arrays. Each subarray contains a pair of 
     * string elements which are the MITRE_TACTIC_NAME and the COUNT.
     * 
     * Example:
     *  - rows: [ ["Defense Evasion", "1"] ]
     * 
     *   This is transformed to: { name: 'Defense Evasion', count: '1' }
     *   And this is later on merge with the rest of the MITRE Tactics stored
     *   on this.scope.tactics, which count is set to 0 by default.
     */
    onDataTactics(rows) {
      let foundTactics = []
      rows.forEach((row) => {
        let [name, count] = row 
        foundTactics.push({
          name,
          count,
        })
      })

      // Merge the foundTactics and sortedTactics arrays without duplicates (by name).
      let foundTacticsNames = new Set(foundTactics.map((tactic) => tactic.name))
      this.scope.sortedTactics = [
        ...foundTactics,
        ...this.scope.tactics.filter(
          (tactic) => !foundTacticsNames.has(tactic.name)
        ),
      ]

      this.scope.$applyAsync()
    }

    /**
     * Parse the results of the MITRE Techniques Search on the index.
     * 
     * For each result (row), transform the array into a named object in order
     * to be able to merge the arrays of found tecnjiques and general tecnhiques.
     * 
     * 
     * @param {Array} rows array of arrays. Each subarray contains a pair of 
     * string elements which are the MITRE_TECHNIQUE_NAME and the COUNT.
     * 
     * Example:
     *  - rows: [ ["T1562.001", "1"] ]
     * 
     *   This is transformed to: { name: 'T1562.001', count: '1' }
     *   And this is later on merge with the rest of the MITRE Techniques stored
     *   on this.scope.techniques, which count is set to 0 by default.
     */
    onDataTechniques(rows) {
      let foundTechniques = []
      rows.forEach((row) => {
        let [external_id, count] = row
        foundTechniques.push({
          external_id,
          count,
        })
      })

      // Make a copy of the techniques, look for found tecnjiques and update
      // its count.
      let techniques = this.scope.techniques
      for (const techniqueFound of foundTechniques) {
        for (let technique of techniques) {
          if (technique.external_id === techniqueFound.external_id) {
            technique.count = techniqueFound.count
          }
        }
      }
      // Sort by count
      this.scope.sortedTechniques = techniques.sort((a, b) => b.count - a.count)

      this.scope.$applyAsync()
    }

    /**
     * Clean modal table.
     */
    cleanModalTable() {
      this.vizz.forEach((vizz) => {
        // eslint-disable-next-line no-undef
        angular.element(vizz.element.el).empty()
        vizz.destroy()
      })
      this.vizz = []
    }

    /**
     * Load modal.
     */
    loadModalEventsTable() {
      this.scope.loadingModalData = true
      this.cleanModalTable()
      const table = new Table(
        'mitre-technique-details-vizz',
        `index=wazuh ${this.filters} \
        sourcetype=wazuh rule.mitre.id{}=${this.scope.selectedItem.external_id} \
        | stats count by rule.id, rule.description, rule.level \
        | sort count DESC  \
        | rename rule.id as "Rule ID", rule.description as "Description", rule.level as Level, count as Count`,
        'mitre-technique-details-vizz',
        this.scope
      )
      table.search.on('search:done', () => {
        this.scope.loadingModalData = false
        this.scope.$applyAsync()
      })
      this.vizz.push(table)
    }

    /**
     * Load Main Tactics and Techniques
     */
    loadTacticsTechniques(earliest_time, latest_time) {
      this.scope.loadingVizz = true
      if (
        typeof earliest_time == 'undefined' &&
        typeof latest_time == 'undefined'
      ) {
        earliest_time = this.urlTokenModel.get('form.when.earliest')
        latest_time = this.urlTokenModel.get('form.when.latest')
      }
      this.tacticsSearch = new SearchHelper({
        id: 'tacticsCount',
        search: `index=wazuh ${this.filters} rule.mitre.id{}=* | stats count by rule.mitre.tactic{} | sort - count`,
        onData: this.onDataTactics,
        scope: this.scope,
        earliest_time,
        latest_time,
      })

      this.techniquesSearch = new SearchHelper({
        id: 'techniquesCount',
        search: `index=wazuh ${this.filters} rule.mitre.id{}=* | stats count by rule.mitre.id{} | sort - count`,
        onData: this.onDataTechniques,
        scope: this.scope,
        earliest_time,
        latest_time,
      })
    }

    reloadFilters(input) {
      const { earliest_time, latest_time } =
        typeof input == 'object'
          ? input.settings.attributes
          : this.timePicker.input.settings.attributes

      this.filters = this.currentDataService.getSerializedFilters(false)
      this.destroy()
      this.loadTacticsTechniques(earliest_time, latest_time)
      if (this.modalOpen) {
        this.loadModalEventsTable()
      }
    }

    /**
     * On controller loads
     */
    $onInit() {
      this.scope.addingAgents = false
      this.scope.hideEmptyRows = false
      this.scope.query = (query, search) => this.query(query, search)
      this.scope.showAgent = (agent) => this.showAgent(agent)
      this.scope.goToDashboard = () => this.goToDashboard()
      this.scope.loadRegistryValueDetails = (item) =>
        this.loadRegistryValueDetails(item)
      this.scope.status = 'all'
      this.scope.osPlatform = 'all'
      this.scope.version = 'all'
      this.scope.node_name = 'all'
      this.scope.versionModel = 'all'
      this.scope.downloadCsv = () => this.downloadCsv()
      this.scope.$on('$destroy', () => {
        this.destroy()
        this.cleanModalTable()
        this.timePicker.destroy()
      })
      this.scope.reloadList = () => this.reloadList()
      this.loadTacticsTechniques()

      // Listeners
      this.scope.$on('deletedFilter', (event) => {
        event.stopPropagation()
        this.reloadFilters()
      })

      this.scope.$on('barFilter', (event) => {
        event.stopPropagation()
        event.currentScope.custom_search = ''
        this.reloadFilters()
      })
      this.scope.offsetTimestamp = (text, time) => {
        try {
          return text + this.setBrowserOffset(time)
        } catch (error) {
          return ''
        }
      }
    }

    destroy() {
      this.tacticsSearch.destroy()
      this.techniquesSearch.destroy()
    }

    /**
     * Get a MITRE technique information by ID.
     * @param {String} id valid MITRE technique ID (required).
     * @returns an object with the MITRE technique information.
     */
    async getTechniqueById(id) {
      if (!id) {
        throw new Error('No MITRE tecnhinque provided')
      }

      const fields = [
        'name',
        'mitre_version',
        'tactics',
        'description',
        'url',
        'external_id',
      ].join()

      const request = await this.apiReq(`/mitre/techniques?select=${fields}`, {
        q: `external_id=${id}`,
      })

      if (request?.data?.error) {
        throw new Error(request.data?.message || '404 Not Found')
      }
      if (request.data.data.total_affected_items === 0) {
        throw new Error(
          request.data.data.message ||
            'No MITRE techniques information was returned'
        )
      }

      return request.data.data.affected_items[0]
    }

    /**
     * Get a MITRE tactic information by ID.
     * @param {String} id comma separated MITRE tactic IDs (required).
     * @returns an array of objects with the MITRE tactic information.
     */
    async getTacticsById(tactics_ids) {
      if (!tactics_ids) {
        console.info('No MITRE tactic provided')
        return []
      }

      const fields = [
        'name',
        'url',
        'external_id',
        // 'id'
      ].join()

      const request = await this.apiReq(`/mitre/tactics?select=${fields}`, {
        tactic_ids: tactics_ids,
      })

      // If the request fails
      if (request?.data?.error) {
        throw new Error(request.data?.message || '404 Not Found')
      }
      // If the request return no inforamtion
      if (request.data.data.total_affected_items === 0) {
        throw new Error(
          request.data.data.message ||
            'No MITRE techniques information was returned'
        )
      }

      return request.data.data.affected_items
    }

    /**
     * Check the given request's response for errors.
     *
     * Throws Error if the response is invalid, due to the following criteria:
     *   - The request fails:
     *        the response object has a truthly property named `error`.
     *   - The request returns no data:
     *        the previous condition does not happen but the response hasn't
     *        returned the expected informantion (total_affected_items = 0).
     *
     * @param {Object} response the request's response object.
     * @param {String} errorMessage (optional) the error message to build the
     *  Error object, if no error message is found in the response object.
     */
    handleRequestError(response, errorMessage = 'No information was returned') {
      if (response?.data?.error) {
        throw new Error(response.data?.message || '404 Not Found')
      }
      if (response.data.data.total_affected_items === 0) {
        throw new Error(response.data.data.message || errorMessage)
      }
    }

    loadRegistryValueDetails = async (item) => {
      this.scope.selectedItem = item
      this.scope.$applyAsync()

      try {
        const {external_id, name} = this.scope.selectedItem
        const mitreTecnhique = await this.getTechniqueById(external_id)
        const mitreTecnhiqueTactics = await this.getTacticsById(
          // Generate a comma separated string.
          mitreTecnhique.tactics.join()
        )
        this.scope.selectedTechniqueTactics = []
        if (mitreTecnhiqueTactics.length > 0) {
          this.scope.selectedTechniqueTactics = mitreTecnhiqueTactics
        }

        // let tactics = [];
        // for (const tactic of mitreTecnhiqueTactics) {
        //   tactics.push(
        //     {
        //       name: tactic.name,
        //       url: tactic.url
        //     }
        //   )
        // }
        // console.log(tactics)
        // this.scope.selectedTechniqueTactics = tactics

        // eslint-disable-next-line no-undef
        var parentEl = angular.element(document.body)
        const ParentCtrl = this

        this.$mdDialog.show({
          parent: parentEl,
          scope: this.scope,
          preserveScope: true,
          template: `
            <md-dialog aria-label="List dialog" style="min-height:80%;max-width: 75%;">
                <h3 class="wz-headline-title boldText">Technique ${name}</h3>
                <md-divider class="wz-margin-top-10"></md-divider>
                <md-dialog-content class="_md flex wazuh-column wz-margin-top-10">
                    <div class="modalFlexData wz-margin-20">
                        <span>
                            <dt>ID</dt>
                            <dd>${mitreTecnhique?.external_id || 'N/A'}</dd>
                        </span>
                        <span>
                            <dt>Version</dt>
                            <dd>${mitreTecnhique?.mitre_version || 'N/A'}</dd>
                        </span>
                        <span>
                            <dt>Data sources</dt>
                            <dd>
                                <a href="${mitreTecnhique?.url}" target="_blank">
                                    ${mitreTecnhique?.url}
                                </a>
                            </dd>
                        </span>
                    </div>

                    <div class="wz-margin-20">
                        <dt>Tactics</dt>
                        <dd ng-repeat="tactic in selectedTechniqueTactics">
                            <a href="{{ tactic.url }}" target="_blank">
                              {{ tactic.name }}
                            </a>
                        </dd>
                    </div>

                    <div class="wz-margin-20">
                        <dt>Description</dt>
                        <dd>${mitreTecnhique?.description || 'No description was returned.'}</dd>
                    </div>

                    <h6 class="wz-headline-title">Events</h6>
                    <div class="pos-rel">
                        <md-divider class="wz-margin-top-10"></md-divider>
                        <div>
                            <div style="display:flex;" >
                                <wazuh-bar flex></wazuh-bar>
                                <div style="flex:0" id='timePickerModal'></div>
                            </div>
                        </div>
                        <md-divider class="wz-margin-top-10"></md-divider>
                        <div class="pos-rel" id='mitre-technique-details-vizz'></div>
                    </div>

                    <div ng-show="loadingModalData" class="wz-bg-loader">
                        <div class="wz-loader">
                            <div align='center'> Fetching data...<br />
                            <i class="fa fa-fw fa-spin fa-spinner" aria-hidden="true"></i>
                            </div>
                        </div>
                    </div>

                </md-dialog-content>
                <md-dialog-actions>
                    <md-button onclick="closeDialog()" class="splButton-primary">
                        Close
                    </md-button>
                </md-dialog-actions>
            </md-dialog>
          `,
          locals: {
            items: this.scope.selectedItem,
            loadingModalData: this.scope.loadingModalData,
          },
          onComplete: () => {
            this.timePicker = new TimePicker(
              '#timePickerModal',
              this.reloadFilters
            )
            this.modalOpen = true
          },
          controller: ($mdDialog, $scope) => {
            this.$scope = $scope
            window.closeDialog = () => {
              ParentCtrl.modalOpen = false
              ParentCtrl.cleanModalTable()
              $mdDialog.hide()
              delete window.closeDialog
            }
          },
          controllerAs: 'ctrl',
        })

        this.scope.$applyAsync()
      } catch (err) {
        this.notification.showErrorToast(err.message || String(err))
        console.error(err)
      }
    }

    /**
     * Link to Mitre Dashboard
     */
    goToDashboard() {
      this.state.go('ow-mitre', {})
    }
  }
  app.controller('overviewMitreIdsCtrl', OverviewMitreIds)
})
