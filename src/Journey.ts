/*
 * http://divany.github.io/journey
 *
 * Copyright (c) 2015 Kirill A. Korinskiy
 * Licensed under the Public Domain.
 */

/// <reference path="../typings/bundle.d.ts" />

/*
 * Historical exchange rates from Russian Central Bank:
 *  http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=01/01/2014&date_req2=04/01/2015&VAL_NM_RQ=<CODE>
 *
 * USD: R01235
 * EUR: R01239
 */

//"use strict";

interface AddCoordinate {
    (label: string, coordinate: number): void;
}

interface Update {
    (): void
}

class ExchangeRates {
    constructor(private code: string,
                public addCoordinate: AddCoordinate,
                public update: Update) {
    }

    static today() {
        var date = new Date();
        var day = ("0" + date.getDate()).slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var year = date.getFullYear();

        return day + "/" + month + "/" + year;
    }

    static proxyUrl(url){
        return "https://jsonp.nodejitsu.com/?url=" + encodeURIComponent(url) + "&raw=true";
    }

    url() {
        // TODO: make from and to dates configurable
        return "http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=22/06/2014&date_req2=" + ExchangeRates.today() + "&VAL_NM_RQ=" + this.code;
    }

    fetch() {
        var self: ExchangeRates = this;
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
    }
}

class USD extends ExchangeRates {
    constructor(addCoordinate: AddCoordinate, update: Update) {
        super("R01235", addCoordinate, update);
    }
}

class EUR extends ExchangeRates {
    constructor(addCoordinate: AddCoordinate, update: Update) {
        super("R01239", addCoordinate, update);
    }
}

class Journey {
    private latitudes:{[index: string]: number} = {};
    private longitudes:{[index: string]: number} = {};
    private map: google.maps.Map;

    constructor() { }

    addLatitude(date: string, latitude: number) {
        this.latitudes[date] = latitude;
    }

    addLongitudes(date: string, longitudes: number) {
        this.longitudes[date] = longitudes;
    }

    init() {
        var mapPosition = new google.maps.LatLng(46.6478, 34.2797);
        var mapOptions = {
            zoom: 12,
            center: mapPosition,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };

        this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }

    run() {
        google.maps.event.addDomListener(window, 'load', this.init.bind(this));
        (new EUR(this.addLatitude.bind(this), this.update.bind(this))).fetch();
        (new USD(this.addLongitudes.bind(this), this.update.bind(this))).fetch();
    }

    update() {
        var line = []
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

                    infowindow.open(self.map, this)
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
    }
}

var j = new Journey();
j.run();