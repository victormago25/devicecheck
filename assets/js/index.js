/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS */
var deviceBasePath = 'stock/',
    deviceHistoryPath = 'history/';

angular.module('device', ['ui.bootstrap', 'firebase']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('ListCtrl', ['$scope', 'time', 'angularFireCollection', 'fbURL', function ($scope, time, angularFireCollection, fbURL) {
        $scope.stocks = angularFireCollection(fbURL + deviceBasePath, function (dataSnapshot) {
            dataSnapshot.val()['sm01'].password = 'test';
        });
        window.stocks = $scope.stocks;
        $scope.time = time;
        $scope.fbURL = fbURL;
        $scope.send = function (index) {
            var deviceRef = new Firebase($scope.fbURL + deviceBasePath + $scope.stocks[index].$id);
            deviceRef.once('value', function (dataSnapshot) {
                var currentEncryptPass = CryptoJS.MD5($scope.stocks[index].password).toString();
                if (dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === currentEncryptPass) && (dataSnapshot.child('user').val() === $scope.stocks[index].user)) {
                    $scope.stocks[index].password = '';
                    $scope.stocks[index].user = '';
                    $scope.stocks[index].lockPhrase = '';
                    $scope.stocks[index].inUse = false;
                    $scope.stocks.update($scope.stocks[index].$id);
                } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                    $scope.stocks[index].inUse = true;
                    $scope.stocks[index].lockPhrase = currentEncryptPass;
                    $scope.stocks[index].password = '';
                    $scope.stocks.update($scope.stocks[index].$id);
                }
            });
        };
    }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {controller: 'ListCtrl', templateUrl: '../../tabs.html'}).
            otherwise({redirectTo: '/'});
    }]);
