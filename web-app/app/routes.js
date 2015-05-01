var Testrun = require('./models/testrun');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var Http = require('http');
var MailComposer = require("mailcomposer").MailComposer;
var fs = require( 'fs' );
var baseFilePath = '/opt/sunspec/device-webprobe';
var resultsFilePathComponent = 'results';
var resultsFilePath = baseFilePath+'/'+resultsFilePathComponent;

// Retrieve all test db entries
function getRecords(res){
    Testrun.find(function(err, records) {
	// if there is an error retrieving, send the error. nothing after res.send(err) will execute
	if (err)
		res.send(err)
	res.json(records); // return all records in JSON format
    });
};

// Save or e-mail test results
// req is the original request from the user
// res is the response we are building for the user
// jsonStatus+result is the response we got from the text executor web service
function disposeResult(req,res,jsonStatus,result) {

    if ( req.body.deliveryMethod == "download" ) {
				
	// save the result in a file and append its name to the jsonStatus to be replied
	var now = new Date();
	var fileName = resultsFilePath+'/result_'+now;

	var file = fs.openSync( fileName,'w+' );
	fs.write( file, result );

	jsonStatus.resultLink = resultsFilePathComponent+'/result_'+now;

    } else if ( req.body.deliveryMethod == "mail" ) {

        var subject = jsonStatus.status;
	if (jsonStatus.statusDetail != undefined)
	    subject += " "+jsonStatus.statusDetail;

	sendEmail(req.body.userEmail, "SunSpec test "+subject, result);

	// Don't display 'retrieve results' link
	//	reply.result = undefined;
    }

    return jsonStatus;
}


// e-mail sender - with binary attachment
function sendEmail(dest,subject,result) {

    var mailcomposer = new MailComposer();
    mailcomposer.setMessageOption( {
        from: "doug@sunspec.org",
	to: dest,
	subject: subject,
	body:result
	}
    );

    /*
    var attachment = {
        fileName:result.substring(reply.result.lastIndexOf('/')+1),
	filePath:result
    };
    mailcomposer.addAttachment( attachment );
    */
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

		var str = chunk.toString();    // UTF-8

		var statusEndIndex = str.search("}");
		var jsonStatus = JSON.parse( str.slice(0,statusEndIndex+1) );
		//                   ',\"Mn\":\"SunSpec\"' +
		//                   ',\"Md\":\"Simulator\"' +
		//                   ',\"result\":\"' +'./results/picstemplate.csv\"}';

		var result = str.slice( statusEndIndex+11 );

		if ( jsonStatus.status == 'SUCCESS' )
		    jsonStatus = disposeResult(req,res,jsonStatus,result);

		console.log( 'status: '+jsonStatus.status );
		console.log( 'statusDetail: '+jsonStatus.statusDetail );
		console.log( 'resultLink: '+jsonStatus.resultLink );

		res.json(jsonStatus);
        });

	}).on('error', function(e) {
	    console.log("testexecutor call got error: " + e.message);
	    var reply = { 
		status:'FAILURE',
		statusDetail:'connection to device '+req.body.deviceAddr+' failed: '+e.message
	    }
	    res.json(reply);
        });
    });

    app.get('/results/*', function(req, res) {

	console.log("results got req:" + req.url);
        res.sendfile(baseFilePath+req.url);
    });

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
	console.log("* got req:" + req.url);
	// load the single view file (angular will handle the page changes on the front-end)
        res.sendfile('./public/index.html'); 
    });

};



