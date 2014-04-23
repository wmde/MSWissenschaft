#!/usr/bin/python -u
# -*- coding:utf-8 -*-
import os, sys
import re
import time
import csv
import json
import requests
import geobbox

STATIONS_CSV= '../../pois/Geokoordinaten Stationen MS Wissenschaft.csv'
SEEDTEMPLATE= """seeds:
  myseed1:
    caches: [osm_cache]
    # grids: []
    coverages: [%s]
    levels:
      from: 9
      to: 16

coverages:"""

def process_row(row, count):
    bblat, bblon= geobbox.bounding_box(float(row['Breite']), float(row['Laenge']), 4.5)
    mangled_name= ''.join( [ (char if ord(char)<127 and char!=' ' else '_') for char in row['Station'] ] )
    covg_name= "%02d_%s" % (count, mangled_name)
    covg_desc= """
  %s:
    bbox: [%.4f, %.4f, %.4f, %.4f]
    srs: "EPSG:4326" """ % \
    ( covg_name,
        float(row['Laenge']) - bblon,
        float(row['Breite']) - bblat,
        float(row['Laenge']) + bblon,
        float(row['Breite']) + bblat )
    #~ print coveragestr,
    return covg_name, covg_desc

if __name__ == '__main__':
    csvfile= open(STATIONS_CSV, 'r')
    dialect= csv.Sniffer().sniff(csvfile.read(1024))
    csvfile.seek(0)
    reader= csv.DictReader(csvfile, dialect= dialect)
    i= 0
    covg_names= []
    covg_string= ""
    for row in reader:
        covg_name, covg_desc= process_row(row, i)
        covg_string+= covg_desc
        covg_names.append(covg_name)
        i+= 1
    print SEEDTEMPLATE % (', '.join(covg_names)),
    print covg_string
    