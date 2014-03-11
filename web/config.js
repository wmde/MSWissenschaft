var beginDate= Date.parse("2014-05-06");
function DayOffset(datestring) {
    var d= (Date.parse(datestring) - beginDate) / (1000/*seconds*/ * 60 /*minutes*/ * 60 /*hours*/ * 24 /*days*/);
    return d;
}
config= {
    "doctitle": "Interaktive Karte",
    "timelineMin": 0,
    "timelineMax": 30*5,
    "timelineInitial": 0,
    "timelineMarkerBegin": 0,
    "timelineMarkerEnd": 30*5,
    "timelineMarkerStep": -1,
    "timelineScaling": 70,
    "timelineUnit": "days",
    "timelineEvents": [ 	
		{"lat": "52.52", "time": DayOffset('2014-05-06'), "lon": "13.38", "title": "Berlin<br/>Schiffbauerdamm 15"},
		{"lat": "52.385", "time": DayOffset('2014-05-12'), "lon": "13.03", "title": "Potsdam<br/>Yachthafen, Kastanienallee"},
		{"lat": "52.14", "time": DayOffset('2014-05-16'), "lon": "11.66", "title": "Magdeburg<br/>Wissenschaftshafen"},
		{"lat": "52.135", "time": DayOffset('2014-05-18'), "lon": "11.65", "title": "Magdeburg<br/>Am Petrif\u00f6rder, Wei\u00dfe Flotte"},
		{"lat": "51.855", "time": DayOffset('2014-05-20'), "lon": "12.22", "title": "Dessau<br/>Liegestelle am Kornhaus"},
		{"lat": "52.28", "time": DayOffset('2014-05-23'), "lon": "11.405", "title": "Haldensleben<br/>Anleger Fahrgastschiff Roland"},
		{"lat": "53.075", "time": DayOffset('2014-05-30'), "lon": "8.81", "title": "Bremen<br/>Liegestelle \u201cTiefer\u201d"},
		{"lat": "52.645", "time": DayOffset('2014-06-03'), "lon": "9.2", "title": "Nienburg<br/>Linke Weserseite, oberhalb der Weserbr\u00fccke"},
		{"lat": "53.14", "time": DayOffset('2014-06-07'), "lon": "8.23", "title": "Oldenburg<br/>Alter Stadthafen"},
		{"lat": "53.09", "time": DayOffset('2014-06-10'), "lon": "7.375", "title": "Papenburg<br/>Liegestelle im Devernhafen"},
		{"lat": "51.955", "time": DayOffset('2014-06-14'), "lon": "7.64", "title": "M\u00fcnster<br/>Stadthafen"},
		{"lat": "51.655", "time": DayOffset('2014-06-17'), "lon": "7.36", "title": "Datteln<br/>Liegehafen Hubertusstra\u00dfe"},
		{"lat": "51.525", "time": DayOffset('2014-06-20'), "lon": "7.44", "title": "Dortmund<br/>Stadthafen"},
		{"lat": "51.495", "time": DayOffset('2014-06-24'), "lon": "6.86", "title": "Oberhausen<br/>Am Kaisergarten, Rhein-Herne-Kanal"},
		{"lat": "51.435", "time": DayOffset('2014-06-27'), "lon": "6.76", "title": "Duisburg<br/>Innenhafen"},
		{"lat": "50.735", "time": DayOffset('2014-06-30'), "lon": "7.11", "title": "Bonn<br/>Brassertufer"},
		{"lat": "50.72", "time": DayOffset('2014-07-03'), "lon": "7.13", "title": "Bonn<br/>Stresemannufer"},
		{"lat": "50.445", "time": DayOffset('2014-07-04'), "lon": "7.4", "title": "Andernach<br/>Rheinpromenade, Konrad-Adenauer-Allee"},
		{"lat": "50.145", "time": DayOffset('2014-07-07'), "lon": "7.17", "title": "Cochem<br/>Cond, Stadionstra\u00dfe"},
		{"lat": "49.765", "time": DayOffset('2014-07-11'), "lon": "6.63", "title": "Trier<br/>Kaiser-Wilhelm-Br\u00fccke"},
		{"lat": "49.495", "time": DayOffset('2014-07-14'), "lon": "6.59", "title": "Mettlach<br/>Anleger an der Oktavienstra\u00dfe"},
		{"lat": "49.235", "time": DayOffset('2014-07-17'), "lon": "6.99", "title": "Saarbr\u00fccken<br/>Berliner Promenade"},
		{"lat": "49.605", "time": DayOffset('2014-07-24'), "lon": "6.555", "title": "Saarburg<br/>St\u00e4dtische Liegestelle unter der Saarbr\u00fccke"},
		{"lat": "49.915", "time": DayOffset('2014-07-26'), "lon": "7.07", "title": "Bernkastel-Kues<br/>Uferpromenade, Bahnhofstra\u00dfe"},
		{"lat": "50.365", "time": DayOffset('2014-07-29'), "lon": "7.6", "title": "Koblenz<br/>Peter-Altmeier-Ufer"},
		{"lat": "49.755", "time": DayOffset('2014-08-01'), "lon": "8.475", "title": "Gernsheim<br/>Rheinanleger, Schifferstra\u00dfe"},
		{"lat": "49.475", "time": DayOffset('2014-08-04'), "lon": "8.46", "title": "Mannheim<br/>Lindenhof, Rheinpromenade"},
		{"lat": "50.035", "time": DayOffset('2014-08-08'), "lon": "8.24", "title": "Wiesbaden<br/>Biebrich-Rheingaustra\u00dfe"},
		{"lat": "50.105", "time": DayOffset('2014-08-12'), "lon": "8.68", "title": "Frankfurt<br/>Eiserner Steg"},
		{"lat": "49.705", "time": DayOffset('2014-08-15'), "lon": "9.26", "title": "Miltenberg<br/>Liegestelle am Minigolfplatz"},
		{"lat": "49.995", "time": DayOffset('2014-08-18'), "lon": "9.58", "title": "Lohr<br/>Am Mainkai"},
		{"lat": "49.8", "time": DayOffset('2014-08-21'), "lon": "9.92", "title": "W\u00fcrzburg<br/>Viehmarkt, Dreikronenstra\u00dfe"},
		{"lat": "50.045", "time": DayOffset('2014-08-26'), "lon": "10.24", "title": "Schweinfurt<br/>Am unteren Marienbach"},
		{"lat": "49.88", "time": DayOffset('2014-08-29'), "lon": "10.91", "title": "Bamberg<br/>Schleuse Bamberg"},
		{"lat": "48.31", "time": DayOffset('2014-09-04'), "lon": "14.29", "title": "Linz<br/>Liegestelle am Ars Electronica Center"},
		{"lat": "48.405", "time": DayOffset('2014-09-09'), "lon": "15.59", "title": "Krems<br/>Schiffsstation Krems/Stein"},
		{"lat": "48.24", "time": DayOffset('2014-09-12'), "lon": "16.39", "title": "Wien<br/>Handelskai"},
		{"lat": "48.825", "time": DayOffset('2014-09-19'), "lon": "12.95", "title": "Deggendorf<br/>St\u00e4dtischer Anleger"},
		{"lat": "49.02", "time": DayOffset('2014-09-22'), "lon": "12.11", "title": "Regensburg<br/>Werftstra\u00dfe, Anleger \u201cWili\u201d"},
		{"lat": "49.73", "time": DayOffset('2014-09-26'), "lon": "11.05", "title": "Forchheim<br/>Main-Donau-Kanal, Austra\u00dfe"},
	],
    "POIBase": "../query/query.py",
    "POILayers": [
        {
            "title": "<img src='img/icon-Politik.png' style='margin: 4px;' align='right'> Politik",
            "categories": "Politik",
            "visible": true
        },
        {
            "title": "<img src='img/icon-Kultur.png' style='margin: 4px;' align='right'> Kultur",
            "categories": "Kultur",
            "visible": true
        },
        {
            "title": "<img src='img/icon-Bildung.png' style='margin: 4px;' align='right'> Bildung",
            "categories": "Bildung",
            "visible": true
        },
        {
            "title": "<img src='img/icon-Wirtschaft.png' style='margin: 4px;' align='right'> Wirtschaft",
            "categories": "Wirtschaft",
            "visible": true
        }
    ],
    "animationDefaultStep": 5,
    "dom": {
        ".config.title": { "innerHTML": "" },
        // ".config.timelineYearDisplay": { "style": { "font-size": "10px" } }, // doesn't work yet
    }
}
