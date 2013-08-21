/*jslint sloppy: true */
/*global angular, window, console */

function TodoCtrl($scope) {
    $scope.todos = [
        {text: 'learn angular', done: true},
        {text: 'build an angular app', done: false}];
}