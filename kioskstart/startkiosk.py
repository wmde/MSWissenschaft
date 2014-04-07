#!/usr/bin/python
import subprocess
import re
import time
import thread

if __name__ == '__main__':
    # this waits for the screensaver to blank, then kills chromium-browser, which resets the state of the web app.
    def WatchScreensaver():
        while True:
            proc= subprocess.Popen(['xscreensaver-command', '-watch'], stdout= subprocess.PIPE)
            while True:
                line= proc.stdout.readline()
                if re.match('^BLANK.*', line):
                    subprocess.call('kill -9 $(pgrep chromium)', shell= True)
    
    # endlessly restart chromium
    def EndlessChromium():
        while True:
            subprocess.call("chromium-browser --user-data-dir=$HOME/.config/chromium-mswissenschaft --kiosk 'http://localhost/MSWissenschaft/web'", shell=True)
            time.sleep(0.5)
    
    # ginn should never exit, but restart it endlessly, just in case...
    def EndlessGinn():
        while True:
            subprocess.call("ginn ginnconfig.xml", shell=True)
            time.sleep(0.5)
    
    # unclutter should never exit, but restart it endlessly, just in case...
    def EndlessUnclutter():
        subprocess.call("killall unclutter", shell=True)
        while True:
            time.sleep(0.5)
            subprocess.call("unclutter -idle 0.1", shell=True)
    
    thread.start_new_thread(EndlessChromium, ())
    thread.start_new_thread(WatchScreensaver, ())
    thread.start_new_thread(EndlessGinn, ())
    
    EndlessUnclutter()
    
