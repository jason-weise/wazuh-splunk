/*
 * Wazuh app - Wazuh XML file editor
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
  '../module',
  '../../libs/codemirror-conv/lib/codemirror',
  '../../libs/codemirror-conv/json-lint',
  '../../libs/codemirror-conv/javascript',
  '../../libs/codemirror-conv/brace-fold',
  '../../libs/codemirror-conv/foldcode',
  '../../libs/codemirror-conv/foldgutter',
  '../../libs/codemirror-conv/search-cursor',
  '../../libs/codemirror-conv/mark-selection',
  '../../libs/codemirror-conv/formatting',
  '../../libs/codemirror-conv/xml'
], function(app, CodeMirror) {
  'use strict'
  app.directive('wzXmlFileEditor', function(BASE_URL) {
    return {
      restrict: 'E',
      scope: {
        fileName: '@fileName',
        validFn: '&',
        data: '=data',
        targetName: '=targetName'
      },
      controller($scope, $document, $notificationService, $groupHandler) {
        /**
         * Custom .replace method. Instead of using .replace which 
         * evaluates regular expressions. 
         * Alternative using split + join, same result.
         */
        String.prototype.xmlReplace = function(str, newstr) {
          return this.split(str).join(newstr)
        }
        let firstTime = true
        const parser = new DOMParser() // eslint-disable-line

        /**
         * Escape "&" characters.
         * @param {*} text 
         */
        const replaceIllegalXML = text => {
          const oDOM = parser.parseFromString(text, 'text/html')
          const lines = oDOM.documentElement.textContent.split('\n')

          for (const line of lines) {
            const sanitized = line.trim().xmlReplace('&', '&amp')

            /**
             * Do not remove this condition. We don't want to replace
             * non-sanitized lines.
             */
            if (!line.includes(sanitized)) {
              text = text.xmlReplace(line.trim(), sanitized)
            }
          }
          return text
        }

        // Block function if there is another check in progress
        let checkingXmlError = false 
        const checkXmlParseError = () => {
          if (checkingXmlError) return
          checkingXmlError = true
          try {
            const text = $scope.xmlCodeBox.getValue()
            const xml = replaceIllegalXML(text)
            const xmlDoc = parser.parseFromString(
              '<file>' + xml + '</file>',
              'text/xml'
            )
            $scope.validFn({
              valid:
                !!xmlDoc.getElementsByTagName('parsererror').length ||
                !xml ||
                !xml.length
            })
          } catch (error) {
            $notificationService.showSimpleToast(error, 'Error validating XML')
          }
          checkingXmlError = false
          if (!$scope.$$phase) $scope.$digest()
          return
        }

        const autoFormat = () => {
          const totalLines = $scope.xmlCodeBox.lineCount()
          $scope.xmlCodeBox.autoFormatRange(
            { line: 0, ch: 0 },
            { line: totalLines - 1 }
          )
          $scope.xmlCodeBox.setCursor(0)
        }

        const saveFile = async params => {
          try {
            const text = $scope.xmlCodeBox.getValue();
            const xml = replaceIllegalXML(text);
            await $groupHandler.sendConfiguration(params.group, xml);
            $notificationService.showSimpleToast(
              'Success. Group has been updated'
            )
          } catch (error) {
            $notificationService.showSimpleToast(
              error.message || error,
              'Send file error'
            )
          }
          return
        }
        $scope.xmlCodeBox = CodeMirror.fromTextArea(
          $document[0].getElementById('xml_box'),
          {
            lineNumbers: true,
            matchClosing: true,
            matchBrackets: true,
            mode: 'text/xml',
            theme: 'ttcn',
            foldGutter: true,
            styleSelectedText: true,
            gutters: ['CodeMirror-foldgutter']
          }
        )

        const init = (data = false) => {
          try {
            $scope.xmlCodeBox.setValue(data || $scope.data)
            firstTime = false
            $scope.xmlCodeBox.refresh()
            autoFormat()
          } catch (error) {
            $notificationService.showSimpleToast('Fetching original file')
          }
        }

        init()

        $scope.$on('fetchedFile', (ev, params) => {
          if (!firstTime) {
            init(params.data)
          }
        })

        $scope.xmlCodeBox.on('change', () => {
          checkXmlParseError()
        })

        $scope.$on('saveXmlFile', (ev, params) => saveFile(params))
      },
      templateUrl:
        BASE_URL +
        '/static/app/SplunkAppForWazuh/js/directives/wz-xml-file-editor/wz-xml-file-editor.html'
    }
  })
})
