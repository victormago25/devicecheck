/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS */

angular.module('device', ['ui.bootstrap', 'firebase', 'ngTable']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    value('deviceBasePath', 'stock/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('ListCtrl', ['$scope', 'time', 'angularFireCollection', 'fbURL', 'deviceBasePath', 'ngTableParams', function ($scope, time, angularFireCollection, fbURL, deviceBasePath, ngTableParams) {
        $scope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
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
                    $scope.stocks[index].history = dataSnapshot.child('history').val();
                    $scope.stocks[index].inUse = false;
                    $scope.stocks.update($scope.stocks[index].$id);
                } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                    $scope.stocks[index].inUse = true;
                    $scope.stocks[index].lockPhrase = currentEncryptPass;
                    $scope.stocks[index].history = dataSnapshot.child('history').val();
                    $scope.stocks[index].password = '';
                    $scope.stocks.update($scope.stocks[index].$id);
                }
            });
        };
        $scope.tableParams = new ngTableParams({
            page: 1,            // show first page
            total: $scope.stocks[1] ? $scope.stocks[1].history.lenght : 20,
            count: 10           // count per page
        });

        // watch for changes of parameters
        $scope.$watch('tableParams', function (params) {
            // slice array data on pages
            if ($scope.stocks.history) {
                $scope.users = $scope.stocks[1].history.slice(
                    (params.page - 1) * params.count,
                    params.page * params.count
                );
            }
        }, true);
    }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {controller: 'ListCtrl', templateUrl: '../../tabs.html'}).
            otherwise({redirectTo: '/'});
    }]);
