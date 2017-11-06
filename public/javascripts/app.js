// const angular = require('angular');
var app = angular.module('Reple', []);
// app.controller('testCTRL', function ($scope, $http) {
app.controller('testCTRL', function ($scope) {

    //  var formData = {
    //     firstname: "default",
    //     emailaddress: "default",
    //     textareacontent: "default",
    //     gender: "default",
    //     member: false,
    //     file_profile: "default",
    //     file_avatar: "default"
    // };

    // $scope.save = function() {
    //     formData = $scope.form;
    // };
    $scope.title = 'SAD Testing server';
    $scope.submitForm = function() {
        console.log("posting data....");
        formData = $scope.form;
        console.log(formData);
        //$http.post('form.php', JSON.stringify(data)).success(function(){/*success callback*/});
    };

 });
console.log('angular');