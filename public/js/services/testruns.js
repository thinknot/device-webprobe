angular.module('testrunService', [])

	// super simple service
	// each function returns a promise object 
	.factory('Testruns', ['$http',function($http) {
		return {
			get : function() {
				return $http.get('/api/testruns');
			},
			create : function(testrunData) {
				return $http.post('/api/testruns', testrunData);
			},
			delete : function(id) {
				return $http.delete('/api/testruns/' + id);
			}
		}
	}]);