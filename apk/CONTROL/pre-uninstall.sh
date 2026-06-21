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

# Clean
# =====
if test "x${APKG_PKG_STATUS}" != "xupgrade"; then
  # Remove Apache proxy config (our own deps.d copy; apache start-hook will
  # then no longer pick it up, and a reload clears it from sites-enabled/available)
  logger "[${WHAT}] Removing Apache pi-hole configuration..."
  rm -f /share/Configuration/apache/sites-*/prometheus.conf
  rm -f /share/Configuration/prometheus/deps.d/apache/sites-*/prometheus.conf
  /usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload >/dev/null 2>&1

  # Remove certbot renewal hook
  logger "[${WHAT}] Removing certbot renewal hook..."
  rm -f /share/Configuration/certbot/letsencrypt/renewal-hooks/deploy/10-prometheus
  rm -f /share/Configuration/prometheus/deps.d/certbot/renewal-hooks/deploy/10-prometheus
fi

# ------------------------------------------------------------------------------
exit 0
