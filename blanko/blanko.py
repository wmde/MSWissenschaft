#!/usr/bin/python
import subprocess
import re

#this script waits for the screensaver to blank, then kills chromium-browser, which resets the state of the web app.

if __name__ == '__main__':
    proc= subprocess.Popen(['xscreensaver-command', '-watch'], stdout= subprocess.PIPE)
    while True:
        line= proc.stdout.readline()
        if re.match('^BLANK.*', line):
            subprocess.call('killall chromium-browser', shell= True)
            