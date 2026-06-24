#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
. /usr/local/AppCentral/cappysan-prometheus/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1
if test -f ${APKG_PKG_DIR}/env; then
  . ${APKG_PKG_DIR}/env
fi
# ------------------------------------------------------------------------------
export PID_FILE=/var/run/prometheus.pid

if test -f ${APKG_CFG_DIR}/env; then
  . ${APKG_CFG_DIR}/env
fi

# Force defaults if values are missing
export LISTEN_ADDRESS=${LISTEN_ADDRESS:-0.0.0.0:9090}
export STORAGE_TSDB_PATH=${STORAGE_TSDB_PATH:-/share/Configuration/prometheus/data}
export CONFIG_FILE=${CONFIG_FILE:-/share/Configuration/prometheus/prometheus.yml}
export WEBCONFIG_FILE=${WEBCONFIG_FILE:-/share/Configuration/prometheus/web.yml}

case $1 in
  start)
    logger "[${WHAT}] Starting daemon..."
    touch "${APKG_PKG_DIR}/active"
    ./CONTROL/start-hook.sh
    start-stop-daemon -S -b -m -p ${PID_FILE} -c ${APKG_USER}:nogroup -x "${APKG_PKG_DIR}/prometheus" -- \
       --config.file=${CONFIG_FILE} --storage.tsdb.path=${STORAGE_TSDB_PATH} \
       --web.listen-address=${LISTEN_ADDRESS} \
       --web.config.file="${WEBCONFIG_FILE}" \
       ${CMDLINE_APPEND}
    ;;

  stop)
    logger "[${WHAT}] Stopping daemon..."
    rm -f "${APKG_PKG_DIR}/active"
    if test -f ${PID_FILE}; then
      start-stop-daemon -K -p ${PID_FILE}
      rm -f ${PID_FILE}
    fi
    ;;

  restart)
    ./CONTROL/start-stop.sh stop
    ./CONTROL/start-stop.sh start
    ;;

  reload)
    if test -f "${APKG_PKG_DIR}/active"; then
      logger "[${WHAT}] Reloading daemon..."
      if test -f ${PID_FILE}; then
        ./CONTROL/start-hook.sh
        kill -SIGHUP $(cat ${PID_FILE})
      fi
    fi
    ;;

  *)
    echo "usage: $0 {start|stop|restart|reload}"
    exit 1
    ;;
esac

exit 0
