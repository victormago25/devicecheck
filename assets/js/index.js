/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS, moment, $ */
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
                    scope.$watchCollection('actual.history', function (newNames) {
                        element.dataTable().fnClearTable();
                        element.dataTable().fnAddData(newNames);
                    });
                    if (scope.device && scope.actual && scope.actual.history) {
                        element.dataTable().fnAddData(scope.actual.history);
                    }
                }
            }
        };
    });

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives']).
    value('fbURL', 'https://cl-device-control.firebaseio.com/').
    value('deviceBasePath', 'stock/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('ListCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'deviceBasePath',
        function ($rootScope, angularFireCollection, fbURL, deviceBasePath) {
            $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
        }]).
    controller('DeviceCtrl', ['$rootScope', '$location', 'time', '$routeParams', 'fbURL', 'deviceBasePath',
        function ($rootScope, $location, time, $routeParams, fbURL, deviceBasePath) {
            var currentGroup = $routeParams.groupId === 'Smartphones' ?  $rootScope.stocks[0] : $rootScope.stocks[1];
            if (currentGroup) {
                $rootScope.actual = currentGroup[$routeParams.deviceId];
            }
            $rootScope.$watchCollection('stocks', function (newNames) {
                if ($routeParams.groupId && !$routeParams.checkItOut) {
                    var currentGroup = $routeParams.groupId === 'Smartphones' ?  $rootScope.stocks[0] : $rootScope.stocks[1];
                    if (currentGroup) {
                        $rootScope.actual = currentGroup[$routeParams.deviceId];
                    }
                } else {
                    $routeParams.checkItOut = false;
                }
            });
            $rootScope.time = time;
            $rootScope.$routeParams = $routeParams;
            $rootScope.send = function ($routeParams, input) {
                var actualInfo = $rootScope.actual,
                    devicePath = $routeParams.groupId + '/' + $routeParams.deviceId,
                    deviceRef = new Firebase(fbURL + deviceBasePath + devicePath),
                    updateFields = {};
                deviceRef.once('value', function (dataSnapshot) {
                    var currentEncryptPass = CryptoJS.MD5(actualInfo.password).toString(),
                        newRecord = {
                            user: actualInfo.user,
                            status: 'Checked-in',
                            date: moment().format("YYYY-MM-DD hh:mm:ss a")
                        },
                        historyLng,
                        inUse = dataSnapshot.child('inUse').val(),
                        lockPhrase = dataSnapshot.child('lockPhrase').val(),
                        user = dataSnapshot.child('user').val();
                    if (!actualInfo.history) {
                        actualInfo.history = [];
                    } else {
                        actualInfo.history = dataSnapshot.child('history').val();
                        historyLng = actualInfo.history.length;
                        if (historyLng >= 80) {
                            actualInfo.history = actualInfo.history.slice(historyLng - 79, historyLng);
                        }
                    }
                    if (inUse && (user === actualInfo.user)) {
                        if (lockPhrase !== currentEncryptPass) {
                            input.$error.invalid = true;
                            input.$valid = false;
                            input.$invalid = true;
                        } else {
                            input.$error.invalid = false;
                            input.$valid = true;
                            input.$invalid = false;
                            actualInfo.user = '';
                            actualInfo.lockPhrase = '';
                            actualInfo.history.push(newRecord);
                            actualInfo.inUse = false;
                            updateFields = {inUse: false, user: '', password: '', lockPhrase: '', history: actualInfo.history};
                        }
                    } else if (!inUse && (lockPhrase === '') && (user === '')) {
                        newRecord.status = 'Checked-out';
                        actualInfo.inUse = true;
                        actualInfo.lockPhrase = currentEncryptPass;
                        actualInfo.history.push(newRecord);
                        $routeParams.checkItOut = true;
                        updateFields = {inUse: true, user: actualInfo.user, password: '', lockPhrase: currentEncryptPass, history: actualInfo.history};
                    }
                });
                deviceRef.update(updateFields);
            };
            if (!$rootScope.actual) {
                $location.path('/');
            }
        }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/:groupId/:deviceId', {controller: 'DeviceCtrl', templateUrl: '/devicetracker/device.html', controllerAs: 'device'}).
            otherwise({redirectTo: '/'});
    }]);
