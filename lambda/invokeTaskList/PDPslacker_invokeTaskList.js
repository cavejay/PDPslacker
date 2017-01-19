console.log('Loading function');
var doc = require('dynamodb-doc');
var dynamodb = new doc.DynamoDB();

days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

slackToken = "thisiswhereyouputyourtoken";

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


function sendToSlack(context, data, week) {
    var bDiamond = ':small_blue_diamond: '
    slackData = {
        "text": "What's on for today, *Monday* Nov 11",
        "attachments": [{
            "title": "Tasks",
            "text": ""
        }]
    }

    var d = new Date();
    d.sp = d.toUTCString().split(' '); // ["Fri,", "11", "Nov", "2016", "11:36:54", "GMT"]
    day = days[d.getUTCDay()-1];
    slackData.text = "What's on for today, "+day+' '+d.sp[2]+' '+d.sp[1];
    
    // Ensure that if we're on the second week, that's where we're looking
    if (week === 2) { data = data.Item.nextWeek; }
    else { data = data.Item; }

    // assemble the task list
    var tasks = ''
    for (var item in data[day]) {
        tasks = tasks+'\n'+ bDiamond + data[day][item];
    }
    slackData.attachments[0].text = tasks;
    
    context.succeed(slackData);
}

function dbCall (context) {
    // console.log("Request received:\n", JSON.stringify(event));
    // console.log("Context received:\n", JSON.stringify(context));

    monday = getMonday(new Date());
    mondayGMT = monday.getTime() + monday.getTimezoneOffset();
    console.log("first monday "+mondayGMT)

    var tableName = "PDPslacker";
    dynamodb.getItem({
            "TableName": tableName,
            "Key": {date: mondayGMT}
        }, function(err, data) {
            if (err) {
                context.fail('ERROR: Dynamo failed: ' + err);
            } else if (JSON.stringify(data) === '{}') {
                // If we didn't get anything check for the week before
                console.log("We couldn't find this weeks document, looking for last week's");

                var lastMondayGMT = mondayGMT-7*24*3600*1000;
                console.log("date to check for: "+lastMondayGMT);

                dynamodb.getItem({
                    "TableName": tableName,
                    "Key": {date: lastMondayGMT}
                }, function (e, d) {
                    if (e) {
                        context.fail('ERROR: Dynamo failed: ' + err);
                    } else if (JSON.stringify(d) === '{}') {
                        console.log('we took the path');
                        context.fail("Couldn't find any docs from 2 weeks ago");
                        // todo send an error to slack with instructions
                    }
                    sendToSlack(context, d, 2);
                });
            }
            // Send request to slack
            console.log('Dynamo Success: ' + JSON.stringify(data));
            sendToSlack(context, data);
        });
}

function procSlackRequest (event) {
    var data = {};
    var params = event.body.split('&');
    for (var p in params) {
        param = params[p].split('=');
        data[param[0]] = param[1];
    }
    return data;
}

// Process the command
exports.handler = function(event, context) {
    //Echo back the text the user typed in
    var input = procSlackRequest(event);
    if (input.token !== slackToken) { // need to make this more secure and pull out to a config file
        context.succeed('Invalid Token'); // this should probably be a fail, not a succeed lol
    }
    
    if (input.text !== undefined && input.text !== '') {
        switch (input.text) {
            default:
                context.succeed('No commands supported at this time');
        }
    } else {
        dbCall(context);
    }
};


