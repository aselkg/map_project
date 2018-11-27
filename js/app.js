var map;
// Create a new blank array for all the listing markers.
var markers = [];
var largeInfowindow;

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 41.2228,
      lng: 74.7388
    },
    zoom: 13,
    mapTypeControl: false
  });
  largeInfowindow = new google.maps.InfoWindow({
    maxWidth: 300
  });
  var bounds = new google.maps.LatLngBounds();
  // locations array in app.js to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the locatioons array.
    initiateMarker(locations[i]);
    bounds.extend(markers[i].position);
  }

  function initiateMarker() {
    var position = locations[i].location;
    var title = locations[i].title;
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');
    // Create a marker per location
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i,
      icon: defaultIcon,
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    locations[i].marker = marker;
    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener('click', function () {
      populateInfoWindow(this, largeInfowindow);
      var self = this;
      this.setAnimation(google.maps.Animation.BOUNCE);
      window.setTimeout(function (marker) {
        self.setAnimation(null);
      }, 800);
    });
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', function () {
      this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function () {
      this.setIcon(defaultIcon);
    });
  }
  // Extend the boundaries of the map for each marker
  map.fitBounds(bounds);
}
// Show info window for all markers
function populateInfoWindow(marker, infowindow) {
  var apiresult
    // Check to make sure the infowindow is not already opened on this marker.
  $.ajax({
    url: 'https://en.wikipedia.org/w/api.php',
    data: {
      format: "json",
      action: "query",
      list: "search",
      srsearch: marker.title,
      formatversion: 2
    },
    dataType: 'jsonp',
    headers: {
      'Api-User-Agent': 'MyCoolTool/1.1 (http://example.com/MyCoolTool/; MyCoolTool@example.com) BasedOnSuperLib/1.4'
    },
  }).done(function (data) {
    apiresult = data.query.search["0"].snippet;
  }).fail(function (err) {
    alert("Failed to Load data from wikipedia api")
  }).then(function () {
    if (infowindow.marker != marker) {
      infowindow.marker = marker;
      infowindow.setContent('<div> <h1>' + marker.title + '</h1>' + apiresult + '</div>');
      infowindow.open(map, marker);
      infowindow.addListener('closeclick', function () {
        infowindow.setMarker = null;
      });
    }
  })
}

function myerrorhandler() {
  alert(" There's a problem loading Google Maps");
}
var Place = function (data) {
  this.title = data.title;
  this.longitude = data.location.lng;
  this.latitude = data.location.lat;
  this.marker = data.marker;
};
// ViewModel
var ViewModel = function () {
  var self = this;
  this.listOfLocations = ko.observableArray([]);
  locations.forEach(function (place) {
    self.listOfLocations.push(new Place(place));
  });
  this.mapLocations = locations;
  self.hideMarkers = function () {
    for (i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
  };
  // Hide and show naviagtion menu on desktop and mobile
  self.showList = function () {
    $(".menu-list").css('width', '50%');
  };
  self.closeList = function () {
    $(".menu-list").css('width', '0');
  };
  self.placeInfo = function (place) {
    $.ajax({
      url: 'http://en.wikipedia.org/w/api.php',
      data: {
        format: "json",
        action: "query",
        list: "search",
        srsearch: this.title,
        formatversion: 2
      },
      dataType: 'jsonp',
      headers: {
        'Api-User-Agent': 'MyCoolTool/1.1 (http://example.com/MyCoolTool/; MyCoolTool@example.com) BasedOnSuperLib/1.4'
      },
    }).done(function (data) {
      function strip(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
      }
      var changetoText = strip(data.query.search["0"].snippet + data.query.search["1"].snippet);
      this.description = changetoText;
    }).fail(function (err) {
      alert("Something went wrong :(");
    });
    if (place.marker !== null) {
      populateInfoWindow(place.marker, largeInfowindow, place);
      place.marker.setAnimation(google.maps.Animation.BOUNCE);
      window.setTimeout(function () {
        place.marker.setAnimation(null);
      }, 800);
    }
  };
  // output filtering handler
  this.query = ko.observable("");
  this.searchResults;
  this.searchResultsM;
  self.filteredRecords = ko.computed(function () {
    if (!self.query()) {
      searchResults = self.mapLocations;
      searchResultsM = markers;
    } else {
      self.hideMarkers();
      searchResults = ko.utils.arrayFilter(self.mapLocations, function (place) {
        return (
          (self.query().length === 0 || place.title.toLowerCase().indexOf(self.query().toLowerCase()) > -1));
      });
      searchResultsM = ko.utils.arrayFilter(markers, function (marker) {
        return (
          (self.query().length === 0 || marker.title.toLowerCase().indexOf(self.query().toLowerCase()) > -1));
      });
    }
    for (i = 0; i < searchResultsM.length; i++) {
      searchResultsM[i].setMap(map);
    }
    return searchResults;
  });
};
ko.applyBindings(new ViewModel());
// / This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2', new google.maps.Size(21, 34), new google.maps.Point(0, 0), new google.maps.Point(10, 34), new google.maps.Size(21, 34));
  return markerImage;
}