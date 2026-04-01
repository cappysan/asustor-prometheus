
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
      - target_label: app
        replacement: prometheus
      - target_label: service
        replacement: prometheus
~~~

## Notes

- If several scape configs are present, it's possible to use the &instance_relabel anchor.

- The "app" label can serve several goals. It can be used as a variable/filter in grafana, or in alerts. Alerts are also often labeled with the prefix that is equal to the app variable.

- "service" serves a similar purpose. It corresponds to what service the app provides. For example, service is both "exporter" for node-exporter and blackbox-exporter, but the "app" values are different.
