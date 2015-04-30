angular.module('sendemailService', [])

    .factory('EmailSender', ['$http',function($http) {
	return {
	    create : function(data) {
		return $http.post('/api/emailsender', data);
	    }
	}
    }]);