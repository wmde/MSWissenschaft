#!/usr/bin/python -u
# -*- coding:utf-8 -*-
import os, sys
import time
import csv
import requests


def aggregatefoo(query, station, stationindex, address, category):
    filename= ("rawpois/%02d-%s-%s-%s.csv" % (stationindex, station.replace('/', '_'), address.replace('/', '_'), category))
    if os.path.exists(filename):
        print("skipping existing file: %s" % filename)
        return
    print("writing to file: %s" % filename)
    #~ return
    res= requests.get("http://tools.wmflabs.org/render-tests/tlgbe/tlgwsgi.py", params= query)
    print("url: %s" % res.url)
    i= 0
    with open(filename, 'w') as f:
        for chunk in res.iter_content(100):
            f.write(chunk)
            i+= 1
    
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
                { 'name': 'Wissenschaft+Bildung', 'query': '%s; +Wissenschaft; %s; +Bildung' % (geoq, geoq), 'querydepth': 4 },
            ]:
        query= { 'action': 'query',
                 'lang': 'de',
                 'querydepth': 4,
                 'flaws': 'Geotags Pagehits',
                 'chunked': 'true',
                 'format': 'csv',
                 'maxresults': 55 }
        for k in cat: 
            if k!='name': query[k]= cat[k]
        aggregatefoo(query, row['Station'], index, row['Adresse'], cat['name'])


if __name__ == '__main__':
    #~ csvfile= open('Geokoordinaten Stationen MS Wissenschaft_UTF-8.csv', 'r')
    csvfile= open('Geokoordinaten Stationen MS Wissenschaft.csv', 'r')
    dialect= csv.Sniffer().sniff(csvfile.read(1024))
    csvfile.seek(0)
    reader= csv.DictReader(csvfile, dialect= dialect)
    i= 0
    for row in reader:
        print row
        aggregaterow(row, i)
        i+= 1
