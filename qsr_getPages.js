// Get list of pages and content of those pages within a Canvas course
// Intended to be run as a client side user script (copy to console)
// Tested on Firefox 56.0 and Chrome 70.0
// Made by Melvin Chien, Academic and Collaborative Technologies, University of Toronto
// Content from Quercus Support Resources, University of Toronto (https://q.utoronto.ca/courses/46670)
// February 22, 2019
// Canvas API: https://canvas.instructure.com/doc/api/index.html

var courseURL = "https://q.utoronto.ca/api/v1/courses/46670/"; // API URL to desired course
var pages = [];

// getPageList: Build list of published Pages (up to 200 Pages)
function getPageList() {
  return $.getJSON(courseURL + "pages?per_page=200")
    .done(function(data) {
      $.each(data, function(i, page) {
        if (page.published && page.title !== "Search") {
          console.log("Found published page: " + page.title + " (" + page.url + ")");
          pages.push({
            title: page.title,
            slug: page.url,
            url: page.html_url
          });
        }
      });
      console.log("Number of published pages: " + pages.length);
    }).fail(function() {
      console.log("Retrieving list of pages failed.");
      // TO DO: Show error notification to user
    });
}

//getPageContent: Retrieve content of each published Page
function getPageContent() {
  var deferreds = [];

  $.each(pages, function(i, page) {
    deferreds.push($.getJSON(courseURL + "pages/" + page.slug)
      .done(function(data) {
        console.log("Retrieving page content: " + page.title + " (" + page.slug + ")");

        // Strip out HTML tags
        var bodyText = $(data.body).text();
        // Strip out new lines, line separators, and any symbols
        bodyText = bodyText.replace(/\r?\n|\r/gmi, " ").replace(/[^\w\s]|\u2028/gmi, "");
        // Strip out extra spaces
        bodyText = bodyText.replace(/\s+/g, " ").trim();

        pages[i].body = bodyText;
      }).fail(function() {
        console.log("Retrieving content of pages failed.");
        // TO DO: Either remove page or try again or something smart
      }));
  });

  // Process Page content retrievals all at once and wait until finished before moving on
  $.when.apply(null, deferreds).done(function() {
    console.log("Content retrieved for " + deferreds.length + " pages");
    exportFile();
  });
}

// exportPages: Convert result into .json file and return JSON string
function exportFile() {
  var dataStr = JSON.stringify(pages, null, 2);
  var dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  // Create hidden HTML element to trigger download
  console.log("Exporting file.");
  var link = document.createElement("a");
  document.body.appendChild(link);
  link.download = "qsr_search_pages.json";
  link.href = dataUri;
  link.click();

  return dataStr;
}

$.when(getPageList()).done(function() {
  getPageContent();
});