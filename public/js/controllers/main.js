angular.module('testrunController', [])

    // inject the Testrun service factory into our controller
    .controller('mainController', ['$scope','$http','Testruns','TestExecutor', 'EmailSender', 
				   function($scope, $http, Testruns, TestExecutor, EmailSender ) {

	     $scope.formData = {};
	     $scope.loading = true;

		// GET =====================================================================
		// when landing on the page, display all testruns
		Testruns.get()
			.success(function(data) {
				$scope.testruns = data;
				$scope.loading = false;
			});

		// CREATE ==================================================================
		// when submitting the add form, run the test, e-mail the result, and create a database record
		$scope.createTestrun = function() {

                    // Validate the formData to make sure that something is there
		    // The only required parameter is the device's address
		    if ($scope.formData.deviceAddr != undefined) {
		    	$scope.loading = true;

			// call the test execute API to kick off the test
			TestExecutor.create($scope.formData)
			.success(function(data) {

			    // The test executed and returned a result 

			    // e-mail the result
			    EmailSender.create($scope.formData)
			    .success(function(data) {

				// now create the database record (returns a promise object)
				Testruns.create($scope.formData)

				// if successful creation, call our get function to get all the new testruns
				.success(function(data) {
				    $scope.loading = false;
		    	    	    $scope.formData = {}; // clear the form so our user is ready to enter another
		    	            $scope.testruns = data; // assign our new list of testruns
				});
			    });
			});
		    }
		}
			  

		// DELETE ==================================================================
		// delete a testrun after checking it
		$scope.deleteTestrun = function(id) {
			$scope.loading = true;

			Testruns.delete(id)
				// if successful creation, call our get function to get all the new testruns
				.success(function(data) {
					$scope.loading = false;
					$scope.testruns = data; // assign our new list of testruns
				});
		};
	}]);