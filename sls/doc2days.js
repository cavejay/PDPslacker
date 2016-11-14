var mammoth = require("mammoth");
var cheerio = require("cheerio");

doc = {nextWeek: {}}
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

mammoth.convertToHtml({path: "docs/PDP 328 Team Meeting 10-31-16.docx"})
    .then(function(result){
        var html = result.value; // The generated HTML 
        var messages = result.messages; // Any messages, such as warnings during conversion 
        $ = cheerio.load(html);
        
        doc.tip = $('ul li').first().text();
        
        // Get data for this week
        for (day in days) {
            doc[days[day]] = $(':contains("'+days[day]+':")').first().next().children().map((i, el) => {
                return $(el).text();
            }).get();
        }

        // Get data for next week
        for (day in days) {
            doc.nextWeek[days[day]] = $(':contains("'+days[day]+':")').eq(-2).next().children().map((i, el) => {
                return $(el).text();
            }).get();
        }
        console.log(doc);

        // save the doc with todays date somewhere
        // every day at 8am print that day's topics'
    })
    .done();