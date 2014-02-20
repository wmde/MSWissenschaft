import flask
from flask import Flask
app = Flask(__name__)

@app.route('/')
def site_map():
    links = []
    rules= sorted(app.url_map.iter_rules())
    for rule in rules:
        if "GET" in rule.methods:
            app.logger.debug(repr(rule))
            #~ foo= "%s%s" % (rule.rule, '/'.join(rule.arguments))
            #~ links.append(foo)
            links.append(flask.escape(repr(rule)))
    return '<br>'.join(links)

@app.route('/pois/<int:pier_id>/<categories>')
def get_pois(pier_id, categories):
    return '...POI data for pier ID %s for categories "%s"...' % (pier_id, categories)
    
@app.route('/piers')
def get_piers():
    return '...JSON about piers from the database...'
    
if __name__ == '__main__':
    app.run(debug= True)
    