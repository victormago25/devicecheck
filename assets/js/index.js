/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS, moment */
angular.module('devicechecker.directives', [])
    .directive('activeTable', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (angular.isString(attrs.activeTable)) {
                    console.log(element);
                    element.dataTable({"aoColumns": [
                        { "mData": "user" },
                        { "mData": "status" },
                        { "mData": "date" }],
                        "aaSorting": [[ 2, "desc" ]]});
//                    if (scope.stocks[attrs.activeTable].history) {
//                        element.dataTable().fnAddData(scope.stocks[attrs.activeTable].history);
//                    }
                }
            }
        };
    });

angular.module('device', ['ui.bootstrap', 'firebase', 'devicechecker.directives']).
    value('fbURL', 'https://devicetrack.firebaseio.com/').
    value('deviceBasePath', 'stock/').
    factory('time', function () {
        var time = {};
        (function tick() {
            time.now = new Date();
        }());
        return time;
    }).
    controller('ListCtrl', ['$rootScope', 'angularFireCollection', 'fbURL', 'deviceBasePath', function ($rootScope, angularFireCollection, fbURL, deviceBasePath) {
        $rootScope.stocks = angularFireCollection(new Firebase(fbURL + deviceBasePath));
        window.stocks = $rootScope.stocks;
        $rootScope.fbURL = fbURL;
    }]).
    controller('DeviceCtrl', ['$rootScope', 'time', '$routeParams', 'deviceBasePath', function ($rootScope, time, $routeParams, deviceBasePath) {
        this.actual = $rootScope.stocks.getByName($routeParams.groupId)[$routeParams.deviceId];
        this.time = time;
        this.$routeParams = $routeParams;
        this.send = function ($routeParams) {
            var actualInfo = $rootScope.stocks.getByName($routeParams.groupId)[$routeParams.deviceId],
                deviceRef = new Firebase($rootScope.fbURL + deviceBasePath + actualInfo.$id);
            deviceRef.once('value', function (dataSnapshot) {
                var currentEncryptPass = CryptoJS.MD5(actualInfo.password).toString(),
                    newRecord = {
                        user: actualInfo.user,
                        status: 'Checked-in',
                        date: moment().format("YYYY-MM-DD hh:mm:ss a")
                    };
                if (!actualInfo.history) {
                    actualInfo.history = [];
                } else {
                    actualInfo.history = dataSnapshot.child('history').val();
                }
                if (dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === currentEncryptPass) && (dataSnapshot.child('user').val() === actualInfo.user)) {
                    actualInfo.password = '';
                    actualInfo.user = '';
                    actualInfo.lockPhrase = '';
                    actualInfo.history.push(newRecord);
                    actualInfo.inUse = false;
                    $rootScope.stocks.update(actualInfo.$id);
                } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                    newRecord.status = 'Checked-out';
                    actualInfo.inUse = true;
                    actualInfo.lockPhrase = currentEncryptPass;
                    actualInfo.history.push(newRecord);
                    actualInfo.password = '';
                    $rootScope.stocks.update(actualInfo.$id);
                }
            });
        };
    }]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/:groupId/:deviceId', {controller: 'DeviceCtrl', templateUrl: '/device.html', controllerAs: 'device'}).
            otherwise({redirectTo: '/'});
    }]);
