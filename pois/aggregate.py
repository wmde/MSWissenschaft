#!/usr/bin/python -u
# -*- coding:utf-8 -*-
import os, sys
import re
import time
import csv
import json
import requests


def aggregatefoo(query, station, stationindex, address, category, maxresults):
    filename= ("rawpois/%02d-%s-%s-%s.csv" % (stationindex, station.replace('/', '_'), address.replace('/', '_'), category))
    if os.path.exists(filename):
        #~ print("skipping existing file: %s" % filename)
        return
    print("writing to file: %s" % filename)
    #~ return
    res= requests.get("http://tools.wmflabs.org/render-tests/tlgbe/tlgwsgi.py", params= query)
    print("url: %s" % res.url)
    i= 0
    with open(filename, 'w') as f:
        writer= csv.DictWriter(f, ("page_title", "latitude", "longitude", "hitcount"))
        writer.writeheader()
        for line in res.iter_lines():
            obj= json.loads(line)
            if 'flaws' in obj:
                count= None
                latitude= None
                longitude= None
                page_title= obj['page']['page_title'].encode('utf-8')
                for x in obj['flaws']:
                    if 'name' in x:
                        if x['name']=='Geotags':
                            coordtext= re.match(r'(?:<a[^>]*>)?([^<]*)(?:</a>)?', x['infotext']).group(1)
                            coords= coordtext.split(',')
                            #~ print page_title, coordtext, coords
                            latitude= coords[0]
                            longitude= coords[1]
                        if x['name']=='Page Hits':
                            count= (re.match('count: (.*)', x['infotext']).group(1))
                            count= 0 if count=='?' else int(count)
                if latitude!=None and longitude!=None and count!=None:
                    writer.writerow( { 'latitude': latitude, 'longitude': longitude, 'page_title': page_title, 'hitcount': count } )
                    i+= 1
                    if i>=maxresults: return
            #~ elif 'progress' in obj:
                #~ prog= obj['progress'].split('/')
                #~ rel= float(prog[0])*10/float(prog[1])
                #~ s= ''.join(['.']*int(rel))
                #~ sys.stdout.write("\r%s" % s)
                #~ sys.stdout.flush()
    
def aggregaterow(row, index):
    empty= True
    for k in row: 
        if row[k]!='': empty= False
    if empty: return
    
    bbox= row['Koordinaten'].split(',')
    center= [ (float(bbox[0])+float(bbox[2]))/2, (float(bbox[1])+float(bbox[3]))/2 ]
    geoq= "geobbox#%s,%s,4" % (center[1], center[0])
    for cat in [ 
                { 'name': 'Wirtschaft', 'query': '%s; +Wirtschaft' % geoq, 'querydepth': 4 },
                { 'name': 'Politik', 'query': '%s; +Politik' % geoq, 'querydepth': 4 },
                { 'name': 'Wissenschaft+Bildung', 'query': 'Wissenschaft; Bildung; +%s' % (geoq), 'querydepth': 4 },
            ]:
        query= { 'action': 'query',
                 'lang': 'de',
                 'querydepth': 4,
                 'flaws': 'Geotags Pagehits',
                 'chunked': 'true',
                 #~ 'format': 'csv',
                 #~ 'maxresults': 55 
                 }
        for k in cat: 
            if k!='name': query[k]= cat[k]
        aggregatefoo(query, row['Station'], index, row['Adresse'], cat['name'], 55)


if __name__ == '__main__':
    #~ csvfile= open('Geokoordinaten Stationen MS Wissenschaft_UTF-8.csv', 'r')
    csvfile= open('Geokoordinaten Stationen MS Wissenschaft.csv', 'r')
    dialect= csv.Sniffer().sniff(csvfile.read(1024))
    csvfile.seek(0)
    reader= csv.DictReader(csvfile, dialect= dialect)
    i= 0
    for row in reader:
        aggregaterow(row, i)
        i+= 1
