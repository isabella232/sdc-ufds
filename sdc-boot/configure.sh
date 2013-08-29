#!/usr/bin/bash
#
# Copyright (c) 2011 Joyent Inc., All rights reserved.
#

export PS4='[\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
set -o xtrace

role=ufds
LDAPTLS_REQCERT=allow
PATH=/opt/smartdc/$role/build/node/bin:/opt/local/bin:/opt/local/sbin:/usr/bin:/usr/sbin

echo "Importing SMF Manifests"
/usr/sbin/svccfg import /opt/smartdc/$role/smf/manifests/$role-master.xml
/usr/sbin/svccfg import /opt/smartdc/$role/smf/manifests/$role-capi.xml

IS_MASTER=$(cat /opt/smartdc/ufds/etc/config.json | /usr/bin/json ufds_is_master)
if [[ "${IS_MASTER}" == "false" ]]; then
  /usr/sbin/svccfg import /opt/smartdc/$role/smf/manifests/$role-replicator.xml
fi

# We are intentionally giving UFDS service some room to create the required
# moray buckets before it gets called to add bootstrap data.
sleep 10

exit 0
