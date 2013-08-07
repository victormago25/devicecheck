
"use strict";

angular.module('device', ['ui.bootstrap', 'firebase']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    factory('Data', function (angularFireCollection, fbURL) {
        return angularFireCollection(fbURL + 'stock');
    }).
    config(function ($routeProvider) {
        $routeProvider.
            when('/', {controller: ListCtrl, templateUrl: '../../tabs.html'}).
            otherwise({redirectTo: '/'});
    });

function getCurrent ($scope, $id, angularFire, fbURL) {
    angularFire(fbURL + $id, $scope, 'remote', {}).
        then(function () {
            $scope.device = angular.copy($scope.remote);
            $scope.device.$id = $routeParams.deviceId;
            $scope.isClean = function () {
                return angular.equals($scope.remote, $scope.device);
            };
            $scope.send = function () {
                $scope.remote = angular.copy($scope.device);
            };
        });
}

function ListCtrl($scope, Data, angularFire, fbURL) {
   window.Data = Data;
    $scope.stocks = Data;
    $scope.send = function () {
        $scope.remote = angularFire(fbURL + $scope.device.$id, $scope, 'remote', {});
        $scope.remote = angular.copy($scope.device);
    };
}
