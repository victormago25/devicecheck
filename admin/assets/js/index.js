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
    })
    .directive('deviceTable', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (angular.isString(attrs.activeTable)) {
                    element.dataTable({"aoColumns": [
                        { "mData": "name" },
                        { "mData": "type" },
                        { "mData": "inUse" },
                        { "mData": "teamId" },
                        { "mData": "user" }],
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
    /*value('fbURL', 'https://device-checker-bu.firebaseio.com/').*/
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
    controller('loginCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'usersPath', '$location', 'deviceBasePath',
        function ($rootScope, angularFireCollection, fbURL, usersPath, $location, deviceBasePath) {
            /*if ($cookieStore.actual) {
                $rootScope.actualUser = $cookieStore.get('actualUser');
                $rootScope.users = $cookieStore.get('users');
                $rootScope.stocks = $cookieStore.get('stocks');
                $location.path('/mainView').replace();
                $rootScope.msgtxt = '';
            } else {*/
                $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
                $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
                $rootScope.login = function (userName, password) {
                    var found = false;
                    angular.forEach($rootScope.users, function (user) {
                        if (user.accId == userName && user.pass == password) {
                            $rootScope.actualUser = user;
                            /*$cookieStore.put('actualUser', user);
                            $cookieStore.put('users', $rootScope.users);
                            $cookieStore.put('stocks', $rootScope.stocks);*/
                            found = true;
                        }
                    }, this);
                    if ($rootScope.actualUser && found) {
                        $location.path('/mainView').replace();
                        $rootScope.msgtxt = '';
                    } else {
                        $rootScope.msgtxt = 'Usuario Invalido';
                    }
                };
            /*}*/
        }]).
    controller('ListCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'teamsPath', 'usersPath', '$location',
        function ($rootScope, angularFireCollection, fbURL, teamsPath, usersPath, $location) {
            if ($rootScope.actualUser) {
                $rootScope.teams = angularFireCollection(new Firebase(fbURL + teamsPath));
                $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
            } else {
                $location.path('/').replace();
            }
            $rootScope.includeDevice = function (url) {
                $rootScope.urlDevice = 'mainView' + url;
                $location.path('mainView' + url);
            };
        }]).
    filter('ownerTeam', function () {
        return function (teamId, teams) {
            return teams[teamId] ? teams[teamId].name : 'Free Device';
        };
    }).
    controller('DeviceCtrl', ['$rootScope', '$location', 'time', '$routeParams', 'fbURL', 'deviceBasePath',
        function ($rootScope, $location, time, $routeParams, fbURL, deviceBasePath) {
            var currentGroup = $rootScope.stocks[0];
            if (currentGroup) {
                $rootScope.actual = currentGroup[$routeParams.deviceId];
            }
            $rootScope.$watchCollection('stocks', function (newNames) {
                if ($routeParams.groupId && !$routeParams.checkItOut) {
                    var currentGroup = $rootScope.stocks[0];
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
    controller('logoutCtrl', ['$rootScope', '$location',
        function ($rootScope, $location) {
            $rootScope.logout = function () {
                delete $rootScope['actual'];
                $location.path('/');
            }
        }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {templateUrl: '/admin/login.html', controllerAs: 'device'}).
            when('/mainView', {templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            when('/mainView/:groupId/:deviceId', {controller: 'DeviceCtrl', templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            otherwise({redirectTo: '/'});
    }]);
