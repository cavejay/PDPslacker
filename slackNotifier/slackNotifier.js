console.log('Loading 8am event');
var doc = require('dynamodb-doc');
var dynamodb = new doc.DynamoDB();
var request = require('request');
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

function sendToSlack(data, week) {
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
    
    // console.log(data);

    // Ensure that if we're on the second week, that's where we're looking
    if (week === 2) { data = data.Item.nextWeek; }
    else { data = data.Item; }

    // console.log(data);
    // console.log(day);
    // console.log(data[day]);

    // assemble the task list
    var tasks = ''
    for (item in data[day]) {
        tasks = tasks+'\n'+ bDiamond + data[day][item];
    }
    slackData.attachments[0].text = tasks;

    // console.log('sending to slack');
    request.post(
        'https://hooks.slack.com/services/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',
        { json: slackData },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log(body)
            }
        }
    );
}

exports.handler = function(event, context) {
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
                    sendToSlack(d, 2);
                });
            }
            // Send request to slack
            console.log('Dynamo Success: ' + JSON.stringify(data));
            sendToSlack(data);
        });
}