#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
import MySQLdb, MySQLdb.cursors
import json
import flask
from flask import Flask
from flup.server.fcgi import WSGIServer

app = Flask(__name__)

# todo merge stuff
SQL_DEFAULTS_FILE= '/home/exhibit/.my.cnf'
SQL_DB= 'mswissenschaft_map'
SQL_POITABLE= 'poi'
SQL_CATEGORYTABLE= 'category'
SQL_PIERTABLE= 'pier'


def getCursor():
    # 'flask.g' is totally useless here since the application context in flask is essentially the same as the request context: it's destroyed after each request
    # maybe use PySQLPool instead or something
    if flask.g.get('conn', None)==None:
        app.logger.debug('creating new db connection')
        conn= MySQLdb.connect( read_default_file=os.path.expanduser(SQL_DEFAULTS_FILE), use_unicode=False, cursorclass=MySQLdb.cursors.DictCursor )
        cursor= conn.cursor()
        cursor.execute("USE %s" % SQL_DB)
        flask.g.conn= conn
        flask.g.cursor= cursor
    else:
        app.logger.debug('reusing db connection')
        cursor= flask.g.cursor
    return cursor

# maybe will use PySQLPool or something later, so all code doing SQL stuff should use this function
def sqlExecute(cmd, args= None):
    cursor= getCursor()
    cursor.execute(cmd, args)
    #~ print("sqlExecute %s %s" % (cmd, args))
    return cursor.fetchall()

@app.route('/')
def site_map():
    links = []
    rules= sorted(app.url_map.iter_rules())
    for rule in rules:
        if "GET" in rule.methods:
            links.append(flask.escape(repr(rule)))
    return '<br>'.join(links)

@app.route('/pois-for-pier/<int:pier_id>/<categories>')
def get_pois_for_pier(pier_id, categories):
    categories= categories.split(',')
    catstr= ' OR '.join( "category.category_name = %s" for cat in categories )
    args= [pier_id]
    args.extend(categories)
    rows= sqlExecute('SELECT * FROM %s ' % SQL_POITABLE + 
                     'JOIN category JOIN pier ' +
                     'WHERE poi.pier_id=%s AND (' + catstr + ') ORDER BY hitcount', args)
    return json.dumps(rows)
    
def createPOIDescription(row):
    imghtml= '''<a href="javascript:openPOI('%s')">
<img style="position:absolute; top:35px; " src="../pages/data/upload.wikimedia.org/wikipedia/commons/e/ec/Wikipedia-logo-v2-de.png">
<img style="position:absolute; top:195px; left:10px;" src="../qr/data/%s.svg" width=128 height=128/>
<br/>
<p style="position:absolute; top:310px; left:0px; font-size:6.5px; width:150px; text-align: center;">de.qrwp.org/%s</p>
</a>
''' % (row['page_title'], row['page_title'], row['page_title'].replace(' ', '_'))
    subdiv= """<div style="width:100%; height:320px; position:absolute; top:0px; left:0px; z-index: -1000; overflow: hidden; onClick=\"javaScript:openPOI('""" + row['page_title'] + """')\"">
<iframe width="1000px" height="800px" src="../pages/data/de.wikipedia.org/wiki/""" + row['page_title'] + """.html" 
style="position:absolute; top: -25px; left: 55px; overflow: hidden; -webkit-transform: scale(0.5); -webkit-transform-origin: 0 0; -moz-transform: scale(0.5); -moz-transform-origin: 0 0; ">
</iframe>
<div style="position:absolute; top:0px; left: 0px; width: 100%; height: 50px; background-color: #fff;"> </div>
<div style="position:absolute; top:0px; left: 0px; width: 150px; height: 100%; background-color: #fff;"> </div>
<div style="position:absolute; top:0px; left: 0px; width: 100%; height: 100%;"> </div>
<div style="position:absolute; bottom:0px; left: 0px; width: 100%; height: 40px; background: url('img/vertgrad.png'); background-size: 100% 100%;">&nbsp;</div>
</div>"""
    footer= """<div style="width:510px; vertical-align:bottom; text-align:center; padding-top:15px; font-size:9px; overflow:hidden;">
Wikipedia ist ein Projekt zum Aufbau einer Enzyklop&auml;die aus Freien Inhalten in &uuml;ber 280 Sprachen. Sie wird gemeinsam von Freiwilligen auf der ganzen Welt erstellt und alle k&ouml;nnen mit ihrem Wissen dazu beitragen.
</div>"""
    return '<div style="width: 500px; height: 280px;" onClick="javaScript:openPOI(\'%s\')">' % row['page_title'] + str(subdiv) + str(imghtml) + '</div>' + footer 
    
@app.route('/pois-by-date/<string:date>/<categories>')
def get_pois_by_date(date, categories):
    
    specialIconProperties= { 'Wikimedia Deutschland': 
                                { 'category': 'Wikimedia-logo', 'pointRadius': 32 },
                             'Open Knowledge Foundation': 
                                { 'category': 'OKFN-logo', 'pointRadius': 32 } }
    
    bbox= [ float(x) for x in flask.request.args.get('bbox', '-1000,-1000,1000,1000').split(',') ]
    #~ return str(bbox)
    categories= categories.split(',')
    catstr= ' OR '.join( "category.category_name = %s" for cat in categories )
    args= []    #[date, date]
    args.extend(bbox)
    args.extend(categories)
    sqlstr= 'SELECT page_title,longitude,latitude,hitcount,category_name FROM %s ' % SQL_POITABLE + \
            'JOIN category ON poi.category_id=category.category_id JOIN pier ON poi.pier_id=pier.pier_id ' + \
            'WHERE longitude>=%s AND latitude>=%s ' + \
            'AND longitude<=%s AND latitude<=%s ' + \
            'AND (' + catstr + ') ORDER BY -hitcount LIMIT 25'
    rows= sqlExecute(sqlstr, args)
            #~ 'WHERE (pier.pier_date_start<=%s AND pier.pier_date_end>=%s) AND ' + \
    if not len(rows): 
        return ""
    
    features= []
    radiusMax= 25
    radiusMin= 10
    radius= radiusMax
    radiusStep= float(radiusMax-radiusMin)/len(rows)
    for row in rows:
        featureOptions= {
            "type": "Feature", 
            "geometry": {
                "type": "Point", 
                "coordinates": [row['longitude'], row['latitude']]
            },
            "properties": { 
                "category": row['category_name'],
                "hitcount": row['hitcount'],
                "pointRadius": radius,
                "page_title": row['page_title'],
                "title": '<a href="javascript:openPOI(\'%s\')">%s</a>' % (row['page_title'], row['page_title']),
                "description": createPOIDescription(row),
            }
        }
        if row['page_title'] in specialIconProperties:
            for p in specialIconProperties[row['page_title']]:
                featureOptions['properties'][p]= specialIconProperties[row['page_title']][p]
                
        features.append( featureOptions )
        radius-= radiusStep

    features= list(reversed(features))  # so that larger icons will end up with higher z-order than smaller ones
    return json.dumps( { 
                "type": "FeatureCollection",
                "features": features,
            } 
        )
    
@app.route('/piers')
def get_piers():
    rows= sqlExecute("SELECT * FROM %s ORDER BY pier_id" % SQL_PIERTABLE)
    # XXX todo: format pier information same way as config.js
    return json.dumps(rows)
    
@app.route('/pier-for-date/<string:date>')
def get_pier_for_date(date):
    # XXX todo: check whether this works reliably 
    
    rows= sqlExecute("select * from %s" % SQL_PIERTABLE + " where pier_date_start <= %s and pier_date_end >= %s order by -pier_date_start limit 1", (date, date))
    if len(rows): return json.dumps(rows[0])
    
    #~ # transition. return nearest/last pier
    #~ rows= sqlExecute("select * from %s" % SQL_PIERTABLE + " where pier_date_end > %s and pier_date_start > %s order by pier_date_start limit 1", (date, date))
    #~ if len(rows): return json.dumps(rows[0])
    
    return '{}' # blah
    
    
if __name__ == '__main__':
    app.debug= True
    WSGIServer(app).run()
