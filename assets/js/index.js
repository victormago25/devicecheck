
"use strict";

angular.module('device', ['ui.bootstrap', 'firebase']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    factory('Data', function (angularFireCollection, fbURL) {
        return angularFireCollection(fbURL + 'stock');
    }).
    config(function ($routeProvider) {
        $routeProvider.
            when('/', {controller: ListCtrl, templateUrl: '../../tabs.html'}).
            when('/active/:deviceId', {controller:ActiveCtrl, templateUrl: '../../tabs.html'}).
            otherwise({redirectTo: '/'});
    });

function ListCtrl($scope, Data) {
   window.Data = Data;
    $scope.stocks = Data;
}

function ActiveCtrl($scope, $location, $routeParams, angularFire, fbURL) {
    angularFire(fbURL + $routeParams.deviceId, $scope, 'remote', {}).
        then(function () {
            $scope.device = angular.copy($scope.remote);
            $scope.device.$id = $routeParams.deviceId;
            $scope.isClean = function () {
                return angular.equals($scope.remote, $scope.device);
            };
            $scope.send = function () {
                $scope.remote = angular.copy($scope.device);
                $location.path('/');
            };
        });
}
