// <![CDATA[
// <![CDATA[
//
// LIBRARY REQUIREMENTS
//
// In the require function, we include the necessary libraries and modules for
// the HTML dashboard. Then, we pass variable names for these libraries and
// modules as function parameters, in order.
// 
// When you add libraries or modules, remember to retain this mapping order
// between the library or module and its function parameter. You can do this by
// adding to the end of these lists, as shown in the commented examples below.

require([
  "splunkjs/mvc",
  "splunkjs/mvc/utils",
  "splunkjs/mvc/tokenutils",
  "underscore",
  "jquery",
  "splunkjs/mvc/simplexml",
  "splunkjs/mvc/layoutview",
  "splunkjs/mvc/simplexml/dashboardview",
  "splunkjs/mvc/simplexml/dashboard/panelref",
  "splunkjs/mvc/simplexml/element/chart",
  "splunkjs/mvc/simplexml/element/event",
  "splunkjs/mvc/simplexml/element/html",
  "splunkjs/mvc/simplexml/element/list",
  "splunkjs/mvc/simplexml/element/map",
  "splunkjs/mvc/simplexml/element/single",
  "splunkjs/mvc/simplexml/element/table",
  "splunkjs/mvc/simplexml/element/visualization",
  "splunkjs/mvc/simpleform/formutils",
  "splunkjs/mvc/simplexml/eventhandler",
  "splunkjs/mvc/simplexml/searcheventhandler",
  "splunkjs/mvc/simpleform/input/dropdown",
  "splunkjs/mvc/simpleform/input/radiogroup",
  "splunkjs/mvc/simpleform/input/linklist",
  "splunkjs/mvc/simpleform/input/multiselect",
  "splunkjs/mvc/simpleform/input/checkboxgroup",
  "splunkjs/mvc/simpleform/input/text",
  "splunkjs/mvc/simpleform/input/timerange",
  "splunkjs/mvc/simpleform/input/submit",
  "splunkjs/mvc/searchmanager",
  "splunkjs/mvc/savedsearchmanager",
  "splunkjs/mvc/postprocessmanager",
  "splunkjs/mvc/simplexml/urltokenmodel"
  // Add comma-separated libraries and modules manually here, for example:
  // ..."splunkjs/mvc/simplexml/urltokenmodel",
  // "splunkjs/mvc/tokenforwarder"
],
  function (
    mvc,
    utils,
    TokenUtils,
    _,
    $,
    DashboardController,
    LayoutView,
    Dashboard,
    PanelRef,
    ChartElement,
    EventElement,
    HtmlElement,
    ListElement,
    MapElement,
    SingleElement,
    TableElement,
    VisualizationElement,
    FormUtils,
    EventHandler,
    SearchEventHandler,
    DropdownInput,
    RadioGroupInput,
    LinkListInput,
    MultiSelectInput,
    CheckboxGroupInput,
    TextInput,
    TimeRangeInput,
    SubmitButton,
    SearchManager,
    SavedSearchManager,
    PostProcessManager,
    UrlTokenModel

    // Add comma-separated parameter names here, for example: 
    // ...UrlTokenModel, 
    // TokenForwarder
  ) {

    var pageLoading = true;


    // 
    // TOKENS
    //

    // Create token namespaces
    var urlTokenModel = new UrlTokenModel();
    mvc.Components.registerInstance('url', urlTokenModel);
    var defaultTokenModel = mvc.Components.getInstance('default', { create: true });
    var submittedTokenModel = mvc.Components.getInstance('submitted', { create: true });
    var service = mvc.createService({ owner: "nobody" });

    urlTokenModel.on('url:navigate', function () {
      defaultTokenModel.set(urlTokenModel.toJSON());
      if (!_.isEmpty(urlTokenModel.toJSON()) && !_.all(urlTokenModel.toJSON(), _.isUndefined)) {
        submitTokens();
      } else {
        submittedTokenModel.clear();
      }
    });

    // Initialize tokens
    defaultTokenModel.set(urlTokenModel.toJSON());

    function submitTokens() {
      // Copy the contents of the defaultTokenModel to the submittedTokenModel and urlTokenModel
      FormUtils.submitForm({ replaceState: pageLoading });
    }

    function setToken(name, value) {
      defaultTokenModel.set(name, value);
      submittedTokenModel.set(name, value);
    }

    function unsetToken(name) {
      defaultTokenModel.unset(name);
      submittedTokenModel.unset(name);
    }

    $(document).ready(function () {
      service.request(
        "storage/collections/data/credentials/",
        "GET",
        null,
        null,
        null,
        { "Content-Type": "application/json" }, null
      ).done(function (data) {
        var parsedData = JSON.parse(data);
        console.log(parsedData)
        console.log('BASEIP', JSON.parse(data)[0].baseip);
        setToken('baseip', parsedData[0].baseip);
        setToken('baseport', parsedData[0].baseport);
        setToken('ipapi', parsedData[0].ipapi);
        setToken('portapi', parsedData[0].portapi);
        setToken('userapi', parsedData[0].userapi);
        setToken('passwordapi', parsedData[0].passapi);
        setToken("loadedtokens", "true");
      });
    })

    //
    // SEARCH MANAGERS
    //


    var search1 = new SearchManager({
      "id": "search1",
      "cancelOnUnload": true,
      "sample_ratio": null,
      "earliest_time": "-24h@h",
      "status_buckets": 0,
      "search": "| getgroups $baseip$ $baseport$ $ipapi$ $portapi$ $userapi$ $passwordapi$ | table name,merged_sum",
      "latest_time": "now",
      "app": utils.getCurrentApp(),
      "auto_cancel": 90,
      "preview": true,
      "tokenDependencies": {
      },
      "runWhenTimeIsUndefined": false
    }, { tokens: true, tokenNamespace: "submitted" });

    var search2 = new SearchManager({
      "id": "search2",
      "cancelOnUnload": true,
      "sample_ratio": 1,
      "earliest_time": "-60m@m",
      "status_buckets": 0,
      "search": "| getfilesfromgroup $baseip$ $baseport$ $ipapi$ $portapi$ $userapi$ $passwordapi$ $name$ | table filename,hash",
      "latest_time": "now",
      "app": utils.getCurrentApp(),
      "auto_cancel": 90,
      "preview": true,
      "tokenDependencies": {
      },
      "runWhenTimeIsUndefined": false
    }, { tokens: true, tokenNamespace: "submitted" });

    var search3 = new SearchManager({
      "id": "search3",
      "cancelOnUnload": true,
      "sample_ratio": 1,
      "earliest_time": "-60m@m",
      "status_buckets": 0,
      "search": "| getagentsfromgroup $baseip$ $baseport$ $ipapi$ $portapi$ $userapi$ $passwordapi$ $name$ | table id,name,ip,last_keepalive",
      "latest_time": "now",
      "app": utils.getCurrentApp(),
      "auto_cancel": 90,
      "preview": true,
      "tokenDependencies": {
      },
      "runWhenTimeIsUndefined": false
    }, { tokens: true, tokenNamespace: "submitted" });

    var search4 = new SearchManager({
      "id": "search4",
      "cancelOnUnload": true,
      "sample_ratio": null,
      "earliest_time": "$earliest$",
      "status_buckets": 0,
      "search": "| getfilecontent $baseip$ $baseport$ $ipapi$ $portapi$ $userapi$ $passwordapi$ $name$ $filename$ |",
      "latest_time": "$latest$",
      "app": utils.getCurrentApp(),
      "auto_cancel": 90,
      "preview": true,
      "tokenDependencies": {
      },
      "runWhenTimeIsUndefined": false
    }, { tokens: true, tokenNamespace: "submitted" });


    //
    // SPLUNK LAYOUT
    //

    $('header').remove();
    new LayoutView({ "hideFooter": false, "hideSplunkBar": false, "hideAppBar": false, "hideChrome": false })
      .render()
      .getContainerElement()
      .appendChild($('.dashboard-body')[0]);

    //
    // DASHBOARD EDITOR
    //

    new Dashboard({
      id: 'dashboard',
      el: $('.dashboard-body'),
      showTitle: true,
      editable: true
    }, { tokens: true }).render();


    //
    // VIEWS: VISUALIZATION ELEMENTS
    //

    var element1 = new TableElement({
      "id": "element1",
      "count": 10,
      "dataOverlayMode": "none",
      "drilldown": "row",
      "fields": ["name", "merged_sum"],
      "rowNumbers": "false",
      "wrap": "true",
      "managerid": "search1",
      "el": $('#element1')
    }, { tokens: true, tokenNamespace: "submitted" }).render();

    element1.on("click", function (e) {
      if (e.field !== undefined) {
        e.preventDefault();
        setToken("showDetails", TokenUtils.replaceTokenNames("true", _.extend(submittedTokenModel.toJSON(), e.data)));
        setToken("name", TokenUtils.replaceTokenNames("$row.name$", _.extend(submittedTokenModel.toJSON(), e.data)));
      }
    });

    var element2 = new TableElement({
      "id": "element2",
      "count": 10,
      "dataOverlayMode": "none",
      "drilldown": "row",
      "fields": ["filename", "hash"],
      "rowNumbers": "false",
      "wrap": "true",
      "managerid": "search2",
      "el": $('#element2')
    }, { tokens: true, tokenNamespace: "submitted" }).render();

    element2.on("click", function (e) {
      if (e.field !== undefined) {
        e.preventDefault();
        setToken("showFileDetails", TokenUtils.replaceTokenNames("true", _.extend(submittedTokenModel.toJSON(), e.data)));
        setToken("filename", TokenUtils.replaceTokenNames("$row.filename$", _.extend(submittedTokenModel.toJSON(), e.data)));
        console.log('click on element');
        var tokens = mvc.Components.get("default");
        var name = tokens.get("name");
        var fileName = tokens.get("filename");
        var ipBase = tokens.get("baseip");
        var ipApi = tokens.get("ipapi");
        var portApi = tokens.get("portapi");
        var passApi = tokens.get("passwordapi");
        var userApi = tokens.get("userapi");
        var portBase = tokens.get("baseport");
        var endPoint = 'http://' + ipBase + ':' + portBase + '/custom/wazuh/agents/filescontent?id=' + name + '&filename=' + fileName + '&ip=' + ipApi + '&port=' + portApi + '&user=' + userApi + '&pass=' + passApi;
        console.log("endpoint", endPoint);
        $.get(endPoint, function (data) {
          var jsonObj = JSON.parse(data);
          var jsonPretty = JSON.stringify(jsonObj[0].data, null, '\t');
          $('#filecontent').text(jsonPretty);
        }).done(function () {
          console.log("second success");
        }).fail(function () {
          console.log("error");
        }).always(function () {
          console.log("finished");
        });
      }
    });

    var element3 = new TableElement({
      "id": "element3",
      "managerid": "search3",
      "el": $('#element3')
    }, { tokens: true, tokenNamespace: "submitted" }).render();

    var element4 = new SingleElement({
      "id": "element4",
      "height": "50",
      "drilldown": "none",
      "managerid": "search4",
      "el": $('#element4')
    }, { tokens: true, tokenNamespace: "submitted" }).render();

    // Initialize time tokens to default
    if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
      defaultTokenModel.set({ earliest: '0', latest: '' });
    }

    submitTokens();


    //
    // DASHBOARD READY
    //

    DashboardController.ready();
    pageLoading = false;

  }
);
// ]]>
