angular.module('testrunController', [])

    // inject all service factories into our controller
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
		// User pressed 'Run Test' button
		// Call the test executor to execute the test, and if it succeeds,
		// a) reate a tracking db entry, 
		// b) dispose of the result using the method specified by the user
		$scope.createTestrun = function() {

                    // Validate the formData
		    // The only required parameter is the device's address
		    if ($scope.formData.deviceAddr != undefined) {
		    	$scope.loading = true;

			// call the test execute API to kick off the test
			TestExecutor.create($scope.formData)
			.success(function(data) {

			    // The test executed and returned a result 
			    $scope.status = data.status;
			    $scope.statusDetail = data.statusDetail;
			    $scope.Mn = data.Mn;
			    $scope.Md = data.Md;
			    $scope.result = data.result;
			    if (data.status == 'FAILURE') {
				window.alert( data.statusDetail );
			    } else if ( data.status != 'SUCCESS' ) {
				window.alert( 'unknown reply from test executor: '+data );
			    } else {

				// Test succeeded - 

				// save url to retrieve result
				$scope.results = data.result;

				// now create the database record (returns a promise object)
				Testruns.create($scope.formData)
				.success(function(data) {
				    // db record successfully created - dispose of the result

				});
			    }
			    $scope.loading = false;
			    $scope.formData = {}; // clear the form so our user is ready to enter another
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