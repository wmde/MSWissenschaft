import os
import MySQLdb, MySQLdb.cursors
import json
import flask
from flask import Flask
app = Flask(__name__)

# todo merge stuff
SQL_DEFAULTS_FILE= '~/.my.cnf'
SQL_DB= 'mswissenschaft_map'
SQL_POITABLE= 'poi'
SQL_CATEGORYTABLE= 'category'
SQL_PIERTABLE= 'pier'


def getCursor():
    # todo cache per-thread or something
    conn= MySQLdb.connect( read_default_file=os.path.expanduser(SQL_DEFAULTS_FILE), use_unicode=False, cursorclass=MySQLdb.cursors.DictCursor )
    cursor= conn.cursor()
    cursor.execute("USE %s" % SQL_DB)
    return cursor

@app.route('/')
def site_map():
    links = []
    rules= sorted(app.url_map.iter_rules())
    for rule in rules:
        if "GET" in rule.methods:
            app.logger.debug(repr(rule))
            links.append(flask.escape(repr(rule)))
    return '<br>'.join(links)

@app.route('/pois/<int:pier_id>/<categories>')
def get_pois(pier_id, categories):
    return '...POI data for pier ID %s for categories "%s"...' % (pier_id, categories)
    
@app.route('/piers')
def get_piers():
    cursor= getCursor()
    cursor.execute("SELECT * FROM %s ORDER BY pier_id" % SQL_PIERTABLE)
    piers= list()
    for row in cursor.fetchall():
        piers.append(row)
    return json.dumps(piers)
    
if __name__ == '__main__':
    app.run(debug= True)
