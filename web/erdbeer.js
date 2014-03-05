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
    searchtextChanged();
}

function createPOILayer(title) {
	var layer= new OpenLayers.Layer.Vector(title, {
		strategies: [ 
			new OpenLayers.Strategy.BBOX({resFactor: 1.1})
			],
		protocol: new OpenLayers.Protocol.HTTP({
			url: baseUrl,
			format: new OpenLayers.Format.Text()
		})
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

function setPOILayerYear(year) {
    var layerConfig= getConfig('POILayers', '');
    for(var i= 0; i<POILayers.length; i++) {
        POILayers[i].protocol= new OpenLayers.Protocol.HTTP({
                url: baseUrl + '?ranges=' + layerConfig[i].ranges + '&year=' + year,
                format: new OpenLayers.Format.Text()
            });
        POILayers[i].refresh({force:true});
        POILayers[i].redraw();
    }
	
	if(document.getElementById("year-display")) document.getElementById("year-display").innerHTML= year; 
	timerCurrYear= year;
}

function init(){
	var layerswitcher= new OpenLayers.Control.LayerSwitcher({roundedCornerColor: "#575757"});
	map= new OpenLayers.Map('map', { 
		maxExtent: new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
		controls: [
			layerswitcher, 
			//new OpenLayers.Control.Permalink('permalink'),  //doesn't work
			//new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.PanPanel(),
			new OpenLayers.Control.ZoomPanel(),
			new OpenLayers.Control.Navigation(),
			//new OpenLayers.Control.EditingToolbar(),
			//new OpenLayers.Control.Graticule()
		] } );
	selectFeature= new OpenLayers.Control.SelectFeature();
	map.addControl(selectFeature);
	
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

	var landscape = new OpenLayers.Layer.OSM("Landscape",
										 ["http://a.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png",
										 "http://b.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png",
										 "http://c.tile3.opencyclemap.org/landscape/${z}/${x}/${y}.png"],
										 { displayOutsideMaxExtent: true,
										 attribution: landscapeattrib, transitionEffect: 'resize'});
	map.addLayer(landscape);
	
	var osm= new OpenLayers.Layer.OSM()

	map.addLayer(osm);

	var cycleattrib = '<b>Base layer: OpenCycleMap.org - the <a href="http://www.openstreetmap.org">OpenStreetMap</a> Cycle Map</b><br />';
	var transportattrib = '<b>Gravitystorm Transport Map</b> '
			+ '<a href="http://www.thunderforest.com">Developer Information</a>';
	var landscapeattrib = '<b>Gravitystorm Landscape Map</b> '
				+ '<a href="http://www.thunderforest.com">Developer Information</a>';
	var cycle = new OpenLayers.Layer.OSM("OpenCycleMap",
										["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
										 "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
										 "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"],
										{ displayOutsideMaxExtent: true,
										  attribution: cycleattrib, transitionEffect: 'resize'});
	map.addLayer(cycle);

	var transport = new OpenLayers.Layer.OSM("Transport",
										 ["http://a.tile2.opencyclemap.org/transport/${z}/${x}/${y}.png",
										 "http://b.tile2.opencyclemap.org/transport/${z}/${x}/${y}.png",
										 "http://c.tile2.opencyclemap.org/transport/${z}/${x}/${y}.png"],
										 { displayOutsideMaxExtent: true,
										 attribution: transportattrib, transitionEffect: 'resize'});
	map.addLayer(transport);

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
    
	// Interaction stuff
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
        var str= baseUrl + "?getfocusyearforobject=" + args.focus + "&range=verified";
        console.log(str);
        req.open("GET", str, false);
        req.send();
        response= JSON.parse(req.responseText);
        setPOILayerYear(response.focusyear);
        map.zoomTo(0);
    }
    else {
        setPOILayerYear(timelineInitialYear);
        map.zoomToMaxExtent();
    }
}

function getConfig(name, defaultValue) {
    if(config[name]) return config[name];
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

function writeYearSelectors(from, to, step) {
	document.write('<span id="yearsel">\n');
	for(var i= from; i<=to; i+= step) {
		document.write('<a href="#" onClick="javaScript: setPOILayerYear(' + i + ')" title=' + i + ' alt=' + i + '>' + 
			(i%100? '-': '|') + ' </a>\n');
	}
	document.write('</span>');
}

var timerCurrYear= getConfig('timelineMinYear', -50), timerMinYear= getConfig('timelineMinYear', -50), timerMaxYear= getConfig('timelineMaxYear', 565), 
    timerStep= getConfig('animationDefaultStep', 3), timerInterval= 1000, timerID= null;

function timeJump(relYear) {
	timerCurrYear+= relYear;
	if(timerCurrYear>timerMaxYear) timerCurrYear= timerMinYear;
	if(timerCurrYear<timerMinYear) timerCurrYear= timerMaxYear;
	timelineSetYear(timerCurrYear);
	setPOILayerYear(timerCurrYear);
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
	var bgrc= document.body.getBoundingClientRect();
	var framerc= frame.getBoundingClientRect();
	frame.style.left= (((bgrc.right - bgrc.left) - (framerc.right - framerc.left)) / 2) + "px";
	frame.style.top= (((bgrc.bottom - bgrc.top) - (framerc.bottom - framerc.top))  / 2) + "px";
	frame.style.visibility= 'visible';
	frame.onclick= closeDlg;
	bg.onclick= closeDlg;
	bg.style.visibility= 'visible';
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
