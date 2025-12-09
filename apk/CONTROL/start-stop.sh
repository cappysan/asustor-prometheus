#!/usr/bin/env sh
#
APKG_PKG_NAME=cappysan-prometheus
APKG_PKG_SHORT_NAME="${APKG_PKG_NAME#*-}"
APKG_PKG_DIR=/usr/local/AppCentral/${APKG_PKG_NAME}

cd ${APKG_PKG_DIR} || exit 1

if test -f /share/Configuration/${APKG_PKG_SHORT_NAME}/env; then
  source /share/Configuration/${APKG_PKG_SHORT_NAME}/env
fi
export HOME=/share/Configuration/${APKG_PKG_SHORT_NAME}
export PID_FILE=/var/run/${APKG_PKG_SHORT_NAME}.pid

export LISTEN_ADDRESS=${LISTEN_ADDRESS:-0.0.0.0:9090}
export STORAGE_TSDB_PATH=${STORAGE_TSDB_PATH:-/share/Configuration/prometheus/data}
export CONFIG_FILE=${CONFIG_FILE:-/share/Configuration/${APKG_PKG_SHORT_NAME}/prometheus.yml}
export WEBCONFIG_FILE=${WEBCONFIG_FILE:-/share/Configuration/${APKG_PKG_SHORT_NAME}/web.yml}

# promtool isn't correctly linked during install since the file does not exist, fix that.
# A prometheus configuration can be checked with the following command:
#   promtool check config /share/Configuration/prometheus/prometheus.yml
ln -sf -T /usr/local/AppCentral/cappysan-prometheus/promtool /usr/local/bin/promtool

case $1 in
  start)
    start-stop-daemon -S -b -m -p ${PID_FILE} -c prometheus:nogroup -x "./prometheus" -- \
       --config.file=${CONFIG_FILE} --storage.tsdb.path=${STORAGE_TSDB_PATH} \
       --web.listen-address=${LISTEN_ADDRESS} \
       --web.config.file="${WEBCONFIG_FILE}" \
       ${CMDLINE_APPEND}
    ;;

  stop)
    if test -f ${PID_FILE}; then
      start-stop-daemon -K -p ${PID_FILE}
      rm -f ${PID_FILE}
    fi
    ;;

  reload)
    if test -f ${PID_FILE}; then
      kill -SIGHUP $(cat ${PID_FILE})
    else
      exit 1
    fi
    ;;

  restart)
    ${0} stop
    ${0} start
    ;;

  *)
    echo "usage: $0 {start|stop|restart|reload}"
    exit 1
    ;;

esac
exit 0
