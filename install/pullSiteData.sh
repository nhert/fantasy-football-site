#! /bin/bash
#
# Check for if the site folder exists, otherwise clone
if cd fantasy-football-site; then git pull; else git clone https://github.com/nhert/fantasy-football-site.git; fi
