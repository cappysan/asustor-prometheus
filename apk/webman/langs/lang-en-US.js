/* _AS_STRINGS */
_AS_STRINGS = {};

/*PROMETHEUS*/
_AS_STRINGS.PROMETHEUS = {};
_AS_STRINGS.PROMETHEUS.APP_TITLE        = 'Prometheus';
_AS_STRINGS.PROMETHEUS.TAB_SETTINGS     = 'Settings';
_AS_STRINGS.PROMETHEUS.TAB_PROMETHEUS   = 'Prometheus';
_AS_STRINGS.PROMETHEUS.TAB_APACHE       = 'Apache';
_AS_STRINGS.PROMETHEUS.SECTION_LINK     = 'Link';
_AS_STRINGS.PROMETHEUS.SECTION_INFORMATION  = 'Information';
_AS_STRINGS.PROMETHEUS.SECTION_CONFIGURATION = 'Configuration';
_AS_STRINGS.PROMETHEUS.SECTION_GLOBAL   = 'Global';
_AS_STRINGS.PROMETHEUS.SECTION_STORAGE  = 'Storage';
_AS_STRINGS.PROMETHEUS.SECTION_APACHE_SETTINGS = 'Settings';
_AS_STRINGS.PROMETHEUS.LABEL_LISTEN_ADDRESS  = 'Listen address';
_AS_STRINGS.PROMETHEUS.LABEL_TSDB_SIZE       = 'TSDB size';
_AS_STRINGS.PROMETHEUS.LABEL_TSDB_PATH       = 'Storage path';
_AS_STRINGS.PROMETHEUS.LABEL_CMDLINE_APPEND  = 'Extra command line flags';
_AS_STRINGS.PROMETHEUS.LABEL_SCRAPE_INTERVAL     = 'scrape_interval';
_AS_STRINGS.PROMETHEUS.LABEL_EVALUATION_INTERVAL = 'evaluation_interval';
_AS_STRINGS.PROMETHEUS.LABEL_SCRAPE_TIMEOUT      = 'scrape_timeout';
_AS_STRINGS.PROMETHEUS.LINK_OPEN        = 'Open Prometheus web interface';
_AS_STRINGS.PROMETHEUS.LINK_OVERRIDE_HINT = 'Custom URL override';
_AS_STRINGS.PROMETHEUS.BTN_RESTART      = 'Restart';
_AS_STRINGS.PROMETHEUS.BTN_RELOAD       = 'Reload';

/* Apache tab */
_AS_STRINGS.PROMETHEUS.NOTICE_HOSTS_PERSISTENCE = '<strong>Notice:</strong> /etc/hosts entries can be configured with the cappysan-persistence package.';
_AS_STRINGS.PROMETHEUS.NOTICE_APACHE_SITES = '<strong>Notice:</strong> Apache sites can be configured with the cappysan-apache package.';
_AS_STRINGS.PROMETHEUS.APACHE_NOT_IMPLEMENTED = 'Apache configuration is not available. This feature requires the cappysan-apache package.';
_AS_STRINGS.PROMETHEUS.LABEL_APACHE_HOSTNAME = 'Hostname';
_AS_STRINGS.PROMETHEUS.LABEL_APACHE_FQDN = 'Server FQDN';
_AS_STRINGS.PROMETHEUS.LABEL_APACHE_PLACEHOLDERS = 'Available placeholders: ${hostname}, ${domain}';
_AS_STRINGS.PROMETHEUS.LABEL_APACHE_REDIRECT = 'HTTP redirection';
_AS_STRINGS.PROMETHEUS.LABEL_APACHE_PROXY_TO = 'HTTPS proxy';

/* Node Exporter tab */
_AS_STRINGS.PROMETHEUS.TAB_NODE_EXPORTER              = 'node-exporter';
_AS_STRINGS.PROMETHEUS.SECTION_NODE_EXPORTER_SETTINGS = 'Settings';
_AS_STRINGS.PROMETHEUS.SECTION_NODE_EXPORTER_TARGETS  = 'Targets';
_AS_STRINGS.PROMETHEUS.LABEL_NE_JOB_NAME              = 'job_name';
_AS_STRINGS.PROMETHEUS.LABEL_NE_METRICS_PATH          = 'metrics_path';
_AS_STRINGS.PROMETHEUS.LABEL_NE_SCHEME                = 'scheme';
_AS_STRINGS.PROMETHEUS.LABEL_NE_INSECURE_SKIP_VERIFY  = 'tls_config.insecure_skip_verify';
_AS_STRINGS.PROMETHEUS.COL_NE_TARGET                  = 'Target';
_AS_STRINGS.PROMETHEUS.BTN_ADD                        = 'Add';
_AS_STRINGS.PROMETHEUS.BTN_MODIFY                     = 'Modify';
_AS_STRINGS.PROMETHEUS.BTN_DELETE                     = 'Delete';
_AS_STRINGS.PROMETHEUS.TITLE_ADD_TARGET               = 'Add Target';
_AS_STRINGS.PROMETHEUS.TITLE_MODIFY_TARGET            = 'Modify Target';
_AS_STRINGS.PROMETHEUS.LABEL_NE_TARGET_HOST           = 'Target';
_AS_STRINGS.PROMETHEUS.HINT_NE_TARGET_HOST            = 'hostname:port (e.g. nas.example.com:9100)';
_AS_STRINGS.PROMETHEUS.ERR_TARGET_FORMAT              = 'Enter a valid target: hostname:port (no http:// prefix)';
