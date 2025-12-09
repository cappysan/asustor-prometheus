#!/usr/bin/env sh
#
# Before deleting the user, we must change permissions to root.
#
APKG_PKG_NAME=cappysan-prometheus
APKG_PKG_SHORT_NAME="${APKG_PKG_NAME#*-}"
APKG_CFG_DIR=/share/Configuration/${APKG_PKG_SHORT_NAME}

if test "x${APKG_PKG_STATUS}" != "xupgrade"; then
  chown -R root:root ${APKG_CFG_DIR}
  userdel ${APKG_PKG_SHORT_NAME}
fi

exit 0
