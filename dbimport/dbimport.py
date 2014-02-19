#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
import re
import subprocess
import csv
import MySQLdb, MySQLdb.cursors 

POIDIR= '../pois/editedpois'
SQL_DEFAULTS_FILE= '~/.my.cnf'
SQL_DB= 'mswissenschaft_map'
SQL_POITABLE= 'pois'
SQL_CATEGORYTABLE= 'categories'
SQL_PIERTABLE= 'piers'

## refresh POI data from git repo
def refreshpois():
    subprocess.check_call(['git', 'fetch'])
    subprocess.check_call(['git', 'checkout', 'HEAD', POIDIR])
    
def create_poi_table(cursor, tablename):
    cursor.execute("""CREATE TABLE %s (
                        page_title VARBINARY(255),
                        latitude DOUBLE,
                        longitude DOUBLE,
                        hitcount INT,
                        pier INT,
                        mapcategory INT,
                        KEY(page_title),
                        KEY(latitude),
                        KEY(longitude),
                        KEY(hitcount),
                        KEY(pier),
                        KEY(mapcategory),
                        UNIQUE KEY(page_title, pier, mapcategory)
                         )""" % tablename)

def create_category_table(cursor, tablename):
    cursor.execute("""CREATE TABLE %s (
                        category VARBINARY(255),
                        categoryindex INT,
                        UNIQUE KEY(category),
                        UNIQUE KEY(categoryindex)
                         )""" % tablename)

def create_pier_table(cursor, tablename):
    cursor.execute("""CREATE TABLE %s (
                        pier VARBINARY(255),
                        pierindex INT,
                        UNIQUE KEY(pier),
                        UNIQUE KEY(pierindex)
                         )""" % tablename)

def overwrite_table(createfun, cursor, tablename):
    try:
        createfun(cursor, tablename)
    except MySQLdb.OperationalError as e:
        if e.args[0]==1050:
            print(repr(e))
            print("re-creating existing update table.")
            cursor.execute("DROP TABLE %s" % tablename)
            createfun(cursor, tablename)
        else:
            raise

def move_table(cursor, fromtable, totable):
    cursor.execute('DROP TABLE IF EXISTS %s' % totable)
    cursor.execute('RENAME TABLE %s TO %s' % (fromtable, totable))

## import POI data to sql db
def importpois():
    conn= MySQLdb.connect( read_default_file=os.path.expanduser(SQL_DEFAULTS_FILE), use_unicode=False, cursorclass=MySQLdb.cursors.DictCursor )
    cursor= conn.cursor()

    try:
        cursor.execute("USE %s" % SQL_DB)
    except MySQLdb.OperationalError as e:
        cursor.execute("CREATE DATABASE %s" % SQL_DB)
        cursor.execute("USE %s" % SQL_DB)
    
    overwrite_table(create_poi_table, cursor, SQL_POITABLE+'_new')
        
    piers= dict()
    mapcategories= []
    for file in os.listdir(POIDIR):
        if not file.endswith('.csv'): continue
        print("processing file %s" % file)
        m= re.match('([0-9]{2})-(.*)-(.*).csv', file)
        pierindex= m.group(1)
        piername= m.group(2)
        mapcategory= m.group(3)
        
        piers[pierindex]= piername
        if mapcategory in mapcategories:
            categoryindex= mapcategories.index(mapcategory)
        else:
            print("adding category '%s'" % mapcategory)
            mapcategories.append(mapcategory)
            categoryindex= len(mapcategories)
        
        with open(os.path.join(POIDIR, file)) as f:
            reader= csv.DictReader(f)   #, ("page_title", "latitude", "longitude", "hitcount"))
            for row in reader:
                try:
                    cursor.execute("INSERT INTO %s_new (page_title, latitude, longitude, hitcount, pier, mapcategory)" % SQL_POITABLE +
                                   "VALUES(%s, %s, %s, %s, %s, %s)", (row['page_title'], row['latitude'], row['longitude'], row['hitcount'], pierindex, categoryindex))
                except MySQLdb.IntegrityError as e:
                    if e.args[0]==1062:
                        print("ignoring duplicate entry for '%s' in category '%s' at pier '%s'" % (row['page_title'], mapcategory, piername))
                    else:
                        raise
    
    overwrite_table(create_category_table, cursor, "%s_new" % SQL_CATEGORYTABLE)
    for i in range(len(mapcategories)):
        cursor.execute('INSERT INTO %s_new' % SQL_CATEGORYTABLE + '(category, categoryindex) VALUES (%s, %s)', (mapcategories[i], i))

    overwrite_table(create_pier_table, cursor, "%s_new" % SQL_PIERTABLE)
    for i in piers:
        cursor.execute('INSERT INTO %s_new' % SQL_PIERTABLE + '(pier, pierindex) VALUES (%s, %s)', (piers[i], i))
    
    print("renaming tables")
    move_table(cursor, SQL_POITABLE+'_new', SQL_POITABLE)
    move_table(cursor, SQL_CATEGORYTABLE+'_new', SQL_CATEGORYTABLE)
    move_table(cursor, SQL_PIERTABLE+'_new', SQL_PIERTABLE)
    
    print("sql commit")
    conn.commit()

if __name__ == '__main__':
    #~ refreshpois()
    importpois()