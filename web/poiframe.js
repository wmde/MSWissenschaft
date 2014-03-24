function showDisabledIframefoo(contentHTML) {
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
        
    var dlgfoo= document.getElementById("dlgfoo");
    dlgfoo.style.position= frame.childNodes[0].style.position;
    dlgfoo.style.left= frame.childNodes[0].style.left;
    dlgfoo.style.width= (framerc.right-framerc.left) - 48 + "px";
    dlgfoo.style.top= frame.childNodes[0].style.top;
    dlgfoo.style.height= frame.childNodes[0].style.height;
    dlgfoo.style.zIndex= 20000;
    

    //~ var idx= 0;
    //~ if(window.frames && window.frames[ idx ] && window.frames[ idx ].document.links)
    //~ {
        //~ var ifl=window.frames[ idx ].document.links;
        //~ for(var i=0; i<ifl.length; i++)
        //~ ifl[i].onclick=function () { return false; }
    //~ }

}



function openPOI(page_title) {
	showDisabledIframefoo(
		'<div style="position: absolute; width: 75%; height: 100%; background-color: #ccc;">' +
        //~ '<div style="position: absolute; width: 75%; height: 100%; z-index: 10002; " />' +
        '<iframe style="width: 100%; height: 100%;" src="../pages/data/de.wikipedia.org/wiki/' + page_title + '.html"/>' +
        '</div>'
		);
}