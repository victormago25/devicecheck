'use strict';
angular.module('picker', ['ui.bootstrap', 'firebase']).
    value('fbURL', 'https://device-checker.firebaseio.com/').
    factory('Projects', function (angularFireCollection, fbURL) {
        return angularFireCollection(fbURL);
    }).
    config(function ($routeProvider) {
            $routeProvider.
              when('/', {controller: ListCtrl, templateUrl: 'tabs.html'}).
//              when('/edit/:projectId', {controller:EditCtrl, templateUrl:'detail.html'}).
//              when('/new', {controller:CreateCtrl, templateUrl:'detail.html'}).
              otherwise({redirectTo:'/'});
    });
var TabsDemoCtrl = function ($scope) {
    $scope.tabs = [
        {title: "Dynamic Title 1", content: "Dynamic content 1"},
        {title: "Dynamic Title 2", content: "Dynamic content 2", disabled: true}
    ];

    $scope.alertMe = function() {
        setTimeout(function() {
            alert("You've selected the alert tab!");
        });
    };

    $scope.navType = 'pills';
};

function ListCtrl($scope, Devices) {
  $scope.devices = Devices;
}

function CreateCtrl($scope, $location, $timeout, Projects) {
  $scope.save = function() {
    Projects.add($scope.project, function() {
      $timeout(function() { $location.path('/'); });
    });
  }
}

function EditCtrl($scope, $location, $routeParams, angularFire, fbURL) {
  angularFire(fbURL + $routeParams.projectId, $scope, 'remote', {}).
  then(function() {
    $scope.project = angular.copy($scope.remote);
    $scope.project.$id = $routeParams.projectId;
    $scope.isClean = function() {
      return angular.equals($scope.remote, $scope.project);
    }
    $scope.destroy = function() {
      $scope.remote = null;
      $location.path('/');
    };
    $scope.save = function() {
      $scope.remote = angular.copy($scope.project);
      $location.path('/');
    };
  });
}
