// Variables
doc = { nextWeek: {} }
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
reader = new FileReader();

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) { } else {
    alert('The File APIs are not fully supported in this browser.');
}

reader.onload = function () {
    r = reader.result;
    mammoth.convertToHtml({ arrayBuffer: r }).then(function (result) {
        var html = result.value; // The generated HTML 
        var messages = result.messages; // Any messages, such as warnings during conversion 
        ch = cheerio.load(html);
        doc.tip = ch('ul li').first().text();
        mDate = ch('p:contains("Date")').first().text().split(' ')[1];
        doc.date = new Date(mDate).setUTCHours(0);

        // Get data for this week
        for (day in days) {
            doc[days[day]] = ch(':contains("' + days[day] + ':")').first().next().children().map((i, el) => {
                return ch(el).text();
            }).get();
        }

        // Get data for next week
        for (day in days) {
            doc.nextWeek[days[day]] = ch(':contains("' + days[day] + ':")').eq(-2).next().children().map((i, el) => {
                return ch(el).text();
            }).get();
        }
        console.log(doc);

        // ensure that the doc was read properly
        for (day in days) { // todo merge these 3 loops together
            d = doc[days[day]]; nd = doc.nextWeek[days[day]];
            if (d == undefined || d == '' || nd == undefined || nd == '') {
                console.log('Parsing Failure');
                return;
            }
        }

        // save the doc with todays date somewhere
        $.ajax({
            url: "https://h3x59il8tl.execute-api.us-west-2.amazonaws.com/prod/",
            type: "POST",
            data: JSON.stringify(doc),
            dataType: "json",
            success: function (result) {
                console.log("We sent the thing to the people and got this back:");
                console.log(result);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    }).done(); // todo return an error if bad things happen inside mammoth
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // Files is a list, lets just grab the first one and display it
    var output = [], f = files[0]
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
        f.size, ' bytes, last modified: ',
        f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
        '</li>');

    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    reader.readAsArrayBuffer(files[0]);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the drop listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);