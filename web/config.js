var beginDate= Date(Date.parse("06.05.2014"));
function DayOffset(datestring) {
    return (Date(Date.parse(datestring))-beginDate).valueOf() / (1000/*seconds*/*60/*minutes*/*60/*hours*/*24/*days*/);
}
config= {
    "doctitle": "Interaktive Karte",
    "timelineMin": 0,
    "timelineMax": 90,
    "timelineInitial": 0,
    "timelineMarkerBegin": 0,
    "timelineMarkerEnd": 90,
    "timelineMarkerStep": 7,
    "timelineScaling": 10,
    "timelineUnit": "days",
    "timelineEvents": [ 	
		//~ [ "Beginn Fr&uuml;hkaiserzeit", -30 ], 
		//~ [ "Beginn Hohe Kaiserzeit ", 69 ],
		//~ [ "Beginn Sp&auml;tkaiserzeit", 180 ],
		//~ [ "Beginn Sp&auml;tantike", 284 ],
        { "title": "Berlin,Schiffbauerdamm 15", "lat": 13.38, "lon": 52.52, "time": DayOffset("06.05.2014") }, 
        //~ Potsdam,"Yachthafen, Kastanienallee",13.03,52.385,12.05.2014, 14.05.2014 
        //~ Magdeburg,Wissenschaftshafen,11.66,52.14,16.05.2014, 17.05.2014 
        //~ Magdeburg,"Am Petriförder, Weiße Flotte",11.65,52.135,18.05.2014, 19.05.2014 
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
