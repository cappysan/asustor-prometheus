#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
. /usr/local/AppCentral/cappysan-prometheus/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1
. ${APKG_PKG_DIR}/env


# Folders
# =======
mkdir -p "${STORAGE_TSDB_PATH}"


# Binaries
# ========
# promtool isn't correctly linked during install since the file does not exist, fix that.
# A prometheus configuration can be checked with the following command:
#   promtool check config /share/Configuration/prometheus/prometheus.yml
ln -sf -T /usr/local/AppCentral/cappysan-prometheus/promtool /usr/local/bin/promtool


# Prometheus
# ==========
for as_dir in /share/Configuration/*/deps.d/prometheus/; do
  if test -d "${as_dir}"; then
    rsync -a --inplace --ignore-existing ${as_dir}/ ${APKG_CFG_DIR}/
  fi
done


# Dependencies
# ============
export DOCKER_RELOAD=${DOCKER_RELOAD:-0}
export CERTBOT_RELOAD=${CERTBOT_RELOAD:-0}
/usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload


# Certificate
# ===========
# Create a chain key just for prometheus
# cf: start-stop.sh
cat /usr/builtin/etc/certificate/ssl.pem \
    /usr/builtin/etc/certificate/ssl.crt   > /usr/local/AppCentral/cappysan-prometheus/ssl.crt
cp -f /usr/builtin/etc/certificate/ssl.key /usr/local/AppCentral/cappysan-prometheus/ssl.key
chmod 600 /usr/local/AppCentral/cappysan-prometheus/ssl.key
chown ${APKG_USER}:${APKG_GROUP} /usr/local/AppCentral/cappysan-prometheus/ssl.key

chown -R ${APKG_USER}:${APKG_GROUP} "${STORAGE_TSDB_PATH}"

exit 0
