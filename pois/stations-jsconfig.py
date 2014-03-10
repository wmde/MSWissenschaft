#!/usr/bin/python -u
# -*- coding:utf-8 -*-
import os, sys
import re
import time
import csv
import json
import requests




def cvtrow(row, index):
    empty= True
    for k in row: 
        if row[k]!='': empty= False
    if empty: return
    
    #~ for cat in [ 
        #~ count= aggregatefoo(query, row['Station'], index, row['Adresse'], cat['name'], 55)
        #~ if count is not None: print("%s results." % count)
    #~ Station,Adresse,Laenge,Breite,Datum Ankunft,Datum Abreise
    #~ { "title": "Berlin, Schiffbauerdamm 15", "lat": 13.38, "lon": 52.52, "time": DayOffset("06.05.2014") }, 

    m= re.match(r'([0-9]+)\.([0-9]+)\.([0-9]+)', row["Datum Ankunft"])
    reasonableDate= "%s-%s-%s" % (m.group(3), m.group(2), m.group(1)) 
    d= { "title": "%s<br/>%s" % (row["Station"], row["Adresse"]), "lon": row["Laenge"], "lat": row["Breite"], "time": "DayOffset('%s')" % reasonableDate }
    dstr= json.dumps(d).replace('"DayOffset(', 'DayOffset(').replace("')\"", "')")
    print("\t\t" + dstr + ",")


if __name__ == '__main__':
    #~ csvfile= open('Geokoordinaten Stationen MS Wissenschaft_UTF-8.csv', 'r')
    csvfile= open('Geokoordinaten Stationen MS Wissenschaft.csv', 'r')
    dialect= csv.Sniffer().sniff(csvfile.read(1024))
    csvfile.seek(0)
    reader= csv.DictReader(csvfile, dialect= dialect)
    i= 0
    for row in reader:
        cvtrow(row, i)
        i+= 1
