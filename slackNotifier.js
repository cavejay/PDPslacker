console.log('Loading 8am event');
var doc = require('dynamodb-doc');
var dynamodb = new doc.DynamoDB();
var request = require('request');

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

function sendToSlack(data) {
    console.log('sending to slack');
    request.post(
        'https://hooks.slack.com/services/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',
        { json: { text: "hi there", icon_emoji: ":computer:" } },
        function (error, response, body) {
            console.log('ha');
            if (!error && response.statusCode == 200) {
                console.log(body)
            }
        }
    );
}

exports.handler = function(event, context) {
    console.log("Request received:\n", JSON.stringify(event));
    console.log("Context received:\n", JSON.stringify(context));

    today = new Date();
    monday = getMonday(today);
    console.log('monday: '+monday);
    
    var tableName = "PDPslackerTest";
    dynamodb.getItem({
            "TableName": tableName,
            "Key": {date: getMonday(new Date()).getTime()}
        }, function(err, data) {
            if (err) {
                context.fail('ERROR: Dynamo failed: ' + err);
            } else {
                console.log('Dynamo Success: ' + JSON.stringify(data));
                // Send request to slack
                sendToSlack(data);
            }
        });
}