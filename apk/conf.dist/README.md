#  Files

## env

Use this file to change the service parameters.

# Prometheus

## alerts.d

`alerts.d` holds yaml files that are used for alerts. One file per app/job is a good way to organize this folder.

## jobs.d

`jobs.d` holds the scrape configuration files. A subdirectory of the name of the app is used to add targets.

## rules.d

Enables writing rules.

## prometheus.yml

Enables changing the prometheus configuration.

## web.yml

Enables changing the web UI configuration.


# Apache

Symlink, or copy, in the apache configuration folders, the sites-available/pi-hole.conf to sites-enabled.
