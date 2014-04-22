/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS, moment, $ */
angular.module('devicechecker.directives', []).
    directive('activeTable', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                console.log(scope.actual);
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
    directive('deviceTable', function ($location, $compile) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (angular.isString(attrs.deviceTable)) {
                    element.dataTable({"aoColumns": [
                            { "mData": function (oObj) {
                                return '<a href= "#/mainView/' + oObj.$id + '" data-device="/' + oObj.$id + '" ng-click="includeDevice(\'/'+oObj.$id+'\')">' + oObj.name + '</a>'
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
                        element.on('click', 'a[data-device]', function (e) {
                            var url = 'mainView' + this.getAttribute('data-device');
                            $location.path(url);
                        });
                    });
                    element.dataTable().fnAddData(scope.stocks);
                    $compile(element.contents())(scope);
                }
            }
        };
    });

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives']).
    // value('fbURL', 'https://devicetrack.firebaseio.com/').
    // value('fbURL', 'https://cl-device-control.firebaseio.com/').
    value('fbURL', 'https://devicetrack-bu.firebaseio.com/').
    // value('fbURL', 'https://device-checker-bu.firebaseio.com/').
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
    controller('loginCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'usersPath', '$location', 'deviceBasePath', 'teamsPath',
        function ($rootScope, angularFireCollection, fbURL, usersPath, $location, deviceBasePath, teamsPath) {
            /*if ($cookieStore.actual) {
                $rootScope.actualUser = $cookieStore.get('actualUser');
                $rootScope.users = $cookieStore.get('users');
                $rootScope.stocks = $cookieStore.get('stocks');
                $location.path('/mainView').replace();
                $rootScope.msgtxt = '';
            } else {*/
            $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
            $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
            $rootScope.teams = angularFireCollection(new Firebase(fbURL + teamsPath));
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
    controller('ListCtrl', ['$rootScope', '$location',
        function ($rootScope, $location) {
            if (!$rootScope.actualUser) {
                $location.path('/').replace();
            }
            $rootScope.includeDevice = function (url) {
                $rootScope.urlDevice = 'mainView' + url;
                $location.path('mainView' + url);
            };
        }]).
    controller('DeviceCtrl', ['$rootScope', '$location', 'time', '$routeParams', 'fbURL', 'deviceBasePath',
        function ($rootScope, $location, time, $routeParams, fbURL, deviceBasePath) {
            var currentGroup = $rootScope.stocks;
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
                    devicePath = $routeParams.deviceId,
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
            when('/mainView', {controller:'ListCtrl', templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            when('/mainView/:deviceId', {controller: 'DeviceCtrl', templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            otherwise({redirectTo: '/'});
    }]);
