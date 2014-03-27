#!/usr/bin/python
# -*- coding:utf-8 -*-
import os
import re
import subprocess
import csv
import MySQLdb, MySQLdb.cursors 

POIDIR= '../pois/editedpois'
PIERDESCFILE= '../pois/Geokoordinaten Stationen MS Wissenschaft.csv'

SQL_DEFAULTS_FILE= '~/.my.cnf'
SQL_DB= 'mswissenschaft_map'
SQL_POITABLE= 'poi'
SQL_CATEGORYTABLE= 'category'
SQL_PIERTABLE= 'pier'

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
                        pier_id INT,
                        category_id INT,
                        KEY(page_title),
                        KEY(latitude),
                        KEY(longitude),
                        KEY(hitcount),
                        KEY(pier_id),
                        KEY(category_id),
                        UNIQUE KEY(page_title, pier_id, category_id)
                         )""" % tablename)

def create_category_table(cursor, tablename):
    cursor.execute("""CREATE TABLE %s (
                        category_name VARBINARY(255),
                        category_id INT,
                        UNIQUE KEY(category_name),
                        UNIQUE KEY(category_id)
                         )""" % tablename)

def create_pier_table(cursor, tablename):
                        #~ pier_name VARBINARY(255),
    cursor.execute("""CREATE TABLE %s (
                        pier_city VARBINARY(255),
                        pier_address VARBINARY(255),
                        pier_id INT,
                        pier_latitude DOUBLE,
                        pier_longitude DOUBLE,
                        pier_date_start VARBINARY(10),
                        pier_date_end VARBINARY(10),
                        UNIQUE KEY(pier_city, pier_address),
                        UNIQUE KEY(pier_id),
                        KEY(pier_date_start),
                        KEY(pier_date_end)
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
        m= re.match('([0-9]{2})\.([^\.]*)\.(.*)\.(.*).csv', file)
        pierindex= m.group(1)
        piercity= m.group(2)
        pieraddress= m.group(3)
        mapcategory= m.group(4)
        
        piers[pierindex]= (piercity, pieraddress)
        if mapcategory in mapcategories:
            categoryindex= mapcategories.index(mapcategory)
        else:
            print("adding category '%s'" % mapcategory)
            mapcategories.append(mapcategory)
            categoryindex= len(mapcategories)
        
        with open(os.path.join(POIDIR, file)) as f:
            reader= csv.DictReader(f)   #, ("page_title", "latitude", "longitude", "hitcount"))
            for row in reader:
                if row['page_title'].strip()=='':
                    print("skipping blank line...")
                    continue
                try:
                    cursor.execute("INSERT INTO %s_new (page_title, latitude, longitude, hitcount, pier_id, category_id)" % SQL_POITABLE +
                                   "VALUES(%s, %s, %s, %s, %s, %s)", (row['page_title'], row['latitude'], row['longitude'], row['hitcount'], pierindex, categoryindex))
                except MySQLdb.IntegrityError as e:
                    if e.args[0]==1062:
                        print("ignoring duplicate entry for '%s' in category '%s' at pier '%s'" % (row['page_title'], mapcategory, piercity))
                    else:
                        raise
    
    overwrite_table(create_category_table, cursor, "%s_new" % SQL_CATEGORYTABLE)
    for i in range(len(mapcategories)):
        cursor.execute('INSERT INTO %s_new' % SQL_CATEGORYTABLE + '(category_name, category_id) VALUES (%s, %s)', (mapcategories[i], i))

    overwrite_table(create_pier_table, cursor, "%s_new" % SQL_PIERTABLE)
    for i in piers:
        cursor.execute('INSERT INTO %s_new' % SQL_PIERTABLE + '(pier_city, pier_address, pier_id) VALUES (%s, %s, %s)', (piers[i][0], piers[i][1], i))
    
    print("reading pier info")
    with open(PIERDESCFILE) as f:
        reader= csv.DictReader(f)
        def fmtdate(d):
            m= re.match('([0-9]+)\.([0-9]+)\.([0-9]+)', d.strip())
            return '%04s-%02s-%02s' % (m.group(3), m.group(2), m.group(1))
        for row in reader:
            cmd= ('UPDATE %s_new ' % SQL_PIERTABLE) + "SET pier_latitude=%s, pier_longitude=%s, pier_date_start=%s, pier_date_end=%s WHERE pier_city=%s AND pier_address=%s"
            #~ print(cmd)
            cursor.execute(cmd, (float(row['Breite']), float(row['Laenge']), fmtdate(row['Datum Ankunft']), fmtdate(row['Datum Abreise']), row['Station'], row['Adresse']))
    
    print("renaming tables")
    move_table(cursor, SQL_POITABLE+'_new', SQL_POITABLE)
    move_table(cursor, SQL_CATEGORYTABLE+'_new', SQL_CATEGORYTABLE)
    move_table(cursor, SQL_PIERTABLE+'_new', SQL_PIERTABLE)
    
    print("sql commit")
    conn.commit()

if __name__ == '__main__':
    #~ refreshpois()
    importpois()