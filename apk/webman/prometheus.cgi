#!/bin/sh
# Prometheus UI CGI
# SPDX-License-Identifier: MIT

BODY=""
if [ "$REQUEST_METHOD" = "POST" ] && [ -n "$CONTENT_LENGTH" ] && [ "$CONTENT_LENGTH" -gt 0 ]; then
    BODY=$(dd bs=1 count="$CONTENT_LENGTH" 2>/dev/null)
fi

ALL_PARAMS="${QUERY_STRING}&${BODY}"

urldecode() {
    echo "$1" | awk 'BEGIN{
        for (i=0; i<256; i++) chr[sprintf("%02X", i)] = sprintf("%c", i)
    }
    {
        gsub(/\+/, " ")
        out = ""
        while (match($0, /%[0-9A-Fa-f][0-9A-Fa-f]/)) {
            out = out substr($0, 1, RSTART-1) chr[toupper(substr($0, RSTART+1, 2))]
            $0 = substr($0, RSTART+RLENGTH)
        }
        print out $0
    }'
}

get_param() {
    raw=$(echo "$ALL_PARAMS" | tr '&' '\n' | grep "^${1}=" | head -1 | cut -d= -f2-)
    urldecode "$raw"
}

ACT=$(get_param act)
TAB=$(get_param tab)

respond() {
    printf 'Content-Type: application/json\r\n\r\n'
    printf '%s' "$1"
}

CFG_DIR="/share/Configuration/prometheus"
if [ -n "$APKG_CFG_DIR" ]; then CFG_DIR="$APKG_CFG_DIR"; fi
ENV_FILE="${CFG_DIR}/env"
PROMETHEUS_YML="${CFG_DIR}/prometheus.yml"

APACHE_SITES_AVAILABLE="${CFG_DIR}/deps.d/apache/sites-available"
APACHE_SITES_ENABLED="${CFG_DIR}/deps.d/apache/sites-enabled"
APACHE_CONF_AVAILABLE="${APACHE_SITES_AVAILABLE}/prometheus.conf"
APACHE_CONF_ENABLED="${APACHE_SITES_ENABLED}/prometheus.conf"

find_python() {
    for P in python3 python /usr/local/bin/python3 /usr/bin/python3 /usr/bin/python; do
        if command -v "$P" >/dev/null 2>&1; then echo "$P"; return; fi
    done
}

case "$ACT" in

    get)
        PYTHON=$(find_python)
        if [ -z "$PYTHON" ]; then
            respond '{"success":false,"error_code":500,"error_msg":"No python interpreter found"}'
            exit 0
        fi

        case "$TAB" in
            settings)
                # Check apache proxy state for the link builder
                APACHE_PROXY_ENABLED="false"
                if [ -f "$APACHE_CONF_AVAILABLE" ]; then
                    APACHE_PROXY_ENABLED="true"
                fi

                export _ENV_FILE="$ENV_FILE" _APACHE_PROXY_ENABLED="$APACHE_PROXY_ENABLED"
                RESULT=$("$PYTHON" - << 'PYEOF'
import json, os, re, sys, subprocess

path = os.environ.get('_ENV_FILE', '')

def parse(path):
    data = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.rstrip('\n')
                s = line.strip()
                if not s or s.startswith('#'):
                    continue
                m = re.match(r'^\s*export\s+([A-Za-z0-9_]+)\s*=\s*(.*)$', line)
                if not m:
                    m = re.match(r'^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$', line)
                if m:
                    key = m.group(1)
                    val = m.group(2).strip().strip("'").strip('"')
                    data[key] = val
    except Exception:
        pass
    return data

d = parse(path)
tsdb_path = d.get('STORAGE_TSDB_PATH', '/share/Configuration/prometheus/data')

# Compute the on-disk size of the whole TSDB path (du -sb gives bytes).
tsdb_size_bytes = 0
try:
    out = subprocess.check_output(['du', '-sb', tsdb_path], stderr=subprocess.DEVNULL)
    tsdb_size_bytes = int(out.split()[0])
except Exception:
    tsdb_size_bytes = 0

# Get hostname and FQDN
hostname = ''
fqdn = ''
try:
    import socket
    hostname = socket.gethostname()
    fqdn = socket.getfqdn()
except Exception:
    pass

# Get LAN IP addresses and default gateway from /etc/nas.conf
lan_ips = {'lan1': '', 'lan2': ''}
default_gateway = ''
try:
    import configparser
    with open('/etc/nas.conf') as f:
        raw = '[__root__]\n' + f.read()
    cp = configparser.RawConfigParser()
    cp.read_string(raw)
    for s in cp.sections():
        if s.lower() == 'network':
            for k, v in cp.items(s):
                k_lower = k.lower()
                if k_lower in ('lan1ip', 'lan1_ip'): lan_ips['lan1'] = v.strip()
                if k_lower in ('lan2ip', 'lan2_ip'): lan_ips['lan2'] = v.strip()
                if k_lower in ('defaultgateway', 'default_gateway'): default_gateway = v.strip()
except Exception:
    pass

# Get IP of the default gateway interface
gateway_ip = ''
if default_gateway and default_gateway in lan_ips:
    gateway_ip = lan_ips[default_gateway]

result = {
    'success': True,
    'listen_address':       d.get('LISTEN_ADDRESS', '0.0.0.0:9090'),
    'storage_tsdb_path':    tsdb_path,
    'tsdb_size_bytes':      tsdb_size_bytes,
    'cmdline_append':       d.get('CMDLINE_APPEND', ''),
    'web_url_override':     d.get('WEB_URL_OVERRIDE', ''),
    'apache_proxy_enabled': os.environ.get('_APACHE_PROXY_ENABLED', 'false') == 'true',
    'hostname':             hostname,
    'fqdn':                 fqdn,
    'lan_ips':              lan_ips,
    'gateway_ip':           gateway_ip
}
print(json.dumps(result))
PYEOF
)
                printf 'Content-Type: application/json\r\n\r\n'
                printf '%s' "$RESULT"
                ;;

            prometheus)
                export _PROMETHEUS_YML="$PROMETHEUS_YML"
                RESULT=$("$PYTHON" - << 'PYEOF'
import json, os, re

path = os.environ.get('_PROMETHEUS_YML', '')

try:
    with open(path) as f:
        text = f.read()
except Exception:
    text = ''

def find_scalar(text, key, indent):
    # Matches "  key: value" possibly followed by a trailing comment, at a
    # specific indent level (in spaces). Returns the bare value (no comment).
    pattern = r'(?m)^' + (' ' * indent) + re.escape(key) + r':[ \t]*(\S+)'
    m = re.search(pattern, text)
    return m.group(1) if m else ''

scrape_interval      = find_scalar(text, 'scrape_interval', 2)
evaluation_interval  = find_scalar(text, 'evaluation_interval', 2)
scrape_timeout       = find_scalar(text, 'scrape_timeout', 2)
retention_time       = find_scalar(text, 'time', 6)
retention_size       = find_scalar(text, 'size', 6)

result = {
    'success':             True,
    'scrape_interval':     scrape_interval or '15s',
    'evaluation_interval': evaluation_interval or '15s',
    'scrape_timeout':      scrape_timeout or '10s',
    'retention_time':      retention_time or '15d',
    'retention_size':      retention_size or '100GB'
}
print(json.dumps(result))
PYEOF
)
                printf 'Content-Type: application/json\r\n\r\n'
                printf '%s' "$RESULT"
                ;;

            apache)
                A_HOSTNAME="prometheus"
                A_FQDN='${hostname}.${domain}'
                A_REDIRECT='https://${server_fqdn}/'
                A_PROXY_TO='https://127.0.0.1:9090/'
                if [ -f "$APACHE_CONF_AVAILABLE" ]; then
                    EXTRACTED_H=$(grep -m1 "^Define hostname " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define hostname[ ]*//')
                    EXTRACTED_F=$(grep -m1 "^Define server_fqdn " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define server_fqdn[ ]*//')
                    EXTRACTED_R=$(grep -m1 "^Define redirect_to " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define redirect_to[ ]*//')
                    EXTRACTED_P=$(grep -m1 "^Define proxy_to " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define proxy_to[ ]*//')
                    [ -n "$EXTRACTED_H" ] && A_HOSTNAME="$EXTRACTED_H"
                    [ -n "$EXTRACTED_F" ] && A_FQDN="$EXTRACTED_F"
                    [ -n "$EXTRACTED_R" ] && A_REDIRECT="$EXTRACTED_R"
                    [ -n "$EXTRACTED_P" ] && A_PROXY_TO="$EXTRACTED_P"
                fi

                export _A_HOSTNAME="$A_HOSTNAME" _A_FQDN="$A_FQDN" _A_REDIRECT="$A_REDIRECT" _A_PROXY_TO="$A_PROXY_TO"
                RESULT=$("$PYTHON" - << 'PYEOF'
import json, os
print(json.dumps({
    'success': True,
    'apache_hostname': os.environ.get('_A_HOSTNAME', 'prometheus'),
    'apache_fqdn': os.environ.get('_A_FQDN', '${hostname}.${domain}'),
    'apache_redirect_to': os.environ.get('_A_REDIRECT', 'https://${server_fqdn}/'),
    'apache_proxy_to': os.environ.get('_A_PROXY_TO', 'https://127.0.0.1:9090/')
}))
PYEOF
)
                printf 'Content-Type: application/json\r\n\r\n'
                printf '%s' "$RESULT"
                ;;

            node-exporter)
                NODE_EXPORTER_YML="${CFG_DIR}/jobs.d/node-exporter.yml"
                NODE_EXPORTER_D="${CFG_DIR}/jobs.d/node-exporter.d"
                NODE_EXPORTER_TARGETS="${NODE_EXPORTER_D}/prometheus.yml"
                export _NODE_EXPORTER_YML="$NODE_EXPORTER_YML" _NODE_EXPORTER_TARGETS="$NODE_EXPORTER_TARGETS"
                RESULT=$("$PYTHON" - << 'PYEOF'
import json, os, re

path         = os.environ.get('_NODE_EXPORTER_YML', '')
targets_path = os.environ.get('_NODE_EXPORTER_TARGETS', '')

try:
    with open(path) as f:
        text = f.read()
except Exception:
    text = ''

def find_scalar(text, key, indent):
    pattern = r'(?m)^' + (' ' * indent) + re.escape(key) + r':[ \t]*(\S+)'
    m = re.search(pattern, text)
    return m.group(1) if m else ''

metrics_path         = find_scalar(text, 'metrics_path', 4)
scheme               = find_scalar(text, 'scheme', 4)
insecure_skip_verify = find_scalar(text, 'insecure_skip_verify', 6)

# Parse targets from node-exporter.d/prometheus.yml
targets = []
try:
    with open(targets_path) as f:
        for line in f:
            m = re.match(r'^\s+-\s+"([^"]+)"', line)
            if m:
                targets.append(m.group(1))
except Exception:
    pass

print(json.dumps({
    'success':              True,
    'metrics_path':         metrics_path         or '/metrics',
    'scheme':               scheme               or 'http',
    'insecure_skip_verify': insecure_skip_verify or 'false',
    'targets':              targets
}))
PYEOF
)
                printf 'Content-Type: application/json\r\n\r\n'
                printf '%s' "$RESULT"
                ;;

            *)
                respond '{"success":true}'
                ;;
        esac
        ;;

    set)
        PYTHON=$(find_python)
        if [ -z "$PYTHON" ]; then
            respond '{"success":false,"error_code":500,"error_msg":"No python interpreter found"}'
            exit 0
        fi
        mkdir -p "$CFG_DIR"

        case "$TAB" in
            settings)
                LISTEN_V=$(get_param listen_address)
                TSDB_V=$(get_param storage_tsdb_path)
                CMDLINE_V=$(get_param cmdline_append)
                URL_OVERRIDE=$(get_param web_url_override)

                export _ENV_FILE="$ENV_FILE" _LISTEN="$LISTEN_V" _TSDB="$TSDB_V" \
                       _CMDLINE="$CMDLINE_V" _URL_OVERRIDE="$URL_OVERRIDE"

                "$PYTHON" - << 'PYEOF'
import os, re

path = os.environ.get('_ENV_FILE', '')

updates = {
    'LISTEN_ADDRESS':     os.environ.get('_LISTEN', '0.0.0.0:9090'),
    'STORAGE_TSDB_PATH':  os.environ.get('_TSDB', '/share/Configuration/prometheus/data'),
    'CMDLINE_APPEND':     os.environ.get('_CMDLINE', ''),
    'WEB_URL_OVERRIDE':   os.environ.get('_URL_OVERRIDE', ''),
}

try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    lines = []

seen = set()

def render(key, val):
    return '%s="%s"\n' % (key, val)

out = []
for line in lines:
    m = re.match(r'^\s*([A-Za-z0-9_]+)\s*=', line)
    if m and m.group(1) in updates:
        key = m.group(1)
        out.append(render(key, updates[key]))
        seen.add(key)
    else:
        out.append(line)

for key, val in updates.items():
    if key not in seen:
        if out and not out[-1].endswith('\n'):
            out[-1] = out[-1] + '\n'
        out.append(render(key, val))

with open(path, 'w') as f:
    f.writelines(out)
PYEOF
                chmod 640 "$ENV_FILE" 2>/dev/null

                respond '{"success":true}'
                ;;

            prometheus)
                SCRAPE_INTERVAL_V=$(get_param scrape_interval)
                EVAL_INTERVAL_V=$(get_param evaluation_interval)
                SCRAPE_TIMEOUT_V=$(get_param scrape_timeout)
                RETENTION_TIME_V=$(get_param retention_time)
                RETENTION_SIZE_V=$(get_param retention_size)

                export _PROMETHEUS_YML="$PROMETHEUS_YML" \
                       _SCRAPE_INTERVAL="$SCRAPE_INTERVAL_V" _EVAL_INTERVAL="$EVAL_INTERVAL_V" \
                       _SCRAPE_TIMEOUT="$SCRAPE_TIMEOUT_V" \
                       _RETENTION_TIME="$RETENTION_TIME_V" _RETENTION_SIZE="$RETENTION_SIZE_V"

                "$PYTHON" - << 'PYEOF'
import os, re

path = os.environ.get('_PROMETHEUS_YML', '')

scrape_interval     = os.environ.get('_SCRAPE_INTERVAL', '') or '15s'
evaluation_interval = os.environ.get('_EVAL_INTERVAL', '')   or '15s'
scrape_timeout      = os.environ.get('_SCRAPE_TIMEOUT', '')  or '10s'
retention_time      = os.environ.get('_RETENTION_TIME', '')  or '15d'
retention_size      = os.environ.get('_RETENTION_SIZE', '')  or '100GB'

try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    lines = []

def rewrite_scalar(lines, key, indent, value):
    prefix = ' ' * indent + key + ':'
    pattern = re.compile(r'^' + re.escape(prefix) + r'[ \t]*(\S+)(.*)$')
    out = []
    found = False
    for line in lines:
        m = pattern.match(line)
        if m:
            trailing = m.group(2).rstrip('\n')
            # Only preserve trailing text if it's a genuine YAML comment
            # (whitespace followed by '#'). Anything else is discarded so
            # stray leftover text can never be re-appended to the new value.
            stripped = trailing.strip()
            if not stripped.startswith('#'):
                trailing = ''
            out.append('%s %s%s\n' % (prefix, value, trailing))
            found = True
        else:
            out.append(line)
    return out, found

lines, _ = rewrite_scalar(lines, 'scrape_interval', 2, scrape_interval)
lines, _ = rewrite_scalar(lines, 'evaluation_interval', 2, evaluation_interval)
lines, _ = rewrite_scalar(lines, 'scrape_timeout', 2, scrape_timeout)
lines, _ = rewrite_scalar(lines, 'time', 6, retention_time)
lines, _ = rewrite_scalar(lines, 'size', 6, retention_size)

with open(path, 'w') as f:
    f.writelines(lines)
PYEOF
                chmod 640 "$PROMETHEUS_YML" 2>/dev/null

                respond '{"success":true}'
                ;;

            apache)
                APACHE_HOSTNAME=$(get_param apache_hostname)
                APACHE_FQDN=$(get_param apache_fqdn)
                APACHE_REDIRECT=$(get_param apache_redirect_to)
                APACHE_PROXY_TO=$(get_param apache_proxy_to)

                # Defaults if empty
                [ -z "$APACHE_HOSTNAME" ] && APACHE_HOSTNAME="prometheus"
                [ -z "$APACHE_FQDN" ] && APACHE_FQDN='${hostname}.${domain}'
                [ -z "$APACHE_REDIRECT" ] && APACHE_REDIRECT='https://${server_fqdn}/'
                [ -z "$APACHE_PROXY_TO" ] && APACHE_PROXY_TO='https://127.0.0.1:9090/'

                # If file doesn't exist yet, seed it from the template
                mkdir -p "$APACHE_SITES_AVAILABLE" 2>/dev/null
                if [ ! -f "$APACHE_CONF_AVAILABLE" ]; then
                    TEMPLATE="/usr/local/AppCentral/cappysan-prometheus/CONTROL/apache.conf"
                    if [ -f "$TEMPLATE" ]; then
                        cp "$TEMPLATE" "$APACHE_CONF_AVAILABLE"
                    fi
                fi

                # Only rewrite the four Define lines at the top
                export _A_HOSTNAME="$APACHE_HOSTNAME" _A_FQDN="$APACHE_FQDN" \
                       _A_REDIRECT="$APACHE_REDIRECT" _A_PROXY_TO="$APACHE_PROXY_TO" \
                       _CONF="$APACHE_CONF_AVAILABLE"
                "$PYTHON" - << 'PYEOF'
import os

path = os.environ.get('_CONF', '')
hostname = os.environ.get('_A_HOSTNAME', 'prometheus')
fqdn = os.environ.get('_A_FQDN', '${hostname}.${domain}')
redirect = os.environ.get('_A_REDIRECT', 'https://${server_fqdn}/')
proxy_to = os.environ.get('_A_PROXY_TO', 'https://127.0.0.1:9090/')

try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    lines = []

out = []
for line in lines:
    if line.startswith('Define hostname '):
        out.append('Define hostname    %s\n' % hostname)
    elif line.startswith('Define server_fqdn '):
        out.append('Define server_fqdn %s\n' % fqdn)
    elif line.startswith('Define redirect_to '):
        out.append('Define redirect_to %s\n' % redirect)
    elif line.startswith('Define proxy_to '):
        out.append('Define proxy_to %s\n' % proxy_to)
    else:
        out.append(line)

with open(path, 'w') as f:
    f.writelines(out)
PYEOF

                # Create symlink (relative path) so apache picks the site up.
                # Whether the site is actually active/served is handled by
                # the cappysan-apache package itself.
                mkdir -p "$APACHE_SITES_ENABLED" 2>/dev/null
                rm -f "$APACHE_CONF_ENABLED" 2>/dev/null
                ln -s ../sites-available/prometheus.conf "$APACHE_CONF_ENABLED" 2>/dev/null

                # Run apache reload
                APACHE_SCRIPT="/usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh"
                if [ ! -f "$APACHE_SCRIPT" ]; then
                    respond '{"success":true,"warning":"cappysan-apache package is not installed."}'
                elif ! "$APACHE_SCRIPT" reload >/dev/null 2>&1; then
                    respond '{"success":true,"warning":"Failed to reload cappysan-apache."}'
                else
                    respond '{"success":true}'
                fi
                ;;

            node-exporter)
                NODE_EXPORTER_YML="${CFG_DIR}/jobs.d/node-exporter.yml"
                NODE_EXPORTER_D="${CFG_DIR}/jobs.d/node-exporter.d"
                NODE_EXPORTER_TARGETS="${NODE_EXPORTER_D}/prometheus.yml"
                METRICS_PATH_V=$(get_param metrics_path)
                SCHEME_V=$(get_param scheme)
                INSECURE_SKIP_VERIFY_V=$(get_param insecure_skip_verify)
                TARGETS_V=$(get_param targets)

                [ -z "$METRICS_PATH_V" ]         && METRICS_PATH_V='/metrics'
                [ -z "$SCHEME_V" ]               && SCHEME_V='http'
                [ -z "$INSECURE_SKIP_VERIFY_V" ] && INSECURE_SKIP_VERIFY_V='false'

                mkdir -p "$NODE_EXPORTER_D" 2>/dev/null

                export _NODE_EXPORTER_YML="$NODE_EXPORTER_YML" \
                       _NODE_EXPORTER_TARGETS="$NODE_EXPORTER_TARGETS" \
                       _METRICS_PATH="$METRICS_PATH_V" \
                       _SCHEME="$SCHEME_V" \
                       _INSECURE_SKIP_VERIFY="$INSECURE_SKIP_VERIFY_V" \
                       _TARGETS="$TARGETS_V"
                "$PYTHON" - << 'PYEOF'
import os, re

path                 = os.environ.get('_NODE_EXPORTER_YML', '')
metrics_path         = os.environ.get('_METRICS_PATH', '/metrics')
scheme               = os.environ.get('_SCHEME', 'http')
insecure_skip_verify = os.environ.get('_INSECURE_SKIP_VERIFY', 'false')

try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    lines = []

def rewrite_scalar(lines, key, indent, value):
    prefix = ' ' * indent + key + ':'
    pattern = re.compile(r'^' + re.escape(prefix) + r'[ \t]*(\S+)(.*)$')
    out = []
    found = False
    for line in lines:
        m = pattern.match(line)
        if m:
            trailing = m.group(2).rstrip('\n')
            if not trailing.strip().startswith('#'):
                trailing = ''
            out.append('%s %s%s\n' % (prefix, value, trailing))
            found = True
        else:
            out.append(line)
    return out, found

lines, _ = rewrite_scalar(lines, 'metrics_path', 4, metrics_path)
lines, _ = rewrite_scalar(lines, 'scheme', 4, scheme)
lines, _ = rewrite_scalar(lines, 'insecure_skip_verify', 6, insecure_skip_verify)

with open(path, 'w') as f:
    f.writelines(lines)

targets_path = os.environ.get('_NODE_EXPORTER_TARGETS', '')
raw_targets  = os.environ.get('_TARGETS', '')
targets      = [t.strip() for t in raw_targets.split(',') if t.strip()]

out = ['---\n', '- targets:\n']
for t in targets:
    out.append('    - "%s"\n' % t)

with open(targets_path, 'w') as f:
    f.writelines(out)
PYEOF
                chmod 640 "$NODE_EXPORTER_YML" "$NODE_EXPORTER_TARGETS" 2>/dev/null

                respond '{"success":true}'
                ;;

            *)
                respond '{"success":true}'
                ;;
        esac
        ;;

    restart)
        /usr/local/AppCentral/cappysan-prometheus/CONTROL/start-stop.sh restart >/dev/null 2>&1 &
        respond '{"success":true}'
        ;;

    reload)
        /usr/local/AppCentral/cappysan-prometheus/CONTROL/start-stop.sh reload >/dev/null 2>&1 &
        respond '{"success":true}'
        ;;

    *)
        respond '{"success":false,"error_code":400,"error_msg":"Unknown action"}'
        ;;
esac
exit 0
