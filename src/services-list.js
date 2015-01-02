(function() {
  'use strict';

  // Displays a grid of panels each representing a service.
  var app = angular.module('services-list', [
    'infinite-scroll',

    'config-directive'
  ]);

  /**
   * Test service for services.
   */
  app.factory('ServicesProxy', function() {
    var test_data = [];

    this.generateData = function(min, max) {
      var end = +(new Date());
      var start = end - 120 * 1000;
      var data = [];
      for (var t = start; t < end; t+= 1000) {
        data.push({
          'ts': new Date(t),
          'value': _.random(min, max)
        });
      }
      return data;
    };

    for (var i = 0; i < 81; i++) {
      test_data.push({
        name: 'Service' + i,
        size: _.random(100*(1 << i), 100*(1 << (i+1))),
        errors: _.random(0, i),
        values: this.generateData(100*(1 << i), 100*(1 << (i+1)))
      });
    }

    return {
      Data: test_data,

      sorted: function(key) {
        switch (key) {
          case 'errors':
            return test_data.sort(function(a, b) {
              if (a.errors === b.errors) {
                return a.size - b.size;
              }
              return a.errors - b.errors;
            });
          case 'volume':
            return _.sortBy(test_data, function(d) { return d.size; });
          case 'alpha':
            return _.sortBy(test_data, 'name');
          default:
            return test_data;
        }
      }
    };
  });

  /**
   * Controller for the Services Grid page.
   */
  app.controller('ServicesListCtrl',
       ['_', 'Pages', 'ServicesProxy', '$routeParams', '$location', '$scope',
    function(_, Pages, ServicesProxy, $routeParams, $location, $scope) {

    _.assign(Pages.activePage, Pages.getPageById('services'));
    Pages.activePage.activeSubpage = Pages.subpageById(Pages.activePage, 'overview');

    // config
    this.perRow = $routeParams.perRow || 4;
    this.panelSizeRatio = $routeParams.panelSizeRatio || 1.618;

    if (this.perRow != 1 && this.perRow != 2 && this.perRow != 4 && this.perRow != 6) {
      // only accept 2, 4 ot 6 elements per row
      this.perRow = 4;
    }
    if (angular.element(window).width() < 768) {
      // on phones, always have one per row
      this.perRow = 1;
    }

    this.sortOrder = $routeParams.sortOrder || 'errors';



    this.filter = $routeParams.filter || '';

    var ctrl = this;

    /**
     * Returns true if the service name matches the regexp from the
     * quick filter box.
     */
    this.filterServices = function(service) {
      var re = new RegExp(ctrl.filter, 'i');
      if (re.test(service.name)) {
        return true;
      } else {
        return false;
      }
    };

    /**
     * Loads the next "page" of panels.
     */
    this.loadMore = function() {
      if (ctrl.loaded > ServicesProxy.Data.length) {
        // that was all
        return false;
      }

      var toAdd = ServicesProxy
        .sorted(ctrl.sortOrder)
        .filter(ctrl.filterServices)
        .slice(ctrl.loaded, ctrl.loaded + ctrl.pageSize);

      _.forEach(toAdd, function(panel) {
        if (_.isObject(panel)) {
          ctrl.panels.push(panel);
        } else {
          return false;
        }
      });

      ctrl.loaded += ctrl.pageSize;
    };

    this.configToggle = function() {
      this.configVisible = !this.configVisible;
    };

    /**
     * (re-)renders the services list page.
     */
    this.render = function() {

      // approximately calculate the ideal width and height of a panel
      var padding = 30;
      this.panelWidth = Math.floor((angular.element(window).width() - padding) / this.perRow) - padding;
      this.panelHeight = Math.floor(this.panelWidth / this.panelSizeRatio);

      this.rowsPerPage = $routeParams.rowsPerPage ||
        (Math.ceil(angular.element(window).height() / (this.panelHeight + padding)));
      this.pageSize = $routeParams.pageSize || this.rowsPerPage * this.perRow;

      // initial page
      ctrl.panels = [];
      ctrl.panels = ServicesProxy
        .sorted(ctrl.sortOrder)
        .filter(ctrl.filterServices)
        .slice(0, ctrl.pageSize);
      ctrl.loaded = ctrl.pageSize;
    };


    /**
     * Called when the filter is updated.
     */
    this.updateFilter = function() {
      if (ctrl.filter !== '') {
        $location.search('filter', ctrl.filter);
      } else {
        // remove the 'filter' parameter
        if ($location.$$search.filter) {
          delete $location.$$search.filter;
          $location.$$compose();
        }
      }

      ctrl.render();
    };

    this.updatePerRow = function() {
      $location.search('perRow', ctrl.perRow);
      ctrl.render();
    };

    this.updateSortOrder = function() {
      $location.search('sortOrder', ctrl.sortOrder);
      ctrl.render();
    };

    // first rendering
    ctrl.render();

  }]);
})();