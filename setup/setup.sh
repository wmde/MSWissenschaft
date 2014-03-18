#!/bin/bash

ADMINUSR=${ADMINUSR:-exhibitadmin}
APPUSR=${APPUSR:-exhibit}
GITREPO=https://github.com/wmde/MSWissenschaft

appdir() {
    sh -c "echo ~$APPUSR/MSWissenschaft"
}

install_packages() {
    sudo apt-get remove gnome-screensaver
    sudo apt-get install git openssh-server chromium-browser lighttpd mysql-server python-pip build-essential python-dev libmysqlclient-dev xscreensaver xscreensaver-gl unclutter xfce4 xfce4-terminal || exit 1
    sudo pip install requests flask flup MySQL-python qrcode || exit 1
}

# APPUSR must be created before calling this
configure_lighttpd() {
    cat <<END | sudo tee /etc/lighttpd/conf-available/10-myfastcgi.conf
fastcgi.debug = 1
fastcgi.server += ( "/poi-query" =>
    ((
        "socket" => "/tmp/poi-query-fcgi.sock",
        "bin-path" => "$(appdir)/query/query.fcgi",
        "check-local" => "disable",
        "max-procs" => 1,
    ))
)
END
    sudo lighty-enable-mod fastcgi myfastcgi accesslog || exit 1
    sudo service lighttpd restart || exit 1
}

# APPUSR must be created before calling this
create_www_symlink() {
    echo "creating symlink: /var/www/MSWissenschaft => $(appdir)"
    sudo ln -sf $(appdir) /var/www/MSWissenschaft || exit 1
}

add_adminuser() {
    echo setting up unix user $ADMINUSR 
    sudo adduser $ADMINUSR 
    for i in adm lp dialout cdrom sudo audio www-data video users fuse; do sudo adduser $ADMINUSR $i || exit 1; done
}

add_appuser() {
    echo setting up unix user $APPUSR
    sudo adduser $APPUSR
    cat << END | sudo tee $(sh -c "echo ~$APPUSR/.my.cnf")
[client]
user='www-data'
END
}

add_adminuser_sql() {
    echo Creating $ADMINUSR mysql user.
    read -p "enter password for $ADMINUSR sql user: " -s pw || exit 1
    echo ""
    echo "enter mysql root password when prompted. " 
    echo "GRANT SELECT, CREATE, INSERT, UPDATE, DROP, ALTER ON *.* TO $ADMINUSR@localhost IDENTIFIED BY '$pw';" | mysql --user=root mysql --password 
    cat <<END | sudo tee $(sh -c "echo ~$ADMINUSR/.my.cnf")
[client]
user='$ADMINUSR'
password='$pw'
END
    sudo chmod 600 $(sh -c "echo ~$ADMINUSR/.my.cnf")
    sudo chown $ADMINUSR $(sh -c "echo ~$ADMINUSR/.my.cnf")
}

add_appuser_sql() {
    echo Creating www-data mysql user.
    echo "GRANT SELECT ON *.* TO 'www-data'@localhost;" | mysql --user=root mysql --password  || exit 1
}

setup_autologin() {
    XSESSION=xfce
    echo Setting up autologin...
    sudo /usr/lib/lightdm/lightdm-set-defaults --autologin $APPUSR
    sudo /usr/lib/lightdm/lightdm-set-defaults --session $XSESSION $APPUSR
    # yeah, whatever!
    sudo dbus-send --system --type=method_call --print-reply --dest=org.freedesktop.Accounts /org/freedesktop/Accounts/User$(id -u $APPUSR) org.freedesktop.Accounts.User.SetXSession string:$XSESSION || exit 1
}

clone_repo() {
    [ -d $(appdir) ] || (
        echo Cloning $GITREPO...
        sudo -u $APPUSR sh -c "cd $(echo ~$APPUSR); git clone $GITREPO" || exit 1
    )
    [ -d $(appdir) ] && (
        echo Git pull...
        sudo -u $APPUSR sh -c "cd $(appdir); git pull" || exit 1
    )
}


install_packages
add_adminuser
add_adminuser_sql
add_appuser
add_appuser_sql
clone_repo
configure_lighttpd
create_www_symlink
setup_autologin

echo
echo "All seems ok."
echo "Next: run dbimport.py, import QR codes, download html pages"
echo "Also you probably want to add your ssh key to $ADMINUSR"

