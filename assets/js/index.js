/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS */
angular.module('devicechecker.directives', [])
    .directive('activeTable', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (angular.isString(attrs.activeTable)) {
                    element.dataTable({"aoColumns": [
                        { "mData": "user" },
                        { "mData": "status" },
                        { "mData": "date" }],
                        "aaSorting": [[ 2, "desc" ]]});
                    if(scope.stocks[attrs.activeTable].history) {
                        element.dataTable().fnAddData(scope.stocks[attrs.activeTable].history);
                    }
                }
            }
        };
    });

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    value('deviceBasePath', 'stock/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('ListCtrl', ['$scope', 'time', 'angularFireCollection', 'fbURL', 'deviceBasePath', function ($scope, time, angularFireCollection, fbURL, deviceBasePath) {
        $scope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
        window.stocks = $scope.stocks;
        $scope.time = time;
        $scope.fbURL = fbURL;
        $scope.send = function (index) {
            var deviceRef = new Firebase($scope.fbURL + deviceBasePath + $scope.stocks[index].$id);
            deviceRef.once('value', function (dataSnapshot) {
                var currentEncryptPass = CryptoJS.MD5($scope.stocks[index].password).toString(),
                    newRecord = {
                        user: $scope.stocks[index].user,
                        status: 'Checked-in',
                        date: new Date().toString()
                    };
                if (!$scope.stocks[index].history) {
                    $scope.stocks[index].history = [];
                } else {
                    $scope.stocks[index].history = dataSnapshot.child('history').val();
                }
                if (dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === currentEncryptPass) && (dataSnapshot.child('user').val() === $scope.stocks[index].user)) {
                    $scope.stocks[index].password = '';
                    $scope.stocks[index].user = '';
                    $scope.stocks[index].lockPhrase = '';
                    $scope.stocks[index].history.push(newRecord);
                    $scope.stocks[index].inUse = false;
                    $scope.stocks.update($scope.stocks[index].$id);
                } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                    newRecord.status = 'Checked-out';
                    $scope.stocks[index].inUse = true;
                    $scope.stocks[index].lockPhrase = currentEncryptPass;
                    $scope.stocks[index].history.push(newRecord);
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
