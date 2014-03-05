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
    "POIBase": "../db/pois.py",
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
    "animationDefaultStep": 5,
    "dom": {
        ".config.title": { "innerHTML": "" },
        // ".config.timelineYearDisplay": { "style": { "font-size": "10px" } }, // doesn't work yet
    }
}
