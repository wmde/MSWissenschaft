/*
    strawberry limes: create interactive OpenLayers maps with time-based POIs
    Copyright (C) 2013 Johannes Kroll

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var map, selectControl;
var POILayers= new Array();
var baseUrl= getConfig('POIBase', "../db/pois.py");
var initialPOIsLoaded= false;
var selectFeature;
var currentPier;    // dict returned by '/poi-query/pier-for-date/<string:date>'

/**
* Parse hash bang parameters from a URL as key value object.
*
* For repeated parameters the last parameter is effective.
*
* If = syntax is not used the value is set to null.
*
* #x&y=3 -> { x:null, y:3 }
*
* @param aURL URL to parse or null if window.location is used
*
* @return Object of key -> value mappings.
*/
function parseHashBangArgs(aURL) {
    aURL = aURL || window.location.href;
    var vars = {};
    var hashes = aURL.slice(aURL.indexOf('#') + 1).split('&');

    for(var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        if(hash.length > 1) {
            vars[hash[0]] = hash[1];
        } else {
            vars[hash[0]] = null;
        }
    }
    return vars;
}

// from http://stackoverflow.com/questions/5796718/html-entity-decode
var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();


// returns list of features with 'str' in title
// todo: this searches the complete HTML title, so e.g. '<a href=' 
// matches all entries :)
function findStringInPOItitles(str) {
	console.log('findStringInPOItitles %s', str);
	var features= [];
    for(var i= 0; i<POILayers.length; i++) {
        if(POILayers[i].visibility) features= features.concat(POILayers[i].features);
    }
	var result= [];
	for(var i= 0; i<features.length; i++) {
		if(decodeEntities(features[i].attributes['title']).toLowerCase().search(str.toLowerCase())!=-1) {
			result.push(features[i]);
		}
	}
	return result;
}

function setLoadingState(on) {
	var foo= document.getElementById('loadingbox');
	if(foo)
	{
		if(on) foo.innerHTML="<img src='../img/loading.gif' width=16 height=16/>";
		else foo.innerHTML="";
	}
}

function poiLoadstart(evt) {
	//document.getElementById("loadstatus").innerHTML= "...";
	setLoadingState(true);
	//~ if(evt) 
	//~ {
		//~ for(i in evt)
			//~ console.log(i, evt[i]);
	//~ }
}

var focusFeature= null;
function poiLoadend(evt) {
	//document.getElementById("loadstatus").innerHTML= "&nbsp;";
	setLoadingState(false);
	
        //~ map.maxExtent= POILayers[0].getDataExtent();
        //~ map.restrictedExtent= POILayers[0].getDataExtent();
        //~ var e= POILayers[0].getDataExtent();
        //~ console.log(e.left, e.top, e.right, e.bottom);
        //~ console.log(map.maxExtent);

	if(!initialPOIsLoaded && POILayers[0].getDataExtent()!=null) {
		initialPOIsLoaded= true;
        if(focusFeature) {
            //~ window.alert("selecting " + focusFeature);
            console.log (map.zoom);
            zoomToFeature(focusFeature, true, 6);
            //~ map.zoomToScale(100, true);
        }
        else {
            map.zoomToExtent(POILayers[0].getDataExtent());
        }
	}
    //~ searchtextChanged();
    
    addCurrentPierPOI();
}

function createPOILayer(title) {
    var styleMap = new OpenLayers.StyleMap({
            pointRadius: '${pointRadius}',
            externalGraphic: 'img/icon-${category}.png',
            //~ title: '<a href="../pages/data/de.wikipedia.org/wiki/${page_title}">${page_title}</a>'
        });
	var layer= new OpenLayers.Layer.Vector(title, {
		strategies: [ 
			new OpenLayers.Strategy.BBOX({resFactor: 1.1})
			],
        projection: "EPSG:4326",
		protocol: new OpenLayers.Protocol.HTTP({
			url: baseUrl + "/asdf/Kultur,Politik,Wirtschaft,Wissenschaft+Bildung",
			//~ format: new OpenLayers.Format.Text()
			format: new OpenLayers.Format.GeoJSON()
		}),
        styleMap: styleMap
	});
	layer.events.on({
		'featureselected': onFeatureSelect,
		'featureunselected': onFeatureUnselect,
		'loadstart': poiLoadstart,
		'loadend': poiLoadend
	});
	map.addLayer(layer);
	return layer;
}

function dateToYMD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

function setPOILayerTime(time) {
    console.log("setPOILayerTime " + time);
    var layerConfig= getConfig('POILayers', '');
    for(var i= 0; i<POILayers.length; i++) {
        POILayers[i].protocol= new OpenLayers.Protocol.HTTP({
                //~ url: baseUrl + '?categories=' + layerConfig[i].categories+ '&time=' + time,
                url: baseUrl + '/' + dateToYMD(new Date(beginDate+time*(1000/*seconds*/ * 60 /*minutes*/ * 60 /*hours*/ * 24 /*days*/))) + '/' + layerConfig[i].categories,
                //~ format: new OpenLayers.Format.Text()
                format: new OpenLayers.Format.GeoJSON()
            });
        console.log(POILayers[i].protocol['url']);
        POILayers[i].refresh({force:true});
        POILayers[i].redraw();
    }
	
	//~ if(document.getElementById("time-display")) document.getElementById("time-display").innerHTML= time; 
	timerCurrTime= time;
    
    zoomToCurrentPier();
}

function addCurrentPierPOI() {
    var lat= currentPier['pier_latitude'];
    var lon= currentPier['pier_longitude'];
    var center= new OpenLayers.LonLat(parseFloat(lon), parseFloat(lat)).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    var point= new OpenLayers.Geometry.Point(center.lon, center.lat);
    var pointFeature = new OpenLayers.Feature.Vector(point,null,null);
    pointFeature.attributes.category= "SymbolFerry";
    pointFeature.attributes.hitcount= 10000000;
    pointFeature.attributes.pointRadius= 20;
    pointFeature.attributes.page_title= currentPier['pier_city'];
    pointFeature.attributes.title= "Station: " + currentPier['pier_city'];
    var options = {weekday: "long", year: "numeric", month: "long", day: "numeric"};
    var dateStart= new Date(Date.parse(currentPier['pier_date_start'])).toLocaleDateString('de-DE', options);
    var dateEnd= new Date(Date.parse(currentPier['pier_date_end'])).toLocaleDateString('de-DE', options);
    pointFeature.attributes.description= currentPier['pier_address'] + '<br/>' + "Ankunft: " + dateStart + '<br/>' + "Abfahrt: " + dateEnd;
    console.log("currentPier: ", currentPier);
    POILayers[0].addFeatures([pointFeature]);
}

function zoomToCurrentPier() {
    var date= dateToYMD(new Date(beginDate+timerCurrTime*(1000/*seconds*/ * 60 /*minutes*/ * 60 /*hours*/ * 24 /*days*/)));
    var req= new XMLHttpRequest();
    var str= "/poi-query/pier-for-date/" + date;
    req.open("GET", str, false);
    req.send();
    //~ console.log(req.responseText);
    response= JSON.parse(req.responseText);
    currentPier= response;
    if(map) {
        var lat= response['pier_latitude'];
        var lon= response['pier_longitude'];
        var center= new OpenLayers.LonLat(parseFloat(lon), parseFloat(lat)).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
        map.setCenter(center, 14, false, false);
    }
}

/*
function long2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }

function get_my_url (bounds) {

    var res = map.getResolution();
    var x = Math.round ((bounds.left - this.maxExtent.left) / (res * 256));
    var y = Math.round ((this.maxExtent.top - bounds.top) / (res * 256));
    var z = map.getZoom();
    
    console.log(map.layers[0].getXYZ(bounds));
    console.log(x,y,z);

    var path = z + "/" + x + "/" + y + "." + this.type; 
    var url = this.url;
    if (url instanceof Array) {
        url = this.selectUrl(path, url);
    }
    return url + path;
}
*/

function init(){
    console.log("init()");
            OpenLayers.Util.onImageLoadErrorColor = "transparent";
    /*
	//~ var layerswitcher= new OpenLayers.Control.LayerSwitcher({roundedCornerColor: "#575757"});
    map= new OpenLayers.Map('map', { 
		//~ maxExtent: new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
		controls: [
			//~ layerswitcher, 
			//new OpenLayers.Control.Permalink('permalink'),  //doesn't work
			//new OpenLayers.Control.PanZoomBar(),
			//~ new OpenLayers.Control.PanPanel(),
			new OpenLayers.Control.ZoomPanel(),
			new OpenLayers.Control.Navigation(),
			//new OpenLayers.Control.EditingToolbar(),
			//new OpenLayers.Control.Graticule()
		] } );
	selectFeature= new OpenLayers.Control.SelectFeature();
	map.addControl(selectFeature);
    */
    
    //~ var b= new OpenLayers.Bounds(910484.34146126, 7011144.8835821, 922443.39435552, 7004520.7648463);
    //~ b.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:3857"));
    //~ var bounds= new OpenLayers.Bounds();
    //~ bounds.extend(54.547, 1.670);
    //~ bounds.extend(44.965, 18.809);
    //~ bounds.transform(new OpenLayers.Projection("EPSG:3857"));
    //~ console.log(bounds);

    map= new OpenLayers.Map('map', {
        maxResolution: 156543.033928 ,
        //~ maxResolution: 5000,
        //~ restrictedExtent: bounds,
        maxExtent: new OpenLayers.Bounds(-20037508.3428, -20037508.3428, 20037508.3428, 20037508.3428),
        restrictedExtent: new OpenLayers.Bounds(200000, 5500000, 2100000, 7500000),
        //~ restrictedExtent: new OpenLayers.Bounds(1000000, 1000000, 20000000, 20000000),
        //~ projection: new OpenLayers.Projection("EPSG:4326")
        projection: new OpenLayers.Projection("EPSG:3857"),
        numZoomLevels: 20,
        zoom: 10,
        //~ controls: [
            //~ new OpenLayers.Control.ZoomBar(),
        //~ ]
        //~ controls: [
			//~ new OpenLayers.Control.ZoomPanel(),
			//~ new OpenLayers.Control.Navigation()
        //~ ]
    });
	selectFeature= new OpenLayers.Control.SelectFeature();
	map.addControl(selectFeature);
    
    map.isValidZoomLevel= function(zoomLevel) {
       return ( (zoomLevel != null) &&
          (zoomLevel >= 9) &&
          (zoomLevel <= 20) );
    }
    
    document.getElementById("OpenLayers.Control.Zoom_5").style.top= "247px"; //'161px'; 
    document.getElementById("OpenLayers.Control.Zoom_5").style.left= '17px'; 
	
	//map.events.register('zoomend', null, searchtextChanged);
	
/*
	baselayer= new OpenLayers.Layer.WMS(
		"OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0",
		{layers: 'basic'}
	);

	baselayer= new OpenLayers.Layer.OSM("Landscape",
							 ["http://a.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png",
							 "http://b.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png",
							 "http://c.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png"
							 ],
							 { displayOutsideMaxExtent: true,
							 attribution: landscapeattrib, transitionEffect: 'resize'});
*/

	//~ var landscapeattrib = '<b>Gravitystorm Landscape Map</b> '
				//~ + '<a href="http://www.thunderforest.com">Developer Information</a>';
	//~ var landscape = new OpenLayers.Layer.OSM("Landscape",
										 //~ [
                                         //~ "http://a.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png",
										 //~ "http://b.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png",
										 //~ "http://c.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png"
										 //~ //"http://localhost/MSWissenschaft/tiles/${z}/${x}/${y}.png"
                                         //~ ],
										 //~ { displayOutsideMaxExtent: true,
										 //~ attribution: landscapeattrib, transitionEffect: 'resize'});
	//~ map.addLayer(landscape);
    
    //~ var layer = new OpenLayers.Layer.XYZ(
        //~ "tiles", // name for display in LayerSwitcher
        //~ "http://localhost/MSWissenschaft/tiles/", // service endpoint
        //~ {layername: "tiles", type: "png" /*, "getURL": get_my_url*/ } // required properties
    //~ );
    //~ map.addLayer(layer);
    //~ var layer = new OpenLayers.Layer.OSM(
        //~ "My Layer", // name for display in LayerSwitcher
        //~ [ "http://localhost/MSWissenschaft/tiles/${z}/${x}/${y}.png" ]
    //~ );
    //~ map.addLayer(layer);
    
        var layer = new OpenLayers.Layer.WMS( "WMS osm",
            //~ "http://localhost:8080/service?",
            "//" + window.location.hostname + ":8080/service?",
            {layers: "osm", format: "image/png", srs:"EPSG:3857",
             exceptions: "application/vnd.ogc.se_inimage"},
            {/*singleTile: true, */ratio: 1, isBaseLayer: true, transitionEffect: 'resize'} );

        map.addLayer(layer);
	
	//~ var osm= new OpenLayers.Layer.OSM()

	//~ map.addLayer(osm);

	//~ var cycleattrib = '<b>Base layer: OpenCycleMap.org - the <a href="http://www.openstreetmap.org">OpenStreetMap</a> Cycle Map</b><br />';
	//~ var transportattrib = '<b>Gravitystorm Transport Map</b> '
			//~ + '<a href="http://www.thunderforest.com">Developer Information</a>';
	//~ var cycle = new OpenLayers.Layer.OSM("OpenCycleMap",
										//~ ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
										 //~ "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
										 //~ "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"],
										//~ { displayOutsideMaxExtent: true,
										  //~ attribution: cycleattrib, transitionEffect: 'resize'});
	//~ map.addLayer(cycle);

	//~ var transport = new OpenLayers.Layer.OSM("Transport",
										 //~ ["http://a.tile2.opencyclemap.org/transport/${z}/${x}/${y}.png",
										 //~ "http://b.tile2.opencyclemap.org/transport/${z}/${x}/${y}.png",
										 //~ "http://c.tile2.opencyclemap.org/transport/${z}/${x}/${y}.png"],
										 //~ { displayOutsideMaxExtent: true,
										 //~ attribution: transportattrib, transitionEffect: 'resize'});
	//~ map.addLayer(transport);


/*
	var wms= new OpenLayers.Layer.WMS(
		"OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0?",
		{ displayOutsideMaxExtent: true, layers: 'basic' });
	map.addLayer(wms);
*/

    var layerConfig= getConfig('POILayers', '');
	for(var i= 0; i<layerConfig.length; i++) {
        var layer= createPOILayer(layerConfig[i].title);
        layer.setVisibility(layerConfig[i].visible);
        POILayers.push(layer);
    }
    
	selectControl = new OpenLayers.Control.SelectFeature(POILayers);
	map.addControl(selectControl);
	selectControl.activate();

    applyConfig(config);
    updateSpeedDisplay();

    var args= parseHashBangArgs();
    if(args.wpembed !== undefined) 
    {
        focusFeature= unescape(args.focus).replace('_', ' ');
        var req= new XMLHttpRequest();
        var str= baseUrl + "?getfocustimeforobject=" + args.focus + "&range=verified";
        console.log(str);
        req.open("GET", str, false);
        req.send();
        response= JSON.parse(req.responseText);
        setPOILayerTime(response.focustime);
        map.zoomTo(0);
    }
    else {
        //~ setPOILayerTime(timelineInitial);
        //~ map.zoomToMaxExtent();
        zoomToCurrentPier();
    }
}

function getConfig(name, defaultValue) {
    if(config.hasOwnProperty(name)) return config[name];
    return defaultValue;
}

function applyConfig(config) {
    for(var cfgval in config) {
        if(cfgval == 'dom') {
            domcfg= config[cfgval];
            for(var name in domcfg) {
                var elem= document.getElementById(name);
                for(var v in domcfg[name]) {
                    elem[v]= domcfg[name][v];
                }
            }
        }
        else if(cfgval == 'doctitle') {
            document.title= config[cfgval];
        }
        else {
            //~ window.alert('unknown config value "' + cfgval + '"');
        }
    }
}
 

// Needed only for interaction, not for the display.
function onPopupClose(evt) {
	// 'this' is the popup.
	var feature = this.feature;
	if (feature.layer) { // The feature is not destroyed
		selectControl.unselect(feature);
	} else { // After "moveend" or "refresh" events on POIs layer all 
			 //     features have been destroyed by the Strategy.BBOX
		this.destroy();
	}
}
function onFeatureSelect(evt) {
	feature = evt.feature;
	popup = new OpenLayers.Popup.FramedCloud("featurePopup",
							 feature.geometry.getBounds().getCenterLonLat(),
							 new OpenLayers.Size(100,100),
							 "<h2>"+feature.attributes.title + "</h2>" +
							 feature.attributes.description,
							 null, true, onPopupClose);
	feature.popup = popup;
	popup.feature = feature;
	map.addPopup(popup, true);
}
function onFeatureUnselect(evt) {
	feature = evt.feature;
	if (feature.popup) {
		popup.feature = null;
		map.removePopup(feature.popup);
		feature.popup.destroy();
		feature.popup = null;
	}
}

function writeTimeSelectors(from, to, step) {
	document.write('<span id="timesel">\n');
	for(var i= from; i<=to; i+= step) {
		document.write('<a href="#" onClick="javaScript: setPOILayerTime(' + i + ')" title=' + i + ' alt=' + i + '>' + 
			(i%100? '-': '|') + ' </a>\n');
	}
	document.write('</span>');
}

var timerCurrTime= getConfig('timelineMin', -50), timerMinTime= getConfig('timelineMin', -50), timerMaxTime= getConfig('timelineMax', 565), 
    timerStep= getConfig('animationDefaultStep', 3), timerInterval= 1000, timerID= null;

function timeJump(relTime) {
	timerCurrTime+= relTime;
	if(timerCurrTime>timerMaxTime) timerCurrTime= timerMinTime;
	if(timerCurrTime<timerMinTime) timerCurrTime= timerMaxTime;
	timelineSetTime(timerCurrTime);
	setPOILayerTime(timerCurrTime);
}

function timerFunc() {
	timeJump(timerStep);
}

function timerStop() {
	var btn= document.getElementById('animbutton-play');
	if(btn) btn.src= '../img/animbutton-play.png';
	if(timerID) {
		window.clearInterval(timerID);
		timerID= null;
		return;
	}
}

function timerStartStop() {
	if(timerID) { timerStop(); return false; }
	else { timerStart(timerFunc, timerInterval); return true; }
}

function updateSpeedDisplay() {
	var dnum= document.getElementById('speeddisplaynum');
	if(dnum) dnum.innerHTML= '' + timerStep * timerInterval/1000;
}

function timerStart(step, interval) {
	if(timerID) timerStop();
	timerInterval= interval;
	timerStep= step;
	timerID= window.setInterval(timerFunc, timerInterval);
	var btn= document.getElementById('animbutton-play');
	if(btn) btn.src= '../img/animbutton-play-on.png';
	updateSpeedDisplay();
}

function timerStartForward() {
	timerStart(Math.abs(timerStep), timerInterval);
}

function timerStartReverse() {
	timerStart(-Math.abs(timerStep), timerInterval);
}

function timerChangeSpeed(relSpeed) {
	timerStep+= relSpeed;
	if(timerID) timerStart(timerStep, timerInterval);
	else updateSpeedDisplay();
}

function zoomToFeature(title, recenter, zoom) {
	console.log("zoomToFeature('%s')", title);
    var feature= null;
    var features= findStringInPOItitles(title);
    if(features.length!=0) feature= features[0];
    else {
        for(var i= 0; i<POILayers.length && feature==null; i++) {
            feature= POILayers[i].getFeatureById(title);
        }
    }
    if(feature==null) return;
	console.log("feature found: " + feature);
	selectFeature.select(feature);
    if(recenter) {
        center= feature.geometry.getBounds().centerLonLat;
        if(zoom)
            //~ map.zoomTo(zoom);
            //~ map.adjustZoom(zoom);
            map.setCenter(null, zoom, null, null);
        map.panTo(center);
    }
}

function searchtextChanged() {
	searchbox= document.getElementById('searchbox');
	searchresults= document.getElementById("searchresults");
	searchresults.innerHTML= '';
	if (searchbox.value.length < 2) return;
	var srch= findStringInPOItitles(searchbox.value);
	for(var i= 0; i<srch.length && i<5; i++)
	{
		searchresults.innerHTML+= 
			'<div class="handcursor" onClick="javascript:zoomToFeature(\'' + String(srch[i].id) + '\')">' +
			'<img src="' + srch[i].style['externalGraphic'] + '"> ' + 
			srch[i].attributes['title'].replace('a href', 'span foo').replace('/a', '/span') + 	// HACK :)
			'</div>';
	}
}

function setMapHeight(h){
	document.getElementById('map').style.height= h;
	map.updateSize();
}

function makeRotatedStuff(angle, stuff) {
	return '<div style="float:left;' + 
			'-ms-transform:rotate(' + angle + 'deg);' + 
			'-moz-transform:rotate(' + angle + 'deg);' +
			'-webkit-transform:rotate(' + angle + 'deg);' +
			'-o-transform:rotate(' + angle + 'deg);">' + stuff + 
			'</div>';
}

function insertRotatedStuff(angle, stuff) {
	document.write(makeRotatedStuff(angle, stuff));
}

function mapHeightMod(n) {
	var map= document.getElementById('map');
	var rc= map.getBoundingClientRect();
	var height= rc.bottom-rc.top;
	height+= n;
	height= Math.min(Math.max(height, 200), 800);
	setMapHeight(height + 'px');
	console.log("mapHeightMod(%d) -> %d\n", n, height);
}

function closeDlg() {
	var frame= document.getElementById('dlgframe');
	var bg= document.getElementById('dlgbackground');
	frame.style.visibility= 'hidden';
	bg.style.visibility= 'hidden';
}

function showDlg(contentHTML) {
	var frame= document.getElementById('dlgframe');
	var bg= document.getElementById('dlgbackground');
	frame.innerHTML= contentHTML;
    //~ frame= frame.childNodes[0];
	var bgrc= document.body.getBoundingClientRect();
	var framerc= frame.childNodes[0].getBoundingClientRect();
    //~ console.log(bgrc.left, bgrc.top, bgrc.right, bgrc.bottom);
    //~ console.log(framerc.left, framerc.top, framerc.right, framerc.bottom);
	frame.childNodes[0].style.left= (((bgrc.right - bgrc.left) - (framerc.right - framerc.left)) / 2) + "px";
	//~ frame.style.top= (((bgrc.bottom - bgrc.top) - (framerc.bottom - framerc.top))  / 2) + "px";
    frame.style.top= "50px";
    frame.style.height= (bgrc.bottom - bgrc.top) - 100 + "px";
	frame.style.visibility= 'visible';
	frame.onclick= closeDlg;
	bg.onclick= closeDlg;
	bg.style.visibility= 'visible';
}

function showOSMDlg() {
	showDisabledIframefoo(
		'<div style="position: absolute; width: 60%; height: 100%; text-align: center;">' +
		'<div style="position: absolute; inner-width: 100%; inner-height: 100%; background-color: #fff; text-align: center; font-size: 11pt; margin-top:25%; margin-bottom:25%; padding:10px">' +
        '<p style="padding-top:20px;">Das in dieser Anwendung verwendete Kartenmaterial steht unter der Open Data Commons Open Database License (ODbL) zur Verf&uuml;gung.</p>' +
        '<p>Die Kartographie in den von der Karte genutzten Bildern (Tiles) sowie die OpenStreetMap-Dokumentation sind lizensiert unter der Creative Commons Attribution-ShareAlike 2.0-Lizenz (CC BY-SA). </p>' +
        '<p>F&uuml;r weitere Informationen besuchen Sie bitte http://www.openstreetmap.org/copyright</p>' +
        '<p></p>' +
        '<p>Diese Anwendung verwendet OpenLayers, http://openlayers.org/</p>' +
        '<p><img src="img/qr-openlayers.png" width=100 height=100 style="padding:20px;"><img src="img/qr-osm-copyright.png" width=100 height=100 style="padding:20px;"></p>' +
        '</div>' +
        '</div>'
		);
    document.getElementById("dlgfoo").onclick= closeDlg;
}

function showAboutDlg() {
	showDlg(
		'<div style="width: \"80%\"; height: 280px; text-align: center; padding: 3px">' +
		'<div class="aboutdlgheader">Interaktive Karte R&ouml;mischer Befestigungsanlagen</div>' +
		'<div style="text-align: left; padding-left: 50px; padding-right: 50px; padding-top: 10px; padding-bottom: 20px">' +
		'<br>' +
		'Kartenmaterial: <a href="http://www.openstreetmap.org">OpenStreetMap/Open Cycle Map</a>, ' +
		'<a href="http://www.thunderforest.com">Gravitystorm Transport/Landscape Maps</a>' +
		'</div>' +
		'<div style="">' + 
		//'<div class="aboutdlgheader2">Projektpartner</div>' +
		'<a href="http://www.dainst.org/"><img src="../img/DAI_Logo-100.png" class="aboutlogo" style="position: relative; top: -3px; left: 2px; height: 100px;"/></a>' +
		'<a href="http://www.wikidata.org/"><img src="../img/Wikidata-logo-en-100.png" class="aboutlogo" style="position: relative; top: -5px; height: 100px;"/></a>' +
		'<a href="http://wikimedia.de/"><img src="../img/Wikimedia_Deutschland-Logo-110.png" class="aboutlogo" style="position: relative; left: -5px; height: 110px;"/></a>' + 
		'<a href="http://de.wikipedia.org/wiki/Wikipedia:Projekt_R%C3%B6mischer_Limes"><img src="../img/Wikipedia-Limesprojekt-Logo-schrift-120.png" class="aboutlogo" style="position: relative; left: 2px; height: 120px;"/></a>' +
		'<a href="http://render-project.eu/"><img src="../img/logo-render-100.png" class="aboutlogo" style="position: relative; top: -2px; height: 100px;"/></a>' +
		'</div>' +
		'</div>'
		);
}

function showHideMapkey() {
    var key= document.getElementById("mapkey");
    if(key.className=="mapkey-slideout") { key.className= "mapkey-slidein"; }
    else { key.className= "mapkey-slideout"; }
}