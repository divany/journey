var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ExchangeRates = (function () {
    function ExchangeRates(code, addCoordinate, update) {
        this.code = code;
        this.addCoordinate = addCoordinate;
        this.update = update;
    }
    ExchangeRates.today = function () {
        var date = new Date();
        var day = ("0" + date.getDate()).slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var year = date.getFullYear();
        return day + "/" + month + "/" + year;
    };
    ExchangeRates.proxyUrl = function (url) {
        return "https://jsonp.nodejitsu.com/?url=" + encodeURIComponent(url) + "&raw=true";
    };
    ExchangeRates.prototype.url = function () {
        return "http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=22/06/2014&date_req2=" + ExchangeRates.today() + "&VAL_NM_RQ=" + this.code;
    };
    ExchangeRates.prototype.fetch = function () {
        var self = this;
        $.ajax({
            url: ExchangeRates.proxyUrl(self.url()),
            type: 'GET',
            crossDomain: true,
            dataType: 'xml',
            success: function (xml) {
                $(xml).find('Record').each(function () {
                    var date = $(this).attr('Date');
                    var value = $(this).find('Value').text().replace(',', '.');
                    self.addCoordinate(date, +value);
                });
                self.update();
            }
        });
    };
    return ExchangeRates;
})();
var USD = (function (_super) {
    __extends(USD, _super);
    function USD(addCoordinate, update) {
        _super.call(this, "R01235", addCoordinate, update);
    }
    return USD;
})(ExchangeRates);
var EUR = (function (_super) {
    __extends(EUR, _super);
    function EUR(addCoordinate, update) {
        _super.call(this, "R01239", addCoordinate, update);
    }
    return EUR;
})(ExchangeRates);
var Journey = (function () {
    function Journey() {
        this.latitudes = {};
        this.longitudes = {};
    }
    Journey.prototype.addLatitude = function (date, latitude) {
        this.latitudes[date] = latitude;
    };
    Journey.prototype.addLongitudes = function (date, longitudes) {
        this.longitudes[date] = longitudes;
    };
    Journey.prototype.init = function () {
        var mapPosition = new google.maps.LatLng(46.6478, 34.2797);
        var mapOptions = {
            zoom: 12,
            center: mapPosition,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };
        this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    };
    Journey.prototype.run = function () {
        google.maps.event.addDomListener(window, 'load', this.init.bind(this));
        (new EUR(this.addLatitude.bind(this), this.update.bind(this))).fetch();
        (new USD(this.addLongitudes.bind(this), this.update.bind(this))).fetch();
    };
    Journey.prototype.update = function () {
        var line = [];
        for (var label in this.latitudes) {
            if (this.longitudes[label] != undefined) {
                var lat = this.latitudes[label];
                var long = this.longitudes[label];
                var location = new google.maps.LatLng(lat, long);
                var contentString = "<h2>" + label + "</h2>USD: " + lat + "<br />EUR: " + long;
                var marker = new google.maps.Marker({
                    position: location,
                    map: this.map,
                    title: contentString
                });
                line.push(location);
                var self = this;
                google.maps.event.addListener(marker, "click", function (e) {
                    var infowindow = new google.maps.InfoWindow({
                        content: this.getTitle()
                    });
                    infowindow.open(self.map, this);
                });
            }
        }
        if (line.length > 0) {
            var flightPath = new google.maps.Polyline({
                path: line,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            flightPath.setMap(this.map);
        }
    };
    return Journey;
})();
var j = new Journey();
j.run();
//# sourceMappingURL=journey.js.map