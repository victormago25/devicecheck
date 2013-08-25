/*jslint sloppy: true */
/*global angular, window, console, _, $, document */

angular.module('workshop01', []);

function returnGroups() {
    var groups = [
        {title: 'HTML', selected: true},
        {title: 'CSS'},
        {title: 'Javascript'},
        {title: 'JQuery'},
        {title: 'Angular'}],
        maxGroups = _.random(1, 5);
    console.log(maxGroups);
    return groups.slice(0, maxGroups);
}

function TopicsCtrl($scope, $http, $q) {
    $scope.refresh = function () {
//        angular.forEach(returnGroups(), function (element, id) {
//            element.topics = _.range(10);
//        }, $scope.groups);
        $scope.groups = returnGroups();
        _.each($scope.groups, function (element, index) {
            element.topics = _.range(_.random(1, 10));
            element.index = index;
        });
        $scope.select = function (group) {
            _.each($scope.groups, function (element) {
                element.selected = false;
            });
            group.selected = true;
        };
        console.log($scope.groups);
//        $scope.groups = returnGroups();
    };
//    $scope.topics = _.range(10);
}
$(document).ready(function () {
    $(".tab-content").on("click", "a", function () {
        $(this).toggleClass('active');
    });
});