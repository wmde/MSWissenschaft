config= {
    "doctitle": "Interaktive Karte",
    "timelineMinYear": -50,
    "timelineMaxYear": 650,
    "timelineInitialYear": 0,
    "timelineMarkerBegin": -100,
    "timelineMarkerEnd": 600,
    "timelineMarkerStep": 50,
    "timelineScaling": 3,
    "timelineEvents": [ 	
		[ "Beginn Fr&uuml;hkaiserzeit", -30 ], 
		[ "Beginn Hohe Kaiserzeit ", 69 ],
		[ "Beginn Sp&auml;tkaiserzeit", 180 ],
		[ "Beginn Sp&auml;tantike", 284 ],
	],
    "POIBase": "../query/query.py",
    "POILayers": [
        {
            "title": "<img src='img/icon-Politik.png' style='margin: 4px;' align='right'> Politik",
            "ranges": "verified",   // maybe i have to change all this... "ranges"?
            "visible": true
        },
        {
            "title": "<img src='img/icon-Kultur.png' style='margin: 4px;' align='right'> Kultur",
            "ranges": "verified",   // maybe i have to change all this... "ranges"?
            "visible": true
        },
        {
            "title": "<img src='img/icon-Bildung.png' style='margin: 4px;' align='right'> Bildung",
            "ranges": "unverified",
            "visible": true
        },
        {
            "title": "<img src='img/icon-Wirtschaft.png' style='margin: 4px;' align='right'> Wirtschaft",
            "ranges": "inverse",
            "visible": false
        }
    ],
    "animationDefaultStep": 5,
    "dom": {
        ".config.title": { "innerHTML": "" },
        // ".config.timelineYearDisplay": { "style": { "font-size": "10px" } }, // doesn't work yet
    }
}