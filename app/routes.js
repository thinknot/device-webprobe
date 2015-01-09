var Testrun = require('./models/testrun');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var Http = require('http');
var MailComposer = require("mailcomposer").MailComposer;

// Retrieve all test db entries
function getRecords(res){
    Testrun.find(function(err, records) {
	// if there is an error retrieving, send the error. nothing after res.send(err) will execute
	if (err)
		res.send(err)
	res.json(records); // return all records in JSON format
    });
};

// Retrieve and return or e-mail test results
// req is the original request from the user
// res is the response we are building for the user
// reply is the response we got from the text executor web service
function getResults(req,res,reply) {

    if ( req.body.deliveryMethod == "download" ) {
				
	// do nothing extra - link is already in the reply (???is this true???)

    } else if ( req.body.deliveryMethod == "mail" ) {

        var subject = reply.status;
	if (reply.statusDetail != undefined)
	    subject += " "+reply.statusDetail;

	sendEmail(req.body.userEmail,
		  "SunSpec test "+subject,
		  reply);

	// Don't display 'retrieve results' link
	reply.result = undefined;
    }

    res.json(reply);
}


// e-mail sender - with binary attachment
function sendEmail(dest,subject,reply) {

    var mailcomposer = new MailComposer();
    mailcomposer.setMessageOption( {
        from: "doug@sunspec.org",
	to: dest,
	subject: subject,
	body:"test result attached"
	}
    );

    var attachment = {
        fileName:reply.result.substring(reply.result.lastIndexOf('/')+1),
	filePath:reply.result
    };
    mailcomposer.addAttachment( attachment );
    mailcomposer.buildMessage( function(err,message) {

	    var sesParams = {
	    RawMessage: {
		Data:message
	    }
	}

	// Send the e-mail
	var ses = new AWS.SES();
	ses.sendRawEmail( sesParams, function(err,data) {
		if ( err ) console.log( err, err.stack );
		//		else console.log( data );
	});

    });
}

module.exports = function(app) {

    // api ---------------------------------------------------------------------

    // get all
    app.get('/api/testruns', function(req, res) {
	getRecords(res);
    });

    // Create a testrun database record, and send back all testruns after creation
    app.post('/api/testruns', function(req, res) {

	// create a record, information comes from AJAX request from Angular
	Testrun.create({
	    userName : req.body.userName,
	    userEmail : req.body.userEmail,
	    userMemberId : req.body.userMemberId,
	    deviceAddr : req.body.deviceAddr,
	    resultsLink : req.body.resultsLink,
	    testStartTime : new Date()
	}, function(err, record) {
	    if (err)
		res.send(err);
	    // get and return all after you create another
	    getRecords(res);
	});
    });

    // delete a testrun database record
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
    app.post('/api/testexecutor', function(req, res) {

	Http.get("http://localhost:8083/device?ipaddr="+req.body.deviceAddr, function(res2) {

	    res2.on("data", function(chunk) {

		// TEMP until Bob's service returns pure JSON 
		var str = chunk.toString();    // UTF-8
			    
		var resultIndex = str.search("result");
		var statusEndIndex = resultIndex-2;
		var replyStr = str.slice(0,statusEndIndex)+',\"result\":\"' + '/usr/local/interop-test//results/picstemplate.csv\"}';
		var reply = JSON.parse(replyStr);

		console.log( replyStr );
		// END TEMP

		if ( reply.status != 'SUCCESS' )
		    res.json(reply);
		else
		    getResults(req,res,reply);
        });

	}).on('error', function(e) {
	    console.log("got error: " + e.message);
        });
    });

    app.get('/results/*', function(req, res) {

	console.log("results got req:" + req.url);
        res.sendfile('./results/picstemplate.csv'); 
    });

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
	console.log("* got req:" + req.url);
	// load the single view file (angular will handle the page changes on the front-end)
        res.sendfile('./public/index.html'); 
    });

};



