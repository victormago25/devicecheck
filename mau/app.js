/*jslint sloppy: true */
/*global angular, _, $, document */
angular.module('workshop01', []);
function TopicsCtrl($scope, $http, $q) {
    $scope.refresh = function () {
        var maxGroups = _.random(1, 5),
            promise = $q.all([$http.get('./data/tab1.json'), $http.get('./data/tab2.json'), $http.get('./data/tab3.json'), $http.get('./data/tab4.json'), $http.get('./data/tab5.json')].slice(0, maxGroups));
        promise.then(function (data) {
            _.each(data, function (element, index) {
                if (index === 0) {
                    element.data.selected = true;
                }
                element.data.topics = _.range(_.random(element.data.min, element.data.max));
                element.data.index = index;
            });
            $scope.groups = data;
        });
    };
    $scope.select = function (group) {
        _.each($scope.groups, function (element) {
            element.data.selected = false;
        });
        group.selected = true;
    };
}
$(document).ready(function () {
    $(".tab-content").on("click", "a", function () {
        $(this).toggleClass('active');
    });
});
