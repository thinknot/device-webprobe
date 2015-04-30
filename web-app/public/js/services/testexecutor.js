angular.module('testexecutorService', [])

    // each function returns a promise object 
    .factory('TestExecutor', ['$http',function($http) {
	return {
	    create : function(data) {
		return $http.post('/api/testexecutor', data);
	    }
	}
    }]);