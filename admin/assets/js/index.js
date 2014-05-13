/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS, moment, $ */
angular.module('devicechecker.directives', []).
    directive('activeTable', function () {
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
                            return '<a href="#/' + oObj.$id + '">' + oObj.name + '</a>';
                        }},
                        { "mData": "type" },
                        { "mData": "os" },
                        { "mData": function (oObj) {
                            return oObj.inUse ? "<span ng-show=\"" + oObj.inUse + "\" class=\"bold-{{" + oObj.inUse + "}}\"><span class=\"icon-ban-circle\"></span> In use</span>" : "<span class=\"bold-{{" + oObj.inUse + "}}\" ng-hide=\"" + oObj.inUse + "\"><span class=\"icon-ok-circle\" ></span> Available</span>";
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

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives', 'ngRoute', 'angularFileUpload']).
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
    controller('TestController', function ($scope, $fileUploader) {
        'use strict';

        // create a uploader with options
        var uploader = $scope.uploader = $fileUploader.create({
            scope: $scope,                          // to automatically update the html. Default: $rootScope
            url: 'upload.php',
            formData: [
                { key: 'value' }
            ],
            filters: [
                function (item) {                    // first user filter
                    console.info('filter1');
                    return true;
                }
            ]
        });


        // FAQ #1
        var item = {
            file: {
                name: 'Previously uploaded file',
                size: 1e6
            },
            progress: 100,
            isUploaded: true,
            isSuccess: true
        };
        item.remove = function() {
            uploader.removeFromQueue(this);
        };
        uploader.queue.push(item);
        uploader.progress = 100;


        // ADDING FILTERS

        uploader.filters.push(function (item) { // second user filter
            console.info('filter2');
            return true;
        });

        // REGISTER HANDLERS

        uploader.bind('afteraddingfile', function (event, item) {
            console.info('After adding a file', item);
        });

        uploader.bind('whenaddingfilefailed', function (event, item) {
            console.info('When adding a file failed', item);
        });

        uploader.bind('afteraddingall', function (event, items) {
            console.info('After adding all files', items);
        });

        uploader.bind('beforeupload', function (event, item) {
            console.info('Before upload', item);
        });

        uploader.bind('progress', function (event, item, progress) {
            console.info('Progress: ' + progress, item);
        });

        uploader.bind('success', function (event, xhr, item, response) {
            console.info('Success', xhr, item, response);
        });

        uploader.bind('cancel', function (event, xhr, item) {
            console.info('Cancel', xhr, item);
        });

        uploader.bind('error', function (event, xhr, item, response) {
            console.info('Error', xhr, item, response);
        });

        uploader.bind('complete', function (event, xhr, item, response) {
            console.info('Complete', xhr, item, response);
        });

        uploader.bind('progressall', function (event, progress) {
            console.info('Total progress: ' + progress);
        });

        uploader.bind('completeall', function (event, items) {
            console.info('Complete all', items);
        });

    }).
    controller('loginCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'usersPath', '$location', 'deviceBasePath', 'teamsPath',
        function ($rootScope, angularFireCollection, fbURL, usersPath, $location, deviceBasePath, teamsPath) {
            // if ($cookies.actual) {
            //     $rootScope.actualUser = $cookies.actualUser;
            //     $rootScope.users = $cookies.users;
            //     $rootScope.stocks = $cookies.stocks;
            //     $rootScope.teams = $cookies.teams;
            //     $location.path('/mainView').replace();
            //     $rootScope.msgtxt = '';
            // } else {
                $rootScope.users = angularFireCollection(new Firebase(fbURL + usersPath));
                $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
                $rootScope.teams = angularFireCollection(new Firebase(fbURL + teamsPath));
                $rootScope.login = function (userName, password) {
                    var found = false;
                    angular.forEach($rootScope.users, function (user) {
                        if (user.accId == userName && user.pass == password) {
                            $rootScope.actualUser = user;
                            // $cookies.actualUser = $rootScope.actualUser = user;
                            // $cookies.users = $rootScope.users;
                            // $cookies.stocks = $rootScope.stocks;
                            // $cookies.teams = $rootScope.teams;
                            found = true;
                        }
                    }, this);
                    if ($rootScope.actualUser && found) {
                        $location.path('/mainView').replace();
                        $rootScope.msgtxt = '';
                    } else {
                        $rootScope.msgtxt = 'Usuario Invalido';
                    }
                // };
            }
        }]).
    controller('DeviceCtrl', ['$rootScope', 'time', '$routeParams', 'fbURL', 'deviceBasePath',
        function ($rootScope, time, $routeParams, fbURL, deviceBasePath) {
            var currentGroup = $rootScope.stocks;
            if (!$rootScope.actualUser) {
                $location.path('/').replace();
            }
            if (currentGroup) {
                $rootScope.actual = currentGroup[$routeParams.deviceId];
            }
            $rootScope.$watchCollection('stocks', function () {
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
            $rootScope.send = function ($routeParams) {
                var actualInfo = $rootScope.actual,
                    deviceRef = new Firebase(fbURL + deviceBasePath + $routeParams.deviceId),
                    updateFields = {};
                deviceRef.once('value', function () {
                    var currentEncryptPass = CryptoJS.MD5(actualInfo.password).toString();
                    actualInfo.lockPhrase = currentEncryptPass;
                    updateFields = {lockPhrase: currentEncryptPass};
                });
                deviceRef.update(updateFields);
            };
        }]).
    controller('upManagerCtrl', ['$rootScope', 'fbURL', 'deviceBasePath', 'usersPath', 'teamsPath', '$location',
        function ($rootScope, fbURL, deviceBasePath, usersPath, teamsPath, $location) {
            if (!$rootScope.actualUser) {
                $location.path('/').replace();
            }
            $rootScope.addDevice = function (name, os, osVersion, type, displaySize, teamId) {
                console.log(name + ', ' + os + ', ' + osVersion + ', ' + type + ', ' + displaySize + ', ' + teamId.id);
                var deviceRef = new Firebase(fbURL + deviceBasePath + '/' + $rootScope.stocks.length),
                    newDevice = {
                        displaySize: displaySize,
                        history: '',
                        img: '',
                        inUse: false,
                        lockPhrase: '',
                        name: name,
                        os: os,
                        osVersion: osVersion,
                        password: '',
                        teamId: teamId.id,
                        type: type,
                        user: ''
                    };
                deviceRef.set(newDevice);
                $location.path('/mainView');
            };
            $rootScope.addAdmin = function (accId, teamId, password) {
                var adminRef = new Firebase(fbURL + usersPath + '/' + $rootScope.users.length),
                    newAdmin = {
                        accId: accId,
                        admin: true,
                        id: $rootScope.users.length,
                        pass: password,
                        teamId: teamId.id
                    };
                adminRef.set(newAdmin);
                $location.path('/mainView');
            };
            $rootScope.addTeam = function (name, shortName) {
                var teamRef = new Firebase(fbURL + teamsPath + '/' + $rootScope.teams.length),
                    newTeam = {
                        id: $rootScope.teams.length,
                        name: name,
                        shortName: shortName
                    };
                teamRef.set(newTeam);
                $location.path('/mainView');
            };
        }]).
    controller('pagesCtrl', ['$rootScope', '$location',
        function ($rootScope, $location) {
            $rootScope.addDevicePage = function () {
                $location.path('/addDevice');
            };
            $rootScope.mainPage = function () {
                $location.path('/mainView');
            };
            $rootScope.logout = function () {
                delete $rootScope.actual;
                $location.path('/');
            };
            $rootScope.adminPage = function () {
                delete $rootScope.actual;
                $location.path('/addAdmin');
            };
            $rootScope.teamPage = function () {
                delete $rootScope.actual;
                $location.path('/addTeam');
            };
        }]).
    config(function ($routeProvider) {
        $routeProvider.
            when('/', {templateUrl: '/admin/login.html', controllerAs: 'device'}).
            when('/mainView', {templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            when('/addDevice', {templateUrl: '/admin/addDevice.html', controllerAs: 'device'}).
            when('/addAdmin', {templateUrl: '/admin/admins.html', controllerAs: 'device'}).
            when('/addTeam', {templateUrl: '/admin/teams.html', controllerAs: 'device'}).
            when('/:deviceId', {templateUrl: '/admin/device.html', controllerAs: 'device'});
    });
