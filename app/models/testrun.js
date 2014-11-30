var mongoose = require('mongoose');

module.exports = mongoose.model('Testrun', {
    userName : {type : String, default: ''},
    userMemberId : {type : Number, default: -1},
    userEmail : { type : String, default: ''},
    deviceAddr : {type : String, default: ''},
    testStartTime : {type : Date, default: ''},
    resultsLink : {type : String, default: ''}
});