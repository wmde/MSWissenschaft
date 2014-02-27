#!/usr/bin/python -u
# -*- coding:utf-8 -*-
import os, sys, time
import threading
import csv
from collections import deque
import qrcode, qrcode.image.svg

DATA_DIR= './data'
POI_DIR= '../../pois/editedpois'
THREADS= 4

queue= deque()
errqueue= deque()

def createQr(title):
    if os.path.exists(title + '.svg'): return True
    url= 'http://de.qrwp.org/%s' % (title.replace(' ', '_'))
    img= qrcode.make(url, image_factory= qrcode.image.svg.SvgPathImage)
    if '/' in title: os.makedirs('/'.join(title.split('/')[:-1]))
    with open(title + '.svg', 'w') as f:
        img.save(f)
    return True

def worker():
    while True:
        try:
            job= queue.popleft()
        except IndexError:
            return
        if not job(): errqueue.append(job)

if __name__ == '__main__':
    try:
        os.makedirs(DATA_DIR)
    except Exception as ex:
        if ex.args[0]!=17: raise
    
    os.chdir(DATA_DIR)

    print("processing csv...")
    for file in os.listdir(POI_DIR):
        if not file.endswith('.csv'): continue
        with open(os.path.join(POI_DIR, file)) as f:
            reader= csv.DictReader(f)   #, ("page_title", "latitude", "longitude", "hitcount"))
            for row in reader:
                if row['page_title'].strip()=='':
                    print("skipping blank line...")
                    continue
                def job(title= row['page_title']):
                    return createQr(title)
                queue.append(job)
    
    print("queue length: %d" % len(queue))
    startlen= len(queue)
    
    for i in range(THREADS):
        th = threading.Thread(target= worker)
        th.start()
    
    while threading.active_count()>1: 
        done= max(startlen-len(queue)-threading.active_count(), 0)
        print("%d of %d (%d%%)" % (done, startlen, done*100/startlen))
        time.sleep(2)
    
    if len(errqueue):
        print("%d errors" % len(errqueue))

    print("all done.")
