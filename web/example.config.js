config= {
    "doctitle": "Interaktive Karte",
    "timelineMinYear": -50,
    "timelineMaxYear": 200,
    "timelineInitialYear": 0,
    "timelineMarkerBegin": -100,
    "timelineMarkerEnd": 2000,
    "timelineMarkerStep": 10,
    "timelineScaling": 10,
    "timelineEvents": [ 	
		[ "bli", 1940 ], 
		[ "bla", 1960 ],
		[ "blubb", 1975 ],
		[ '<a href="http://asdf.com/">asdf</a> etc', 1985 ],
	],
    "POIBase": "//../db/pois.py",
    "POILayers": [
        {
            "title": "<img src='../img/icon-turm-haekchen.png' style='margin: 4px;' align='right'> Befestigungsanlagen (Daten gesichert)",
            "ranges": "verified",
            "visible": true
        },
        {
            "title": "<img src='../img/icon-turm-transp.png' style='margin: 4px;' align='right'> Befestigungsanlagen (ungesichert/gesch&auml;tzt)",
            "ranges": "unverified",
            "visible": true
        },
        {
            "title": "<img src='../img/icon-turm-kreuz.png' style='margin: 4px;' align='right'> Befestigungsanlagen (in diesem Jahr nicht existierend)",
            "ranges": "inverse",
            "visible": false
        }
    ],
    "animationDefaultStep": 1,
    "dom": {
        ".config.title": { "innerHTML": "Darstellung Wichtiger Dinge" },
        // ".config.timelineYearDisplay": { "style": { "font-size": "10px" } }, // doesn't work yet
    }
}
