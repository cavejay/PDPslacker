// var credentialOptions = require('./config')
// var spr = require('sp-request').create(credentialOptions);
// spr.get('http://dynatrace.sharepoint.com/sites/dev/_api/web') //sites/apmcso/PDP/PDP%20Member%20Documents/328/Team%20Meeting%20Notes')
//   .then(function (response) {
//     console.log(response)
//   })
//   .catch(function(err){
//       console.log(err);
//     console.log('Ohhh, something went wrong...');
//   });

// var spauth = require('node-sp-auth');
// var request = require('request-promise');

// spauth
//   .getAuth('https://dynatrace.sharepoint.com/sites/apmcso/PDP/PDP%20Member%20Documents/', {
//     username: require('./config').username,
//     password: require('./config').password
//   })
//   .then(function (data) {
//     var headers = data.headers;
//     headers['Accept'] = 'application/json;odata=verbose';

//     request.get({
//       url: 'https://dynatrace.sharepoint.com/sites/apmcso/PDP/PDP%20Member%20Documents/_api/web',
//       headers: headers,
//       json: true
//     }).then(function (response) {
//       console.log(response.d.Title);
//     });
//   });

var sppull = require("sppull").sppull;
 
var context = {
    siteUrl: "http://dynatrace.sharepoint.com/sites/apmcso",
    username: require('./config').username,
    password: require('./config').password
};
 
var options = {
    spRootFolder: "PDP/PDP%20Member%20Documents/328/Team%20Meeting%20Notes/",
    dlRootFolder: "."
};
 
/* 
 * All files will be downloaded from http://contoso.sharepoint.com/subsite/Shared%20Documents/Contracts folder 
 * to __dirname + /Downloads/Contracts folder.
 * Folders structure will remain original as it is in SharePoint's target folder.
*/
sppull(context, options)
    .then(function(downloadResults) {
        console.log("Files are downloaded");
        console.log("For more, please check the results", JSON.stringify(downloadResults));
    })
    .catch(function(err) {
        console.log("Core error has happened", err);
    });