/*jslint sloppy: true */
/*global angular, window, console, Firebase, CryptoJS */

angular.module('device', ['ui.bootstrap', 'firebase']).
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
        $scope.stocks = angularFireCollection(fbURL + deviceBasePath);
        window.stocks = $scope.stocks;
        $scope.time = time;
        $scope.fbURL = fbURL;
        $scope.send = function (index) {
            var deviceRef = new Firebase($scope.fbURL + deviceBasePath + $scope.stocks[index].$id);
            deviceRef.once('value', function (dataSnapshot) {
                var currentEncryptPass = CryptoJS.MD5($scope.stocks[index].password).toString();
                if (dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === currentEncryptPass) && (dataSnapshot.child('user').val() === $scope.stocks[index].user)) {
                    $scope.stocks[index].password = '';
                    $scope.stocks[index].user = '';
                    $scope.stocks[index].lockPhrase = '';
                    $scope.stocks[index].inUse = false;
                    $scope.stocks.update($scope.stocks[index].$id);
                } else if (!dataSnapshot.child('inUse').val() && (dataSnapshot.child('lockPhrase').val() === '') && (dataSnapshot.child('user').val() === '')) {
                    $scope.stocks[index].inUse = true;
                    $scope.stocks[index].lockPhrase = currentEncryptPass;
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
    }]).
    directive('devicechecker.history.data', function () {
        return function (scope, element, attrs) {
            $(document).ready(function () {
                var pagerOptions = {
                    // target the pager markup - see the HTML block below
                    container: $(".pager"),

                    // output string - default is '{page}/{totalPages}'
                    // possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
                    output: '{startRow} to {endRow} ({totalRows})',

                    // apply disabled classname to the pager arrows when the rows at either extreme is visible - default is true
                    updateArrows: true,

                    // starting page of the pager (zero based index)
                    page: 0,

                    // Number of visible rows - default is 10
                    size: 10,

                    // if true, the table will remain the same height no matter how many records are displayed. The space is made up by an empty
                    // table row set to a height to compensate; default is false
                    fixedHeight: true,

                    // remove rows from the table to speed up the sort of large tables.
                    // setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
                    removeRows: false,

                    // css class names of pager arrows
                    cssNext: '.next', // next page arrow
                    cssPrev: '.prev', // previous page arrow
                    cssFirst: '.first', // go to first page arrow
                    cssLast: '.last', // go to last page arrow
                    cssGoto: '.gotoPage', // select dropdown to allow choosing a page

                    cssPageDisplay: '.pagedisplay', // location of where the "output" is displayed
                    cssPageSize: '.pagesize', // page size selector - select dropdown that sets the "size" option

                    // class added to arrows when at the extremes (i.e. prev/first arrows are "disabled" when on the first page)
                    cssDisabled: 'disabled', // Note there is no period "." in front of this class name
                    cssErrorRow: 'tablesorter-errorRow' // ajax error information row

                };
                $(".historyTable").tablesorter({
                    widgets: ['zebra']
                }).tablesorterPager(pagerOptions);
            });
        };
    });
