/*jslint sloppy: true */
/*global angular, window, console */

angular.module('workshop01', []);

function returnTopics() {
    var topics = [
        {text: 'HTML', class: 'active'},
        {text: 'CSS'},
        {text: 'Javascript'},
        {text: 'JQuery'},
        {text: 'Angular'}],
        maxTopics = _.random(1, 5);
    console.log(maxTopics);
    return topics.slice(0, maxTopics);
}

function TopicsCtrl($scope) {
    $scope.topics = returnTopics();
}
