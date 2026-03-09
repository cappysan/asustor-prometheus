#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-prometheus/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

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

mkdir -p "${STORAGE_TSDB_PATH}"
chown -R ${APKG_USER}:${APKG_GROUP} "${STORAGE_TSDB_PATH}"

case $1 in
  start)
    touch "${APKG_CFG_DIR}/active"
    start-stop-daemon -S -b -m -p ${PID_FILE} -c ${APKG_USER}:${APKG_GROUP} -x "./prometheus" -- \
       --config.file=${CONFIG_FILE} --storage.tsdb.path=${STORAGE_TSDB_PATH} \
       --web.listen-address=${LISTEN_ADDRESS} \
       --web.config.file="${WEBCONFIG_FILE}" \
       ${CMDLINE_APPEND}
    ;;

  stop)
    if test -f "${APKG_CFG_DIR}/active"; then
      rm -f "${APKG_CFG_DIR}/active"
    fi

    if test -f ${PID_FILE}; then
      start-stop-daemon -K -p ${PID_FILE}
      rm -f ${PID_FILE}
    fi
    ;;

  reload)
    if test -f ${PID_FILE}; then
      touch "${APKG_CFG_DIR}/active"
      kill -SIGHUP $(cat ${PID_FILE})
    else
      exit 1
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
