/*jslint sloppy: true */
/*global angular, window, console */
var deviceBasePath = 'stock/';

function ListCtrl($scope, time, angularFire, fbURL) {
    angularFire(fbURL + deviceBasePath, $scope, 'stocks', {}).
        then(function () {
            angular.forEach($scope.stocks, function (element, id) {
                element.lockPhrase = '';
                element.$id = id;
                element.user = (element.user === '-') ? '' : element.user;
            }, $scope.stocks);
        });
    $scope.time = time;
    $scope.angularFire = angularFire;
    $scope.fbURL = fbURL;
    $scope.send = function (id) {
        $scope.angularFire($scope.fbURL + deviceBasePath + id, $scope, 'remote', {}).
            then(function () {
                var current = _.filter($scope.stocks, function (device) {
                    return device.$id === id;
                });
                if ($scope.remote.lockPhrase === current[0].lockPhrase) {
                    $scope.remote.inUse = false;
                    console.log('saved');
                }
            });
    };
}

angular.module('device', ['ui.bootstrap', 'firebase']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {controller: ListCtrl, templateUrl: '../../tabs.html'}).
            otherwise({redirectTo: '/'});
    }]);
