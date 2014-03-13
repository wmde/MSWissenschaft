#!/usr/bin/python
import os
import MySQLdb, MySQLdb.cursors
import json
import flask
from flask import Flask
from flup.server.fcgi import WSGIServer

app = Flask(__name__)

# todo merge stuff
SQL_DEFAULTS_FILE= '~/.my.cnf'
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
        flask.g.cursor= conn
    else:
        app.logger.debug('reusing db connection')
        cursor= flask.g.userdb.cursor
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
    
@app.route('/pois-by-date/<string:date>/<categories>')
def get_pois_by_date(date, categories):
    bbox= [ float(x) for x in flask.request.args.get('bbox', '-1000,-1000,1000,1000').split(',') ]
    #~ return str(bbox)
    categories= categories.split(',')
    catstr= ' OR '.join( "category.category_name = %s" for cat in categories )
    args= [date, date]
    args.extend(bbox)
    args.extend(categories)
    sqlstr= 'SELECT page_title,longitude,latitude,hitcount,category_name FROM %s ' % SQL_POITABLE + \
            'JOIN category ON poi.category_id=category.category_id JOIN pier ON poi.pier_id=pier.pier_id ' + \
            'WHERE (pier.pier_date_start<=%s AND pier.pier_date_end>=%s) ' + \
            'AND longitude>=%s AND latitude>=%s ' + \
            'AND longitude<=%s AND latitude<=%s ' + \
            'AND (' + catstr + ') ORDER BY -hitcount LIMIT 25'
    #~ return "%s -- %s" % (sqlstr, str(args))
    rows= sqlExecute(sqlstr, args)
    
    features= []
    for row in rows:
        features.append( {
            "type": "Feature", 
            "geometry": {
                "type": "Point", 
                "coordinates": [row['longitude'], row['latitude']]
            },
            "properties": { 
                "category": row['category_name'],
                "hitcount": row['hitcount'],
            }
        } )

    
    #~ return json.dumps(rows)
    return json.dumps( { 
                "type": "FeatureCollection",
                "features": features,
            } 
        )
    
@app.route('/piers')
def get_piers():
    rows= sqlExecute("SELECT * FROM %s ORDER BY pier_id" % SQL_PIERTABLE)
    return json.dumps(rows)
    
if __name__ == '__main__':
    app.debug= True
    WSGIServer(app).run()