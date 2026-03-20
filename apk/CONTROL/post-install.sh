#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
# Save variables
APKG_PKG_DIR=/usr/local/AppCentral/${APKG_PKG_NAME}
APKG_PKG_SHORT_VER="${APKG_PKG_VER%-*}"
APKG_CFG_DIR=/share/Configuration/prometheus
export APKG_CFG_DIR APKG_PKG_VER APKG_PKG_SHORT_VER
env | grep APKG | grep -v APKG_PKG_STATUS \
  | grep -v " " | sort > ${APKG_PKG_DIR}/.env.install

${APKG_PKG_DIR}/CONTROL/common.sh

# Download application
APKG_TAR_FILE=/tmp/prometheus.tar.xz
URL="https://github.com/prometheus/prometheus/releases/download/v${APKG_PKG_SHORT_VER}/prometheus-${APKG_PKG_SHORT_VER}.linux-amd64.tar.gz"
wget --progress none -O ${APKG_TAR_FILE} "${URL}" || exit 1

# Replace application by new application
tar --strip-components=1 -vxf ${APKG_TAR_FILE} -C "${APKG_PKG_DIR}"/ || exit 1
rm -f ${APKG_TAR_FILE}

exit 0
