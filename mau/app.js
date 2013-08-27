/*jslint sloppy: true */
/*global angular, _, $, document */
var myApp = angular.module('workshop01', []).
    controller('TopicsCtrl', ['$scope', '$http', '$q', function ($scope, $http, $q) {
        $scope.refresh = function () {
            var promise = $q.all([$http.get('./data/tab1.json'), $http.get('./data/tab2.json'), $http.get('./data/tab3.json'), $http.get('./data/tab4.json'), $http.get('./data/tab5.json')].slice(0, _.random(1, 5)));
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
    }]);
$(document).ready(function () {
    $(".tab-content").on("click", "a", function () {
        $(this).toggleClass('active');
    });
});
