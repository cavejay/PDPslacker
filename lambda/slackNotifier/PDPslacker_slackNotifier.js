console.log('Loading 8am event');
var doc = require('dynamodb-doc');
var dynamodb = new doc.DynamoDB();
var request = require('request');
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

slackURL = 'https://hooks.slack.com/services/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';
dynamoTableName = 'PDPslacker';

/*
 * Returns the jsDate of the Monday that starts the week that the input date is part of
 * We use this to figure out with document should be accessed
 */
function getMonday( date ) {
    var day = date.getDay() || 7;  
    if( day !== 1 ) 
        date.setUTCHours(-24 * (day - 1));
        date.setUTCHours(0);
        date.setUTCMinutes(0);
        date.setUTCSeconds(0);
        date.setUTCMilliseconds(0);
    return date;
}

/*
 * Sends the data for the right week to the Slack URL
 * Data contains 2 weeks and the week variable decides which one to use.
 */
function sendToSlack(data, week) {
    var bDiamond = ':small_blue_diamond: ';
    var slackData = {
        "text": "What's on for today, *Monday* Nov 11",
        "attachments": [{
            "title": "Tasks",
            "text": ""
        }]
    };

    var d = new Date();
    d.sp = d.toUTCString().split(' '); // ["Fri,", "11", "Nov", "2016", "11:36:54", "GMT"]
    day = days[d.getUTCDay()-1];
    slackData.text = "What's on for today, "+day+' '+d.sp[2]+' '+d.sp[1];
    
    // console.log(data);

    // Ensure that if we're on the second week, that's where we're looking
    if (week === 2) { data = data.Item.nextWeek; }
    else { data = data.Item; }

    // console.log(data);
    // console.log(day);
    // console.log(data[day]);

    // assemble the task list
    var tasks = '';
    for (var item in data[day]) {
        tasks = tasks+'\n'+ bDiamond + data[day][item];
    }
    slackData.attachments[0].text = tasks;

    // console.log('sending to slack');
    request.post(
        slackURL,
        { json: slackData },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log(body)
            }
        }
    );
}

/*
 * Sends an Error message to slack to let people know what something's gone wrong in a more visible manner.
 * This isn't implemented yet but exists for when it will be
 */
function sendErrorToSlack (errorType) {
    var errorTypes = {nodata: "Could not find any data for today", dbError: "The database encountered a problem"};
    var error = errorType.custom ? errorType.text : errorTypes[errorType];
    // if (errorType.custom) {
    //     error = errorType.text 
    // } else {
    //     error = errorTypes[errorType];
    // }
    
    var slackData = {
        "text": ":exclamation: *An Error occured when attempting to fetch today's tasks* :exclamation:",
        "attachments": [{
            "text": "> *Error:* " + error
        }]
    };

    // console.log('sending error to slack');
    request.post(
        slackURL,
        { json: slackData },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log(body)
            }
        }
    );
}

/*
 * This is called whenever the lambda function is triggered
 * It accesses the db looking for the correct dates and if they exist uses sendToSlack to report the data to slack
 */
exports.handler = function(event, context) {
    // console.log("Request received:\n", JSON.stringify(event));
    // console.log("Context received:\n", JSON.stringify(context));

    monday = getMonday(new Date());
    mondayGMT = monday.getTime() + monday.getTimezoneOffset();
    console.log("first monday "+mondayGMT);

    dynamodb.getItem({
            "TableName": dynamoTableName,
            "Key": {date: mondayGMT}
        }, function(err, data) {
            if (err) {
                // sendErrorToSlack({custom: true, text: err});
                context.fail('ERROR: Dynamo failed: ' + err);
            } else if (JSON.stringify(data) === '{}') {
                // If we didn't get anything check for the week before
                console.log("We couldn't find this weeks document, looking for last week's");

                var lastMondayGMT = mondayGMT-7*24*3600*1000; // go back a week
                console.log("date to check for: "+lastMondayGMT);

                dynamodb.getItem({
                    "TableName": dynamoTableName,
                    "Key": {date: lastMondayGMT}
                }, function (e, d) {
                    if (e) {
                        // sendErrorToSlack({custom: true, text: err});
                        context.fail('ERROR: Dynamo failed: ' + err);
                    } else if (JSON.stringify(d) === '{}') {
                        console.log("Couldn't find any docs from 2 weeks ago");
                        // sendErrorToSlack("nodata");
                        // todo send an error to slack with instructions
                        context.fail("Couldn't find any docs from 2 weeks ago");
                    }
                    sendToSlack(d, 2);
                });
            }
            // Send request to slack
            console.log('Dynamo Success: ' + JSON.stringify(data));
            sendToSlack(data);
        });
};