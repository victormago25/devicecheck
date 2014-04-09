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
    // value('fbURL', 'https://devicetrack.firebaseio.com/').
    // value('fbURL', 'https://cl-device-control.firebaseio.com/').
    value('fbURL', 'https://devicetrack-bu.firebaseio.com/').
    value('deviceBasePath', 'stock/').
    value('teamsPath', 'teams/').
    value('usersPath', 'users/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('loginCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'usersPath', '$location',
        function ($rootScope, angularFireCollection, fbURL, usersPath, $location) {
            $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
            $rootScope.login = function (userName, password) {
                var actualUser = {},
                    found = false,
                    msgtxt = '';
                /*for (user in $rootScope.users) {
                    console.log(user);
                    if (user.accId === userName && user.pass === password) {
                        $rootScope.msgtxt = 'Correct information';
                        $rootScope.actual = user;
                        console.log($rootScope.actual);
                    } else {
                        $rootScope.msgtxt = 'Incorrect information';
                    }
                }*/
                angular.forEach($rootScope.users, function (user) {
                    if (user.accId === userName && user.pass === password) {
                        msgtxt = 'Correct information';
                        actualUser = user;
                        found = true;
                    } else {
                        msgtxt = 'Incorrect information';
                    }
                }, this);
                $rootScope.actual = actualUser;
                $rootScope.msgtxt = msgtxt;
                console.log('despues de que sale');
                console.log($rootScope.actual);
                if ($rootScope.actual && found) {
                    $location.path('/mainView').replace();
                }
            };
        }]).
    controller('ListCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'deviceBasePath', 'teamsPath', 'usersPath',
        function ($rootScope, angularFireCollection, fbURL, deviceBasePath, teamsPath, usersPath) {
            $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
            $rootScope.teams = angularFireCollection(new Firebase(fbURL + teamsPath));
            $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
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
                    var currentEncryptPass = CryptoJS.MD5(actualInfo.password).toString();
                        actualInfo.lockPhrase = currentEncryptPass;
                        updateFields = {lockPhrase: currentEncryptPass};
                });
                deviceRef.update(updateFields);
            };
            if (!$rootScope.actual) {
                $location.path('/');
            }
        }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {templateUrl: '/admin/login.html', controllerAs: 'device'}).
            when('/mainView', {controller: 'DeviceCtrl', templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            when('/:groupId/:deviceId', {controller: 'DeviceCtrl', templateUrl: '/admin/device.html', controllerAs: 'device'}).
            otherwise({redirectTo: '/'});
    }]);
