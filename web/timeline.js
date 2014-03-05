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

var barY= 60;
var eventXScale= getConfig('timelineScaling', 2);
var minYear= getConfig('timelineMinYear', -50);
var maxYear= getConfig('timelineMaxYear', 565);
var timelineInitialYear= getConfig('timelineInitialYear', 125);

var dragBegin= 0;
var dragBeginYear= 0;
var dragging= false;

function timelineSetYear(selectedYear) {
	var outer= document.getElementById('timeline-outer'); 
	var outerClientRect= outer.getBoundingClientRect();
	document.getElementById('timeline-inner').style.left= ((outerClientRect.right-outerClientRect.left)*.5 - selectedYear*eventXScale) + "px";
	document.getElementById('year-display').innerHTML= '' + Math.round(selectedYear);
}

function returnfalse() {
	return false;
}

function timelineClick(evt) {
	if(!evt) var evt= window.event;
	var inner= document.getElementById('timeline-inner'); 
	var innerClientRect= inner.getBoundingClientRect();
	var selectedYear= Math.round((evt.clientX-innerClientRect.left)/eventXScale);
	var y= evt.clientY-innerClientRect.top;
	if(y>=barY-10 && y<=barY+20)
	{
		timelineSetYear(selectedYear);
		setPOILayerYear(selectedYear);
	}
	return false;
}

var moveTimeoutHandle;
function moveTimeout(year) {
	timelineSetYear(year);
	setPOILayerYear(year);
	moveTimeoutHandle= false;
}
function timelineSetMoveTimeout(year) {
	if(moveTimeoutHandle) clearInterval(moveTimeoutHandle);
	moveTimeoutHandle= setTimeout(function() { moveTimeout(year) }, 250);
}

function timelineMousedown(evt) {
	if(!evt) var evt= window.event;
	var outer= document.getElementById('timeline-outer'); 
	var outerClientRect= outer.getBoundingClientRect();
	dragBegin= (evt.clientX-outerClientRect.left);
	var selectedYear= Math.round(((evt.clientX-outerClientRect.left))/eventXScale);
	var y= evt.clientY-outerClientRect.top;
	if(y>=barY-10 && y<=barY+20)
	{
		//timelineSetYear(selectedYear);
		dragging= true;
		dragBeginYear= timerCurrYear;
		//if(outer.setCapture) outer.setCapture();
	}
	return false;
}


function timelineMousemove(evt) {
	if(!dragging) return false;
	if(!evt) var evt= window.event;
    if(timerID) timerStop();
	var outer= document.getElementById('timeline-outer'); 
	var outerClientRect= outer.getBoundingClientRect();
	var selectedYear= Math.round((dragBegin-(evt.clientX-outerClientRect.left))/eventXScale) + dragBeginYear;
	selectedYear= Math.min( Math.max(selectedYear, minYear), maxYear );
	timelineSetYear(selectedYear);
	//setPOILayerYear(selectedYear);
	timelineSetMoveTimeout(selectedYear);
	return false;
}

function timelineMouseup(evt) {
	var outer= document.getElementById('timeline-outer'); 
	//if(outer.releaseCapture) outer.releaseCapture();
	if(!dragging) return false;
	if(!evt) var evt= window.event;
	dragging= false;
	var outerClientRect= outer.getBoundingClientRect();
	var selectedYear= Math.round((dragBegin-(evt.clientX-outerClientRect.left))/eventXScale) + dragBeginYear;
	selectedYear= Math.min( Math.max(selectedYear, minYear), maxYear );
	timelineSetYear(selectedYear);
	setPOILayerYear(selectedYear);
	return false;
}
/*
function timelineMouseout(evt) {
	dragging= false;
	timelineSetYear(timerCurrYear);
}
*/

function createRotationCSS(angle, origin) {
	origin+= ';';
	var css= 'transform: rotate(' + angle + 'deg); ' + 
			'transform-origin: ' + origin +
			'-ms-transform: rotate(' + angle + 'deg); ' + 
			'-ms-transform-origin: ' + origin +
			'-moz-transform: rotate(' + angle + 'deg); ' +
			'-moz-transform-origin: ' + origin +
			'-webkit-transform: rotate(' + angle + 'deg); ' +
			'-webkit-transform-origin: ' + origin +
			'-o-transform: rotate(' + angle + 'deg); '+
			'-o-transform-origin: ' + origin;
	return css;
}

function createLabelText(text, xpos_int, angle, origin) {
	var xpos= xpos_int + "px";
	var label= document.createElement('div');
	label.style.cssText= 'float: left; ' + 
			'position: absolute; ' +
			'left: ' + xpos + '; ' +
			createRotationCSS(angle, origin);
	label.innerHTML= text;
	return label;
}

function createEventLabelText(elem, text, xpos) {
	var label= createLabelText(text, xpos, -12.25, "-50px 0px");
	var rect= elem.getBoundingClientRect();
	var height= rect.bottom-rect.top;
	var bottomDist= height - barY;
	label.style.cssText+= 
			'font-size: 11px; ' +
			'text-decoration: underline; ' +
			'white-space: nowrap; ' +
			'text-align: left; ' +
			'bottom: ' + bottomDist + 'px; ';
	return label;
}

function createLabelIndicator(xpos) {
	var indicator= document.createElement('div');
	indicator.style.cssText= 'float: left; ' + 
			'position: absolute; ' +
			'left: ' + xpos + 'px; ' +
			'top: ' + (barY-10) + 'px; ' +
			'width: 2px; ' +
			'height: 10px; ' +
			'background-color: #888; ';
	return indicator;
}

function createCenturyIndicator(xpos) {
	var indicator= document.createElement('div');
	indicator.style.cssText= 'float: left; ' + 
			'position: absolute; ' +
			'left: ' + xpos + 'px; ' +
			'top: ' + barY + 'px; ' +
			'width: 2px; ' +
			'height: 10px; ' +
			'background-color: #000; ';
	return indicator;
}

function createLabel(elem, text, xpos) {
	elem.appendChild(createEventLabelText(elem, text, xpos*eventXScale));
	elem.appendChild(createLabelIndicator(xpos*eventXScale));
}

function timelineOnresize() {
	timelineSetYear(timerCurrYear);
}

function createCenturyMarker(elem, xpos) {
	elem.appendChild(createCenturyIndicator(xpos*eventXScale));
	var label= createLabelText(xpos+'', xpos*eventXScale-50, 0, "0px 0px");
	label.style.cssText+= 
		'width: 100px; ' +
		'text-align: center; ' +
		'font-size: 10.5px; ' +
		'top: ' + (barY+8) + 'px; ';
	elem.appendChild(label);
}

function createTimeline() {
	var events= getConfig('timelineEvents', [ 	
		[ "Beginn Fr&uuml;hkaiserzeit", -30 ], 
		[ "Beginn Hohe Kaiserzeit ", 69 ],
		[ "Beginn Sp&auml;tkaiserzeit", 180 ],
		[ "Beginn Sp&auml;tantike", 284 ],
	]);
    var timelineMarkerBegin= getConfig('timelineMarkerBegin', -100);
    var timelineMarkerEnd= getConfig('timelineMarkerEnd', 600);
    var timelineMarkerStep= getConfig('timelineMarkerStep', 100);
	
	inner= document.getElementById('timeline-inner');
	outer= document.getElementById('timeline-outer');
	
	var grabr= document.createElement('div');
	grabr.style.cssText= 'position: absolute; ' + 
		'top: ' + (barY-6) + 'px; ' +
		'width: 100%; ' +
		'height: 28px; ' +
		'background-color: #ddf; ';
	outer.appendChild(grabr);

	// and another one, transparent but with cursor:move and higher z-index...
	grabr= document.createElement('div');
	grabr.style.cssText= 'position: absolute; ' + 
		'top: ' + (barY-6) + 'px; ' +
		'width: 100%; ' +
		'height: 28px; ' +
		'cursor: move; ' +
		'z-index: 10; ' +
		'background-color: transparent; ';
	outer.appendChild(grabr);

	var len= events.length;
	for(var i= 0; i<len; i++)
		createLabel(inner, events[i][0], events[i][1]);
	
	var bar= document.createElement('div');
	bar.style.cssText= 'position: absolute; ' +
			'left: 0px; ' + 
			'top: ' + barY + 'px; ' +
			'width: 100%; ' +
			'height: 2px; ' +
			'background-color: #000000; ';
	inner.appendChild(bar);
	outer.appendChild(bar);
	
	for(var i= timelineMarkerBegin; i<=timelineMarkerEnd; i+= timelineMarkerStep)
		createCenturyMarker(inner, i);
	
	/*
	var img= document.createElement('img');
	img.src= 'gradient-w.png';
	img.style.cssText= 'position: absolute; ' +
		'right: 0px; ' + 
		'top: 0px; ' + 
		'width: 128px; ' +
		'z-index: 2; ' +
		'height: 500px;';
	outer.appendChild(img);
	
	var img2= document.createElement('img');
	img2.src= 'gradient-w.png';
	img2.style.cssText= 'position: absolute; ' +
		'left: 64px; ' + 
		'top: 0px; ' + 
		'width: 128px; ' +
		'z-index: 2; ' +
		'height: 500px; ' +
		createRotationCSS(180, '32px 128px');
	outer.appendChild(img2);
	*/
	
	//outer.onclick= timelineClick;
	grabr.onmousedown= timelineMousedown;
	grabr.onmousemove= timelineMousemove;
	grabr.onmouseup= timelineMouseup;
	//outer.onmouseout= timelineMouseout;
	grabr.ondoubleclick= returnfalse;
	
	// prevent browser from creating stupid selection 
	// might be better to somehow chain events to the map
	//~ outer.onmousemove= returnfalse;
	outer.onmousedown= returnfalse;
	//~ outer.onmouseup= returnfalse;
	
	
	var body= document.getElementsByTagName('body')[0];
	body.onresize= timelineOnresize;
	body.onmousemove= timelineMousemove;
	body.onmouseup= timelineMouseup;
	
	timelineSetYear(timelineInitialYear);
}
