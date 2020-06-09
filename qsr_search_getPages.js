// qsr_search_getPages.js
// Gets list of published pages and content of those pages within a Canvas course.
// Intended to be run as a client side user script (Javascript console)
// Tested on Chrome 83.0
// Requires jQuery 1.7
// Made by Melvin Chien <m.chien@utoronto.ca>, Academic and Collaborative Technologies, University of Toronto
// Content from Quercus Support Resources, University of Toronto (https://q.utoronto.ca/courses/46670)
// June 9, 2020
// Canvas API Documentation: https://q.utoronto.ca/doc/api/

// Canvas Pages API URL to desired course
var courseURL = "https://q.utoronto.ca/api/v1/courses/46670/pages/";
var pages = [];

// getPages: Retrieve list of published Pages
function getPages(url) {
  // By default, Canvas will return 10 results per query
  $.getJSON(url, {
      published: true,
      sort: "title",
      order: "asc"
    })
    .done(function(data, status, jqxhr) {
      console.log("Found " + data.length + " Pages.");

      addPages(data).done(function() {
        // When the retrieval of page content is complete, check if more results exist
        var linkHeader = parseLinkHeader(jqxhr.getResponseHeader("link"));

        if (linkHeader.next != null) {
          // If more results exist, continue processing
          getPages(linkHeader.next);
        } else {
          // If no more results exist, export JSON file
          console.log("Successfully processed " + pages.length + " Pages.");
          exportPages();
        }
      });
    }).fail(function() {
      throw new Error("Retrieving list of Pages failed.");
    });
}

// addPages: Retrieve Page content and add them to pages[]
function addPages(pagesList) {
  var deferreds = [];

  $.each(pagesList, function(i, page) {
    if (page.title !== "Search") {
      console.log("Getting Page content: " + page.title);

      deferreds.push($.getJSON(courseURL + page.url)
        .done(function(data) {
          // Strip out HTML tags
          var pageBody = $(data.body).text();

          // Replace new lines and line separators with a single space
          pageBody = pageBody.replace(/\r?\n|\r/gmi, " ");

          // Remove special characters
          // pageBody = pageBody.replace(/[^\w\s]|\u2028/gmi, "");

          // Remove extra spaces
          pageBody = pageBody.replace(/\s{2,}/g, " ").trim();

          // Add page object to pages[]
          pages.push({
            title: page.title,
            slug: page.url,
            url: page.html_url,
            body: pageBody
          });
        }).fail(function() {
          throw new Error("Failed to retrieve content for the Page " + page.title);
        }));
    }
  });

  // Return deferred object
  return $.when.apply($, deferreds);
}

// exportPages: Convert result into .json file
function exportPages() {
  // Sort Pages into alphabetical order
  pages.sort((a, b) => (a.title > b.title) ? 1 : -1);

  var dataStr = JSON.stringify(pages, null, 2);
  var dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  
  console.log("Exporting JSON file.");

  // Create hidden HTML element to trigger download
  var link = document.createElement("a");
  document.body.appendChild(link);
  link.download = "qsr_search_pages.json";
  link.href = dataUri;
  link.click();
}

// parseLinkHeader: Parses the link header object (Source: https://gist.github.com/deiu/9335803)
function parseLinkHeader(header) {
  if (header.length === 0) {
    throw new Error("Cannot parse link header of zero length")
  }

  // Split parts by comma
  var parts = header.split(',');
  var links = {};

  // Parse each part into a named link
  for (var i = 0; i < parts.length; i++) {
    var section = parts[i].split(';');
    if (section.length !== 2) {
      throw new Error("Link header section could not be split on ';'");
    }
    var url = section[0].replace(/<(.*)>/, '$1').trim();
    var name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  }
  return links;
}

// Start the action
getPages(courseURL);