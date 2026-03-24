#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-prometheus/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

# Change the permissions before keeping the configuration
if test "x${APKG_PKG_STATUS}" != "xupgrade"; then
  chown -R admin:root ${APKG_CFG_DIR}
  userdel prometheus
fi

exit 0