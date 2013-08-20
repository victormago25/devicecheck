/*jslint sloppy: true */
/*global angular, window, console */
var deviceBasePath = 'stock/';

function ListCtrl($scope, time, angularFire, angularFireCollection, fbURL) {
//    angularFire(fbURL + deviceBasePath, $scope, 'stocks', {}).
//        then(function () {
//            angular.forEach($scope.stocks, function (element, id) {
//                element.password = '';
//                element.$id = id;
//            }, $scope.stocks);
//        });
    $scope.stocks = angularFireCollection(fbURL + deviceBasePath, function(dataSnapshot) {
        angular.forEach(dataSnapshot.val(), function (element, id) {
                element.password = '';
                element.$id = id;
            }, $scope.stocks);
    });
    $scope.time = time;
    $scope.angularFire = angularFire;
    $scope.fbURL = fbURL;
    $scope.send = function (index) {
        var deviceRef = new Firebase($scope.fbURL + deviceBasePath + $scope.stocks[index].$id);
//        var current = _.filter($scope.stocks, function (device) {
//            return device.$id === id;
//        });
        deviceRef.once('value', function(dataSnapshot) {
            if (dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === $scope.stocks[index].password) && (dataSnapshot.child('user').val() === $scope.stocks[index].user)) {
                $scope.stocks[index].password = '';
                $scope.stocks[index].user = '';
                $scope.stocks[index].lockPhrase = '';
                $scope.stocks[index].inUse = false;
                $scope.stocks.update($scope.stocks[index].$id);
            } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                $scope.stocks[index].inUse = true;
                $scope.stocks[index].lockPhrase = $scope.stocks[index].password;
//                $scope.stocks[index].lockPhrase = CryptoJS.MD5($scope.stocks[index].password);
                $scope.stocks[index].password = '';
                $scope.stocks.update($scope.stocks[index].$id);
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
