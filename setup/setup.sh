#!/bin/bash

ADMINUSR=${ADMINUSR:-exhibitadmin}
APPUSR=${APPUSR:-exhibit}

echo setting up unix user $ADMINUSR 
sudo adduser $ADMINUSR 
sudo adduser $ADMINUSR adm lp dialout cdrom sudo audio www-data video users fuse || exit 1

echo Creating $ADMINUSR mysql user.
read -p "enter password for $ADMINUSR sql user: " -s pw || exit 1
echo ""
echo "enter mysql root password when prompted. " 
echo "GRANT SELECT, CREATE, INSERT, UPDATE, DROP, ALTER ON *.* TO $ADMINUSR@localhost IDENTIFIED BY '$pw';" | mysql --user=root mysql --password 
cat <<END | sudo tee ~$ADMINUSR/.my.cnf
[client]
user='$ADMINUSR'
password='$pw'
END
sudo chmod 600 ~$ADMINUSR/.my.cnf



install_packages() {
    sudo apt-get install chromium-browser lighttpd mysql-server python-pip build-essential python-dev libmysqlclient-dev xscreensaver-gl unclutter xfce4 || exit 1
    sudo pip install requests flask flup MySQL-python qrcode || exit 1
}

configure_lighttpd() {
    cat <<END | sudo tee /etc/lighttpd/conf-available/10-myfastcgi.conf
fastcgi.debug = 1
fastcgi.server += ( "/poi-query" =>
    ((
        "socket" => "/tmp/poi-query-fcgi.sock",
        "bin-path" => "$(pwd)/query/query.fcgi",
        "check-local" => "disable",
        "max-procs" => 1,
    ))
)
END
    sudo lighty-enable-mod fastcgi myfastcgi accesslog || exit 1
    sudo service lighttpd restart || exit 1
}


create_www_symlink() {
    echo "creating symlink: /var/www/MSWissenschaft => $(pwd)"
    sudo ln -sf $(pwd) /var/www/MSWissenschaft || exit 1
}

create_mysql_www_user() {
    echo Creating www-data mysql user.
    echo "GRANT SELECT ON *.* TO 'www-data'@localhost;" | mysql --user=root mysql --password  || exit 1
}

# echo "Now you need to create ~/.my.cnf, create a mysql user with write access, then run dbimport.py, import QR codes, download html pages"

# yeah, whatever!
sudo dbus-send --system --type=method_call --print-reply --dest=org.freedesktop.Accounts /org/freedesktop/Accounts/User1000 org.freedesktop.Accounts.User.SetXSession string:xfce