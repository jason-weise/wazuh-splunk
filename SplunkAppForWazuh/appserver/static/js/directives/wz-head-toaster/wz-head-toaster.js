/*
 * Wazuh app - Top nav bar directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
define(['../module'], function (directives) {
  'use strict'
  directives.directive('wzHeadToaster', function (BASE_URL) {
    return {
      controller: function (
        $scope,
      ) {
        //Listens for show toaster
        $scope.$on('showHeadToaster', (event, data) => {
          try {
            $scope.messageType = data.type
            $scope.message = data.msg
            $scope.showHeadToaster = true  
            if (data.delay) {
              $scope.showSpinner = true
              setTimeout(() => { 
                $scope.showHeadToaster = false
                $scope.showSpinner = false
               }, 5000)
            }
          } catch (error) {
            $scope.showHeadToaster = false
            $scope.showSpinner = false
          }
        })

        $scope.$on('wazuhNotReadyYet', (event, data) => {
          //Create logic
        })
      },
      templateUrl:
        BASE_URL +
        '/static/app/SplunkAppForWazuh/js/directives/wz-head-toaster/wz-head-toaster.html'
    }
  })
})
