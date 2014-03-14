

function openPOI(page_title) {
	showDlg(
		'<div style="position: absolute; width: 75%; height: 100%; background-color: #ccc;">' +
        //~ '<div style="position: absolute; width: 75%; height: 100%; z-index: 10002; " />' +
        '<iframe style="width: 100%; height: 100%;" src="../pages/data/de.wikipedia.org/wiki/' + page_title + '.html"/>' +
        '</div>'
		);
}