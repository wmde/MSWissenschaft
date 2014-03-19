#!/usr/bin/python
import subprocess

# this script gets called regularly by cron and runs as the unprivileged exhibit user
if __name__ == '__main__':
    # pull latest changes from git
    # will throw and exit on error (e. g. if network connection is down)
    subprocess.check_call("git pull", shell=True)
    
    