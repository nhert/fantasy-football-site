#! /bin/bash
#
# Check for if the pickems/survivor nodejs express db folder exists, otherwise clone
if cd pickems-survivor-db; then git pull; else git clone https://github.com/nhert/pickems-survivor-db.git; fi
