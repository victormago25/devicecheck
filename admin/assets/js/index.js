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
    }).
    directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel),
                    modelSetter = model.assign;
                console.log(model);
                console.log(modelSetter);
                element.bind('change', function() {
                    scope.$apply(function() {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }]);

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives', 'angularFileUpload']).
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
    service('fileUpload', ['$http', function ($http) {
        this.uploadFileToUrl = function (file, uploadUrl) {
            var fd = new FormData();
            fd.append('file', file);
            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .success(function (ev) {
                console.log(ev);
            })
            .error(function (ev) {
                console.log(ev);
            });
        };
    }]).
    controller('DeviceCtrl', ['$rootScope', 'time', '$routeParams', 'fbURL', 'deviceBasePath',
        function ($rootScope, time, $routeParams, fbURL, deviceBasePath) {
            var currentGroup = $rootScope.stocks;
            // if (!$rootScope.actualUser) {
            //     $location.path('/').replace();
            // }
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
    controller('DeviceManagerCtrl', ['$rootScope', 'fbURL', 'deviceBasePath', '$location', '$upload', 'fileUpload',
        function ($rootScope, fbURL, deviceBasePath, $location, $upload, fileUpload) {
            $rootScope.onFileSelect = function() {
                console.log($rootScope);
                var file = $rootScope.myFile;
                console.log('file is ' + JSON.stringify(file));
                var uploadUrl = "/";
                fileUpload.uploadFileToUrl(file, uploadUrl);
                // var file = $file;
                // console.log($file);
                // console.log($rootScope);
                // console.log($rootScope.file);
                // console.log($rootScope.$file);
                // var uploader = $rootScope.uploader = $fileUploader.create({
                //     scope: $rootScope,
                //     url: 'upload.php'
                // });
                // uploader.filters.push(function ($file) {
                //     var type = uploader.isHTML5 ? $file.type : '/' + $file.value.slice($file.value.lastIndexOf('.') + 1);
                //     type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';
                //     return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
                // });
                // uploader.bind('afteraddingfile', function (event, $file) {
                //     console.info('After adding a file', $file);
                // });
                // uploader.bind('whenaddingfilefailed', function (event, $file) {
                //     console.info('When adding a file failed', $file);
                // });
                // uploader.bind('afteraddingall', function (event, items) {
                //     console.info('After adding all files', items);
                // });
                // uploader.bind('beforeupload', function (event, $file) {
                //     console.info('Before upload', $file);
                // });
                // uploader.bind('progress', function (event, $file, progress) {
                //     console.info('Progress: ' + progress, $file);
                // });
                // uploader.bind('success', function (event, xhr, $file, response) {
                //     console.info('Success', xhr, $file, response);
                // });
                // uploader.bind('cancel', function (event, xhr, $file) {
                //     console.info('Cancel', xhr, $file);
                // });
                // uploader.bind('error', function (event, xhr, $file, response) {
                //     console.info('Error', xhr, $file, response);
                // });
                // uploader.bind('complete', function (event, xhr, $file, response) {
                //     console.info('Complete', xhr, $file, response);
                // });
                // uploader.bind('progressall', function (event, progress) {
                //     console.info('Total progress: ' + progress);
                // });
                // uploader.bind('completeall', function (event, items) {
                //     console.info('Complete all', items);
                // });
                // $rootScope.upload = $upload.upload({
                //     url: 'upload.php',
                //     method: "POST",
                //     file: file
                // }).progress(function(evt) {
                //     console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total, 10));
                // }).success(function(data, status, headers, config) {
                //     console.log(data);
                //     console.log(status);
                //     console.log(headers);
                //     console.log(config);
                // });
            };
            $rootScope.addDevice = function (name, os, osVersion, type, displaySize, teamId) {
                console.log(name + ', ' + os + ', ' + osVersion + ', ' + type + ', ' + displaySize + ', ' + teamId.id);
                var deviceRef = new Firebase(fbURL + deviceBasePath + '/' + $rootScope.stocks.length),
                    newDevice = {
                        displaySize: displaySize,
                        history: {},
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
            $rootScope.addDevicePage = function () {
                $location.path('/addDevice');
            };
            $rootScope.mainPage = function () {
                $location.path('/mainView');
            };
        }]).
    controller('devicesCtrl', ['$rootScope', '$location',
        function ($rootScope, $location) {
            $rootScope.addDevicePage = function () {
                $location.path('/addDevice');
            };
            $rootScope.mainPage = function () {
                $location.path('/mainView');
            };
        }]).
    controller('logoutCtrl', ['$rootScope', '$location',
        function ($rootScope, $location) {
            $rootScope.logout = function () {
                delete $rootScope.actual;
                $location.path('/');
            };
        }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {templateUrl: '/admin/login.html', controllerAs: 'device'}).
            when('/mainView', {templateUrl: '/admin/mainView.html', controllerAs: 'device'}).
            when('/addDevice', {templateUrl: '/admin/addDevice.html', controllerAs: 'device'}).
            when('/:deviceId', {templateUrl: '/admin/device.html', controllerAs: 'device'});
    }]);
