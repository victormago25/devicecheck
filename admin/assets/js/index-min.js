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
    directive('deviceTable', function ($compile) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (angular.isString(attrs.deviceTable)) {
                    element.dataTable({
                        "aoColumns": [
                            {
                                "aTargets": [0],
                                "mData": null,
                                "mRender": function (data, type, full) {
                                    return '<span class="link" ng-click="toggleModal(' + full.$id + ')">' + full.name + '</span>';
                                }
                            },
                            { "mData": "tagDevice" },
                            { "mData": "type" },
                            { "mData": "os" },
                            { "mData": function (oObj) {
                                return oObj.inUse ? "<span ng-show=\"" + oObj.inUse + "\" class=\"bold-" + oObj.inUse + "\"><span class=\"icon-ban-circle\"></span> In use</span>" : "<span class=\"bold-" + oObj.inUse + "\" ng-hide=\"" + oObj.inUse + "\"><span class=\"icon-ok-circle\" ></span> Available</span>";
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
                            {
                                "aTargets": [7],
                                "mData": null,
                                "mRender": function (data, type, full) {
                                    return '<button ng-click="editDeviceFn(' + full.$id + ')" ng-controller="upManagerCtrl" class="btn btn-primary">Edit</button>';
                                }
                            },
                            {
                                "aTargets": [8],
                                "mData": null,
                                "mRender": function (data, type, full) {
                                    return '<button ng-click="deleteDevice(' + full.$id + ')" ng-controller="upManagerCtrl" class="btn btn-primary">Delete</button>';
                                }
                            },
                            { "mData": "displaySize", "bVisible": false },
                            { "mData": "history", "bVisible": false },
                            { "mData": "img", "bVisible": false },
                            { "mData": "lockPhrase", "bVisible": false },
                            { "mData": "osVersion", "bVisible": false },
                            { "mData": "password", "bVisible": false }
                        ],
                        "fnCreatedRow": function (nRow, aData, iDataIndex) {
                            $compile(nRow)(scope);
                        },
                        "aaSorting": [[ 0, "desc" ]]});
                    scope.$watchCollection('stocks', function (newNames) {
                        element.dataTable().fnClearTable();
                        element.dataTable().fnAddData(newNames);
                    });
                    element.dataTable().fnAddData(scope.stocks);
                }
            }
        };
    }).
    directive('modalDialog', function() {
        return {
            restrict:'E',
            scope: {
                show: '='
            },
            replace: true,
            transclude: true,
            link: function (scope, element, attrs) {
                scope.dialogStyle = {};
                if (attrs.width) {
                    scope.dialogStyle.width = attrs.width;
                }
                if (attrs.height) {
                    scope.dialogStyle.height = attrs.height;
                }
                scope.hideModal = function() {
                    scope.show = false;
                };
            },
            template: '<div class="ng-modal" ng-show="show"><div class="ng-modal-overlay" ng-click="hideModal()"></div><div class="ng-modal-dialog" ng-style="dialogStyle"><div class="ng-modal-close" ng-click="hideModal()">X</div><div class="ng-modal-dialog-content" ng-transclude></div></div></div>'
        };
    });

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives', 'ngRoute']).
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
    filter('ownerTeam', function () {
        return function (teamId, teams) {
            return teams[teamId] ? teams[teamId].name : 'Free Device';
        };
    }).
    controller('DeviceCtrl', ['$rootScope', 'time', '$routeParams', 'fbURL', 'deviceBasePath', '$location',
        function ($rootScope, time, $routeParams, fbURL, deviceBasePath, $location) {
            var currentGroup = $rootScope.stocks;
            if (!$rootScope.actualUser) {
                $location.path('/').replace();
            }
            $rootScope.modalShown = false;
            $rootScope.toggleModal = function(deviceId) {
                $location.path('/' + deviceId);
                $rootScope.modalShown = !$rootScope.modalShown;
            };
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
            $rootScope.editDeviceFn = function (deviceId) {
                angular.forEach($rootScope.device, function (device) {
                    if (device.id === deviceId) {
                        $rootScope.editDevice = device;
                    }
                }, this);
                $location.path('/editDevice');
            };
        }]).
    controller('upManagerCtrl', ['$rootScope', 'fbURL', 'deviceBasePath', 'usersPath', 'teamsPath', '$location',
        function ($rootScope, fbURL, deviceBasePath, usersPath, teamsPath, $location) {
            if (!$rootScope.actualUser) {
                $location.path('/').replace();
            }
            var findLastIndex = function (array) {
                    return (parseInt(array[(array.length - 1)].$id, 10) + 1)
                },
                findObject = function (array, id) {
                    var object = {};
                    angular.forEach(array, function (obj) {
                        if (obj.id === id) {
                            object = obj;
                        }
                    }, this);
                    return object;
                },
                updateTeamDevice = function (teamId) {
                    var deviceRef,
                        newDevice;
                    angular.forEach($rootScope.stocks, function (device) {
                        if (device.teamId === teamId) {
                            console.log(device);
                            device.teamId = 0;
                            console.log(device);
                            deviceRef = new Firebase(fbURL + deviceBasePath + '/' + device.$id);
                            newDevice = {
                                displaySize: device.displaySize,
                                history: device.history,
                                img: device.img,
                                inUse: device.inUse,
                                lockPhrase: device.lockPhrase,
                                name: device.name,
                                os: device.os,
                                osVersion: device.osVersion,
                                password: device.password,
                                tagDevice: device.tagDevice,
                                teamId: device.teamId,
                                type: device.type,
                                user: device.user
                            };
                            deviceRef.update(newDevice);
                        }
                    }, this);
                };
            $rootScope.addDevice = function (name, tagDevice, os, osVersion, type, displaySize, teamId) {
                var deviceRef = new Firebase(fbURL + deviceBasePath + '/' + findLastIndex($rootScope.stocks)),
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
                        tagDevice: tagDevice,
                        teamId: teamId.id,
                        type: type,
                        user: ''
                    };
                deviceRef.set(newDevice);
                $location.path('/mainView');
            };
            $rootScope.editDeviceFn = function (deviceId) {
                console.log(deviceId);
            };
            $rootScope.deleteDevice = function (deviceId) {
                console.log(deviceId);
            };
            $rootScope.addAdmin = function (accId, teamId, password) {
                var adminRef = new Firebase(fbURL + usersPath + '/' + findLastIndex($rootScope.users)),
                    newAdmin = {
                        accId: accId,
                        admin: true,
                        id: $rootScope.users.length,
                        pass: password
                    };
                adminRef.set(newAdmin);
                $location.path('/addAdmin');
            };
            $rootScope.editUserFn = function (userId) {
                angular.forEach($rootScope.users, function (user) {
                    if (user.id === userId) {
                        $rootScope.editUser = user;
                    }
                }, this);
                $location.path('/editUser');
            };
            $rootScope.updateUser = function (userComplete, password) {
                if (!angular.isUndefined(password)) {
                    userComplete.pass = password;
                }
                var adminRef = new Firebase(fbURL + usersPath + '/' + userComplete.$id);
                    newAdmin = {
                        accId: userComplete.accId,
                        admin: true,
                        id: userComplete.id,
                        pass: userComplete.pass
                    };
                adminRef.update(newAdmin);
                $location.path('/addAdmin');
            };
            $rootScope.deleteUser = function (userId) {
                var userFound = findObject($rootScope.users, userId),
                    adminRef = new Firebase(fbURL + usersPath + '/' + userFound.$id);
                adminRef.remove();
            };
            $rootScope.addTeam = function (name, shortName) {
                var teamRef = new Firebase(fbURL + teamsPath + '/' + findLastIndex($rootScope.teams)),
                    newTeam = {
                        id: $rootScope.teams.length,
                        name: name,
                        shortName: shortName
                    };
                teamRef.set(newTeam);
                $location.path('/addTeam');
            };
            $rootScope.editTeamFn = function (teamId) {
                angular.forEach($rootScope.teams, function (team) {
                    if (team.id === teamId) {
                        $rootScope.editTeam = team;
                    }
                }, this);
                $location.path('/editTeam');
            };
            $rootScope.updateTeam = function (teamComplete, shortName) {
                if (shortName !== teamComplete.shortName) {
                    teamComplete.shortName = shortName;
                }
                var teamRef = new Firebase(fbURL + teamsPath + '/' + teamComplete.$id);
                    newTeam = {
                        id: teamComplete.id,
                        name: teamComplete.name,
                        shortName: teamComplete.shortName
                    };
                teamRef.update(newTeam);
                $location.path('/addTeam');
            };
            $rootScope.deleteTeam = function (teamId) {
                alert("All devices linked to this team will be on Free devices Category.");
                updateTeamDevice(teamId);
                var teamFound = findObject($rootScope.teams, teamId),
                    teamRef = new Firebase(fbURL + teamsPath + '/' + teamFound.$id);
                teamRef.remove();
                $location.path('/addTeam');
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
            when('/editUser', {templateUrl:'/admin/editDevice.html', controllerAs: 'device'}).
            when('/addAdmin', {templateUrl: '/admin/admins.html', controllerAs: 'device'}).
            when('/editUser', {templateUrl:'/admin/editAdmins.html', controllerAs: 'device'}).
            when('/addTeam', {templateUrl: '/admin/teams.html', controllerAs: 'device'}).
            when('/editTeam', {templateUrl: '/admin/editTeams.html', controllerAs: 'device'}).
            when('/:deviceId', {templateUrl: '/admin/mainView.html', controllerAs: 'device'});
    });
