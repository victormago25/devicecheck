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
    }).
    directive('deviceTable', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (angular.isString(attrs.deviceTable)) {
                    element.dataTable({"aoColumns": [
                            { "mData": function (oObj) {
                                return '<a href="#/'+oObj.$id+'">' + oObj.name + '</a>';
                            }},
                            { "mData": "type" },
                            { "mData": "os" },
                            { "mData": function (oObj) {
                                return oObj.inUse ? "<span ng-show=\"" + oObj.inUse + "\" class=\"bold-{{" + oObj.inUse + "}}\"><span class=\"icon-ban-circle\"></span> In use</span>" : "<span class=\"bold-{{" + oObj.inUse + "}}\" ng-hide=\"" + oObj.inUse + "\"><span class=\"icon-ok-circle\" ></span> Available</span>"
                            }},
                            { "mData": function (oObj) {
                                var found = {};
                                angular.forEach(scope.teams, function (team) {
                                    if (team.id === oObj.teamId) {
                                        found = team;
                                    }
                                });
                                return found.name;
                            }},
                            { "mData": "user" },
                            { "mData": "displaySize", "bVisible": false },
                            { "mData": "history", "bVisible": false },
                            { "mData": "img", "bVisible": false },
                            { "mData": "lockPhrase", "bVisible": false },
                            { "mData": "osVersion", "bVisible": false },
                            { "mData": "password", "bVisible": false }
                        ],
                        "aaSorting": [[ 2, "desc" ]]});
                    scope.$watchCollection('stocks', function (newNames) {
                        element.dataTable().fnClearTable();
                        element.dataTable().fnAddData(newNames);
                    });
                    element.dataTable().fnAddData(scope.stocks);
                }
            }
        };
    });

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives']).
    // value('fbURL', 'https://devicetrack.firebaseio.com/').
    // value('fbURL', 'https://device-checker-bu.firebaseio.com/').
    value('fbURL', 'https://devicetrack-bu.firebaseio.com/').
    value('deviceBasePath', 'stock/Devices/').
    value('teamsPath', 'teams/').
    value('usersPath', 'users/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('ListCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'deviceBasePath', 'teamsPath', 'usersPath',
        function ($rootScope, angularFireCollection, fbURL, deviceBasePath, teamsPath, usersPath) {
            $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
            $rootScope.teams = angularFireCollection(new Firebase(fbURL + teamsPath));
            $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
        }]).
    controller('DeviceCtrl', ['$rootScope', '$location', 'time', '$routeParams', 'fbURL', 'deviceBasePath',
        function ($rootScope, $location, time, $routeParams, fbURL, deviceBasePath) {
            var currentGroup = $rootScope.stocks;
            if (!$rootScope.actualUser) {
                $location.path('/').replace();
            }
            if (currentGroup) {
                $rootScope.actual = currentGroup[$routeParams.deviceId];
            }
            $rootScope.$watchCollection('stocks', function (newNames) {
                if (!$routeParams.checkItOut) {
                    var currentGroup = $rootScope.stocks;
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
                    deviceRef = new Firebase(fbURL + deviceBasePath + $routeParams.deviceId),
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
            when('/', {templateUrl: '/mainView.html', controllerAs: 'device'}).
            when('/:deviceId', {controller: 'DeviceCtrl', templateUrl: '/device.html', controllerAs: 'device'});
    }]);
