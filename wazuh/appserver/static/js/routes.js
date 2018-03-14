(function () {

  function routes( $routeProvider,$locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider

    .when("/overview", {
        template : "<h2>prueba overview </h2>"
    })
    .when("/manager", {
        template : "<h2>prueba manager </h2>"
    })
    .when("/agents", {
        template : "<h2>prueba agents </h2>"
    });

  }

  angular.module('wazuhApp')
  .config([ '$routeProvider','$locationProvider', routes]);

})();