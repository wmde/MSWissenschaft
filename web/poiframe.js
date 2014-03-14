

function openPOI(page_title) {
	showDlg(
		'<div style="width: 75%; height: 100%; margin-left: auto; margin-right: auto; background-color: #ccc;">' +
        '<iframe style="width: 100%; height: 100%;" src="../pages/data/de.wikipedia.org/wiki/' + page_title + '.html"/>' +
        '</div>'
		);
}