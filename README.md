# MSWissenschaft

A contribution from Wikimedia Germany to the traveling science exhibition on board the riverboat MS Wissenschaft, as per https://en.wikipedia.org/wiki/Wikipedia:GLAM/Ship .

The basic idea is to display the route of the boat on a clickable and zoomable map that will display information about a selection of geolocated articles on the German Wikipedia. The map is complemented by a clickable timeline that will predefine the settings of the map as a function of the position of the boat over time.

## Software Description

The software allows its users to follow the “MS Wissenschaft” ship on its route through Germany on a multidimensional map.

The software consists of the following elements:
* A timeline. It contains the ship’s landing piers associated with the dates when the ship is actually at a particular pier. The user can scroll the timeline and select specific piers.
* A map. It shows points of interest (POIs) nearby a selected pier. Basically these POIs are Wikipedia articles that have geo coordinates attached and are in a specific Wikipedia category (culture, politics, economics, science). The map has several zoom levels at which different POIs are shown according to the number of views of the articles. E.g. POIs with fewer views are only shown in a higher zoom level.
* Details for POIs. When clicking on a POI a preview of the related Wikipedia article is shown along with a QRpedia code. A click on the article preview will show the full Wikipedia article for this POI while the QRpedia code can be scanned with a mobile device to browse to the mobile version of the article.
* A reset button. A click on the home button will reset the timeline and the map to the current date and the current location of the ship.
* A touch-optimized user interface. The software is optimized for large touchscreens and provides touch-optimized elements to scroll the timeline and to zoom within the map.


## Resources
* The design builds on the Limes map, available at http://tools.wmflabs.org/render-tests/limes/web/ .
* Image sources: SymbolFerry.svg http://commons.wikimedia.org/wiki/File:SymbolFerry.svg
