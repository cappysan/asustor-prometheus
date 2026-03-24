
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

## Targets
