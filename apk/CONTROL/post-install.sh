#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
# Save variables
APKG_PKG_DIR=/usr/local/AppCentral/${APKG_PKG_NAME}
APKG_PKG_SHORT_VER="${APKG_PKG_VER%-*}"
APKG_CFG_DIR=/share/Configuration/prometheus
export APKG_CFG_DIR APKG_PKG_VER APKG_PKG_SHORT_VER
env | grep APKG | grep -v " " | sort > ${APKG_PKG_DIR}/.env.install

${APKG_PKG_DIR}/CONTROL/common.sh

# Download application
APKG_TAR_FILE=/tmp/prometheus.tar.xz
URL="https://github.com/prometheus/prometheus/releases/download/v${APKG_PKG_SHORT_VER}/prometheus-${APKG_PKG_SHORT_VER}.linux-amd64.tar.gz"
wget --progress none -O ${APKG_TAR_FILE} "${URL}" || exit 1

# Replace application by new application
tar --strip-components=1 -vxf ${APKG_TAR_FILE} -C "${APKG_PKG_DIR}"/ || exit 1
rm -f ${APKG_TAR_FILE}

# Read the certificate and extract the domain, since there doesn't seem to be
# an easy way to get configured FQDN (`hostname -f` returns same as `hostname`).
# Use `cut` since busybox version has bug in ${as_cn:0:1}
as_cn=$(openssl x509 -noout -subject -nameopt multiline -in /usr/builtin/etc/certificate/ssl.crt | grep commonName | head -1 | sed 's/.*=//' | xargs)
if test "x${as_cn}" == "x"; then
  true
elif test "x${as_cn}" != "xSupport"; then
  as_host=$(hostname)
  # Remove the wildcard, add the host
  if test "x$(echo ${as_cn} | cut -c1)" == "x*"; then
    as_cn=${as_host}$(echo $as_cn | cut -c2-)
  fi
  # We probably have a valid FQDN
  sed "s/localhost/${as_cn}/" -i conf.dist/file_sd_configs.d/prometheus.yml
  sed "s/prometheus.example.com/${as_cn}/" -i conf.dist/file_sd_configs.d/prometheus.yml
fi

exit 0
