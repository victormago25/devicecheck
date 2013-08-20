/*jslint sloppy: true */
/*global angular, window, console */
var deviceBasePath = 'stock/';

function ListCtrl($scope, time, angularFire, fbURL) {
    angularFire(fbURL + deviceBasePath, $scope, 'stocks', {}).
        then(function () {
            angular.forEach($scope.stocks, function (element, id) {
                element.password = '';
                element.$id = id;
            }, $scope.stocks);
        });
    $scope.time = time;
    $scope.angularFire = angularFire;
    $scope.fbURL = fbURL;
    $scope.send = function (id) {
        var deviceRef = new Firebase($scope.fbURL + deviceBasePath + id);
//        var current = _.filter($scope.stocks, function (device) {
//            return device.$id === id;
//        });
        deviceRef.once('value', function(dataSnapshot) {
            if (dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === $scope.stocks[id].password) && (dataSnapshot.child('user').val() === $scope.stocks[id].user)) {
                $scope.stocks[id].password = '';
                deviceRef.update({inUse: false, lockPhrase: '', user: ''});
            } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                $scope.stocks[id].password = '';
                var hash = CryptoJS.MD5($scope.stocks[id].lockPhrase);
                deviceRef.update({inUse: true, lockPhrase: $scope.stocks[id].lockPhrase, user: $scope.stocks[id].user});
            }
        });
//        $scope.angularFire($scope.fbURL + deviceBasePath + id, $scope, 'remote', {}).
//            then(function () {
//                var current = _.filter($scope.stocks, function (device) {
//                    return device.$id === id;
//                });
//                if ($scope.remote.lockPhrase === current[0].lockPhrase) {
//                    $scope.remote.inUse = false;
//                    console.log('saved');
//                }
//            });
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
