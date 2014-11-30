angular.module('testrunController', [])

    // inject the Testrun service factory into our controller
    .controller('mainController', ['$scope','$http','Testruns', function($scope, $http, Testruns) {
	     $scope.formData = {};
		$scope.loading = true;

		// GET =====================================================================
		// when landing on the page, get all testruns and show them
		// use the service to get all the testruns
		Testruns.get()
			.success(function(data) {
				$scope.testruns = data;
				$scope.loading = false;
			});

		// CREATE ==================================================================
		// when submitting the add form, send the text to the node API
		$scope.createTestrun = function() {

                    // validate the formData to make sure that something is there
		    // if form is empty, nothing will happen
		    if ($scope.formData.userName != undefined) {
		    	$scope.loading = true;

		    	// call the create function from our service (returns a promise object)
		    	Testruns.create($scope.formData)

		    	    // if successful creation, call our get function to get all the new testruns
		    	    .success(function(data) {
		    	    	$scope.loading = false;
		    	    	$scope.formData = {}; // clear the form so our user is ready to enter another
		    	    	$scope.testruns = data; // assign our new list of testruns
		    	    });
		    }
		};

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