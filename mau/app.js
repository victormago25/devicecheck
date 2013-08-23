/*jslint sloppy: true */
/*global angular, window, console, _ */

angular.module('workshop01', []).
    directive('workshop01.directives.tab', function () {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},
            controller: function ($scope, $element) {
                var panes = $scope.panes = [];

                $scope.select = function (pane) {
                    angular.forEach(panes, function (pane) {
                        pane.selected = false;
                    });
                    pane.selected = true;
                };
                this.addPane = function (pane) {
                    if (panes.length === 0) {
                        $scope.select(pane);
                    }
                    panes.push(pane);
                };
            },
            template:
                    '<div class="tabbable">' +
                    '<ul class="nav nav-tabs">' +
                    '<li ng-repeat="pane in panes" ng-class="{active:pane.selected}">' +
                    '<a hrefs="" ng-click="select(pane)">{{pane.title}}</a>' +
                    '</li>' +
                    '</ul>' +
                    '<div class="tab-content" ng-transclude></div>' +
                    '</div>',
            replace: true
        };
    }).
    directive('pane', function () {
        return {
            require: '^tabs',
            restrict: 'E',
            transclude: true,
            scope: {title: '@'},
            link: function (scope, element, attrs, tabsCtrl) {
                tabsCtrl.addPane(scope);
            },
            template:
                    '<div class="tab-pane" ng-class="{active: selected}" ng-transclude>' +
                    '</div>',
            replace: true
        };
    });

function returnGroups() {
    var groups = [
        {text: 'HTML', classes: 'active'},
        {text: 'CSS'},
        {text: 'Javascript'},
        {text: 'JQuery'},
        {text: 'Angular'}],
        maxGroups = _.random(1, 5);
    console.log(maxGroups);
    return groups.slice(0, maxGroups);
}

function TopicsCtrl($scope) {
    $scope.refresh = function () {
        $scope.groups = returnGroups();
    };
    $scope.topics = _.range(10);
}
