var Testrun = require('./models/testrun');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var Http = require('http');

function getRecords(res){
    Testrun.find(function(err, records) {
	// if there is an error retrieving, send the error. nothing after res.send(err) will execute
	if (err)
		res.send(err)
	res.json(records); // return all records in JSON format
    });
};

module.exports = function(app) {

    // api ---------------------------------------------------------------------

    // get all
    app.get('/api/testruns', function(req, res) {
	getRecords(res);
    });

    // create a testrun and send back all testruns after creation
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

    // Test Executor - calls Bob's test API
    app.post('/api/testexecutor', function(req, res) {

        console.log( "testexecutor: " + req.body.deviceAddr );

        return Http.get("http://localhost:8083/device?ipaddr="+req.body.deviceAddr, 
			function(res) {
		console.log("Got response: " + res.statusCode);
		res.on("data", function(chunk) {
			console.log("body: " + chunk);
		});
	    }).on('error', function(e) {
		    console.log("got error: " + e.message);
	});
    });

    // e-mail sender
    app.post('/api/emailsender', function(req, res) {

	var ses = new AWS.SES();
	var message = 'your test has been executed';
	var params = {
	    Destination: {
		ToAddresses: [req.body.userEmail],
		CcAddresses: [],
		BccAddresses: []
	    },
	    Message: {
		Body: {
		    Html: {
			Data: message,
			Charset: 'US-ASCII'
		    },
		    Text: {
			Data: message,
			Charset: 'US-ASCII'
	            }
		},
	        Subject: {
		    Data: 'subject',
		    Charset: 'US-ASCII'
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

	// Not sure what to do here - just reply with request for now
	res.send(  );
    });

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
	    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
