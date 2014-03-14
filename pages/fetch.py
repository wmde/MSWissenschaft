#!/usr/bin/python -u
# -*- coding:utf-8 -*-
import os, sys
import re
import time
import subprocess
import threading
import csv
from collections import deque
import itertools
import glob

DATA_DIR= './data'
POI_DIR= '../../pois/editedpois'
FETCH_CMD_TEMPLATE= '''wget -q -e robots=off --page-requisites --convert-links --span-hosts --domains wikipedia.org,wikimedia.org 'http://de.wikipedia.org/wiki/%s' '''
REPLACE_CMD_TEMPLATE= r'''sed -e 's|\(.*link rel="stylesheet" href="\).*\(".*\)|\1../../%sstyle.css\2|g' -i 'de.wikipedia.org/wiki/%s' '''
THREADS= 200

def unfuck_encoding(filename):
    globber= ''.join([ x if ord(x)<128 else '*' for x in filename ])
    print("Looking for '%s'..." % globber)
    res= glob.glob(globber)
    if not len(res): raise Exception("globbed file/subdir '%s' not found..." % filename)
    print("renaming to '%s'" % filename)
    os.rename(res[0], filename)

def getArticle(title):
    t= title
    if os.path.exists(os.path.join('de.wikipedia.org/wiki', t + ".html")):
        return True
    try:
        subprocess.check_call(FETCH_CMD_TEMPLATE % t, shell=True)
        if not os.path.exists(os.path.join('de.wikipedia.org/wiki', t)):
            print("wget succeeded but file doesn't exist, checking for fucked up encoding")
            foo= ''
            for x in os.path.join('de.wikipedia.org/wiki', t).split('/'):
                foo= os.path.join(foo, x)
                unfuck_encoding(foo)
        updirs= ''.join('../' * (len(t.split('/'))-1))
        subprocess.check_call(REPLACE_CMD_TEMPLATE % (updirs, t), shell=True)
        print("fetched '%s'" % title)
    except Exception as ex:
        print >> sys.stderr, "while fetching '%s': %s" % (title, repr(ex))
        try:
            os.unlink(os.path.join('de.wikipedia.org/wiki', t))
        except:
            pass
        return False
    os.rename(os.path.join('de.wikipedia.org/wiki', t), os.path.join('de.wikipedia.org/wiki', t + ".html"))
    return True

queue= deque()
errqueue= deque()

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
                    return getArticle(title)
                queue.append(job)
    
    for i in range(5):
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
            queue= errqueue
            errqueue= deque()
        else:
            print("all done, exiting")
            break
    
    if len(queue): print("still %d jobs left with errors, giving up..." % len(queue))
