#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-prometheus/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

function logger() {
  echo "${@}" >&2
  syslog --log 0 --level 0 --user SYSTEM --event "${@}"
}

export HOME=/share/Configuration/prometheus
export PID_FILE=/var/run/prometheus.pid
if test -f ${HOME}/env; then
  source ${HOME}/env
fi

# Force defaults if values are missing
export LISTEN_ADDRESS=${LISTEN_ADDRESS:-0.0.0.0:9090}
export STORAGE_TSDB_PATH=${STORAGE_TSDB_PATH:-/share/Configuration/prometheus/data}
export CONFIG_FILE=${CONFIG_FILE:-/share/Configuration/prometheus/prometheus.yml}
export WEBCONFIG_FILE=${WEBCONFIG_FILE:-/share/Configuration/prometheus/web.yml}

export APKG_USER=${APKG_USER:-prometheus}
export APKG_GROUP=${APKG_GROUP:-root}

# promtool isn't correctly linked during install since the file does not exist, fix that.
# A prometheus configuration can be checked with the following command:
#   promtool check config /share/Configuration/prometheus/prometheus.yml
ln -sf -T /usr/local/AppCentral/cappysan-prometheus/promtool /usr/local/bin/promtool

# Create a chain key for prometheus
cat /usr/builtin/etc/certificate/ssl.pem \
    /usr/builtin/etc/certificate/ssl.crt   > /usr/local/AppCentral/cappysan-prometheus/ssl.crt
cp -f /usr/builtin/etc/certificate/ssl.key /usr/local/AppCentral/cappysan-prometheus/ssl.key
chmod 600 /usr/local/AppCentral/cappysan-prometheus/ssl.key
chown -R ${APKG_USER}:${APKG_GROUP} /usr/local/AppCentral/cappysan-prometheus/ssl.key

mkdir -p "${STORAGE_TSDB_PATH}"
chown -R ${APKG_USER}:${APKG_GROUP} "${STORAGE_TSDB_PATH}"

case $1 in
  start)
    logger "[prometheus] Starting..."
    touch "${APKG_CFG_DIR}/active"
    start-stop-daemon -S -b -m -p ${PID_FILE} -c ${APKG_USER}:nogroup -x "./prometheus" -- \
       --config.file=${CONFIG_FILE} --storage.tsdb.path=${STORAGE_TSDB_PATH} \
       --web.listen-address=${LISTEN_ADDRESS} \
       --web.config.file="${WEBCONFIG_FILE}" \
       ${CMDLINE_APPEND}
    ;;

  stop)
    logger "[prometheus] Stopping..."
    rm -f "${APKG_CFG_DIR}/active"
    if test -f ${PID_FILE}; then
      start-stop-daemon -K -p ${PID_FILE}
      rm -f ${PID_FILE}
    fi
    ;;

  reload)
    if test -f "${APKG_CFG_DIR}/active"; then
      if test -f ${PID_FILE}; then
        logger "[prometheus] Reloading..."
        touch "${APKG_CFG_DIR}/active"
        kill -SIGHUP $(cat ${PID_FILE})
      else
        exit 1
      fi
    fi
    ;;

  restart)
    ./CONTROL/start-stop.sh stop
    ./CONTROL/start-stop.sh start
    ;;

  *)
    echo "usage: $0 {start|stop|restart|reload}"
    exit 1
    ;;

esac
exit 0
