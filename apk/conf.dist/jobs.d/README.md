
## Scrape Jobs

Sample "full" configuration:

~~~bash
---
scrape_configs:
  - job_name: "XXX"
    metrics_path: /metrics
    scheme: https
    basic_auth:
      username: 'prometheus'
      password: 'XXX'
    tls_config:
      insecure_skip_verify: true
    file_sd_configs:
      - files:
        - "file_sd_configs.d/prometheus.yml"
    relabel_configs: &instance_relabel
      - source_labels: [__address__]
        target_label: instance
        regex: "([^:]+)(:[0-9]+)?"
        replacement: "${1}"
~~~

## Labels

The "app" label represents the app being monitored.

The "service" label is the type of service monitored, the service provided by an app.

For example, both Apache and Nginx would have a different "app" label (respectively "apache" and "nginx") but the same service ("http").

Most services are only provided by a single app. For example, only Grafana (the app) serves the "grafana" service.