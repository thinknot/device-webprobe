var Testrun = require('./models/testrun');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var Http = require('http');


// Retrieve all test db entries
function getRecords(res){
    Testrun.find(function(err, records) {
	// if there is an error retrieving, send the error. nothing after res.send(err) will execute
	if (err)
		res.send(err)
	res.json(records); // return all records in JSON format
    });
};


// e-mail sender
function sendEmail(dest,subject,message) {

    var ses = new AWS.SES();
    var params = {
	Destination: {
	    ToAddresses: [dest],
	    CcAddresses: [],
	    BccAddresses: []
	},
	Message: {
	    Body: {
	        Html: {
	            Data: message,
		    Charset: 'UTF-8'
		},
		Text: {
		    Data: message,
		    Charset: 'UTF-8'
	        }
	    },
	    Subject: {
	        Data: subject,
	        Charset: 'UTF-8'
	    }
	},
	Source: 'doug@sunspec.org',
	ReplyToAddresses: ['doug@sunspec.org'],
	ReturnPath: 'doug@sunspec.org'
    };

    // Send the e-mail
    ses.sendEmail( params, function(err,data) {
	if ( err ) console.log( err, err.stack );
	else console.log( data );
    });

};

module.exports = function(app) {

    // api ---------------------------------------------------------------------

    // get all
    app.get('/api/testruns', function(req, res) {
	getRecords(res);
    });

    // Create a testrun database record, and send back all testruns after creation
    // Used by the 'show all previous runs' webpage 
    app.post('/api/testruns', function(req, res) {

	// create a record, information comes from AJAX request from Angular
	Testrun.create({
	    userName : req.body.userName,
	    userEmail : req.body.userEmail,
	    userMemberId : req.body.userMemberId,
	    deviceAddr : req.body.deviceAddr,
	    testStartTime : new Date()
	}, function(err, record) {
	    if (err)
		res.send(err);
	    // get and return all after you create another
	    getRecords(res);
	});
    });

    // delete a testrun
    app.delete('/api/testruns/:testrun_id', function(req, res) {
	Testrun.remove({
	    _id : req.params.testrun_id
        }, function(err, record) {
	    if (err)
		res.send(err);
	    getRecords(res);
	});
    });

    // Test Executor - run a test by calling Bob's test API
    // Return the result as a [ tbd ]
    app.post('/api/testexecutor', 
        
        function(req, res) {

            console.log( "\r\ntestexecutor: " + 
			 req.body.userName + " " +
			 req.body.userEmail + " " +
			 req.body.deviceAddr );

            Http.get("http://localhost:8083/device?ipaddr="+req.body.deviceAddr, 
	
		function(res2) {

		    res2.on("data", 

		        function(chunk) {

			    var str = chunk.toString();    // UTF-8

			    var resultIndex = str.search("result");
			    var statusEndIndex = resultIndex-2;
			    var statusJson = str.slice(0,statusEndIndex)+'}';
			    var reply = JSON.parse(statusJson);
			    var content = str.slice(resultIndex+10,str.length-2);

			    console.log("status: "+reply.status+" detail: " + reply.statusDetail);

			    var subject = reply.status;
			    if (reply.statusDetail != undefined)
				subject += " "+reply.statusDetail;

			    sendEmail(req.body.userEmail,
				      "SunSpec test "+subject,
				      content);

			    res.json(reply);
		        });

	        }).on('error', function(e) {
		    console.log("got error: " + e.message);
	        });
        });

    // e-mail sender
    app.post('/api/emailsender', function(req, res) {

	    sendEmail(req.body.userEmail,'try this','HI MOM');

	// Not sure what to do here - or what this does ~
	res.send();
    });

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
	    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
