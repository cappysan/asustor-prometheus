/* Copyright (c) 2026 Cappysan. All rights reserved. */

Ext.define('AS.ARC.apps.prometheus.core', {
    extend: 'Ext.util.Observable',

    apiUrl: AS.ARC.util.getUserAppsPath() + 'cappysan-prometheus/' + 'prometheus.cgi',

    constructor: function (config) {
        Ext.apply(this, config);
        this.callParent();
        this.init(config);
    },

    init: function () {
        var fn = this;

        fn.win = fn.desktop.createWindow({
            app:       fn.app,
            id:        fn.id,
            itemId:    fn.id,
            title:     '<div class="as-header" style="background-image:url(' + AS.ARC.util.fixDc('/apps/cappysan-prometheus/images/icon-app-task.png') + ');background-position:50%;background-repeat:no-repeat;"></div><div class="as-header-text">Prometheus</div>',

            width:     700,
            height:    500,
            minWidth:  700,
            minHeight: 500,
            resizable: true,
            border:    false,
            layout:    'fit',
            items:     [fn.getMainPanel()],
            listeners: {
                afterrender: function (win) {
                    win.header.items.items[1].hide();
                    fn.navGrid.getSelectionModel().select(0);
                }
            }
        });
    },

    getNavGrid: function () {
        var fn = this;

        fn.navGrid = Ext.create('Ext.grid.Panel', {
            itemId: 'navGrid',
            store: Ext.create('Ext.data.ArrayStore', {
                fields: ['title', 'tabId'],
                data: [
                    [_S('PROMETHEUS', 'TAB_SETTINGS'),      'settings'],
                    [_S('PROMETHEUS', 'TAB_PROMETHEUS'),    'prometheus'],
                    [_S('PROMETHEUS', 'TAB_APACHE'),        'apache'],
                    [_S('PROMETHEUS', 'TAB_NODE_EXPORTER'), 'node-exporter']
                ]
            }),
            hideHeaders: true,
            height:      '100%',
            border:      false,
            columns: [{
                flex:     1,
                renderer: function (v, metadata, record) {
                    var icons = {
                        settings:        AS.ARC.util.fixDc('/apps/cappysan-prometheus/images/icon-fn-settings.png'),
                        prometheus:      AS.ARC.util.fixDc('/apps/cappysan-prometheus/images/icon-fn-prometheus.png'),
                        apache:          AS.ARC.util.fixDc('/apps/cappysan-prometheus/images/icon-fn-apache.png'),
                        'node-exporter': AS.ARC.util.fixDc('/apps/cappysan-prometheus/images/icon-fn-node-exporter.png')
                    };
                    var iconUrl = icons[record.data.tabId] || icons.settings;
                    return '<div class="fn-block">' +
                           '<div class="fn-icon" style="background-image:url(' + iconUrl + ');background-repeat:no-repeat;background-position:center center;background-size:contain;"></div>' +
                           '<div class="fn-title" style="width:150px;opacity:1;">' + record.data.title + '</div>' +
                           '<div class="x-clear"></div>' +
                           '</div>';
                }
            }],
            listeners: {
                selectionchange: function (model, selections) {
                    if (selections.length > 0) {
                        fn.switchTab(selections[0].get('tabId'));
                    }
                }
            }
        });

        return fn.navGrid;
    },

    switchTab: function (tabId) {
        var fn        = this,
            cardPanel = fn.win.down('#cardPanel');

        fn.win.el.mask(_S('COMMON', 'LOADING'));

        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'get', tab: tabId }),
            method: 'post',
            success: function (json) {
                fn.win.el.unmask();
                cardPanel.removeAll();
                if (tabId === 'settings')      { fn.renderSettingsTab(cardPanel, json); }
                if (tabId === 'prometheus')    { fn.renderPrometheusTab(cardPanel, json); }
                if (tabId === 'apache')        { fn.renderApacheTab(cardPanel, json); }
                if (tabId === 'node-exporter') { fn.renderNodeExporterTab(cardPanel, json); }
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Settings tab ───────────────────────────────────────────────────── */
    renderSettingsTab: function (cardPanel, json) {
        var fn         = this,
            labelWidth = 160;

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-prometheus',
            border:     false,
            layout:     'anchor',
            autoScroll: true,
            defaults:   { anchor: '100%' },
            items: [{
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_LINK'),
                defaults: { anchor: '100%' },
                items: [{
                    xtype:  'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype:  'displayfield',
                        itemId: 'prometheusLink',
                        value:  (function () {
                            if (json.web_url_override) {
                                return '<a href="' + json.web_url_override + '" target="_blank">' + _S('PROMETHEUS', 'LINK_OPEN') + '</a>';
                            }

                            var apacheEnabled = json.apache_proxy_enabled === true || json.apache_proxy_enabled === 'true';

                            if (apacheEnabled) {
                                var fqdn = json.apache_fqdn || json.fqdn || json.hostname || 'localhost';
                                return '<a href="https://' + fqdn + '/" target="_blank">' + _S('PROMETHEUS', 'LINK_OPEN') + '</a>';
                            }

                            var port = '9090';
                            var host = json.gateway_ip || json.hostname || 'localhost';

                            if (json.listen_address) {
                                var parts = json.listen_address.match(/^(.+):(\d+)$/);
                                if (parts) {
                                    if (parts[1] !== '0.0.0.0') { host = parts[1]; }
                                    port = parts[2];
                                }
                            }

                            return '<a href="http://' + host + ':' + port + '/" target="_blank">' + _S('PROMETHEUS', 'LINK_OPEN') + '</a>';
                        })(),
                        margin: '0 10 0 0'
                    }, {
                        xtype:     'textfield',
                        itemId:    'prometheusLinkOverride',
                        emptyText: _S('PROMETHEUS', 'LINK_OVERRIDE_HINT'),
                        flex:      1,
                        value:     json.web_url_override || '',
                        listeners: {
                            change: function (field, newVal) {
                                var linkField = fn.win.down('#prometheusLink');
                                if (linkField) {
                                    if (newVal) {
                                        linkField.setValue('<a href="' + newVal + '" target="_blank">' + _S('PROMETHEUS', 'LINK_OPEN') + '</a>');
                                    }
                                }
                            }
                        }
                    }]
                }]
            }, {
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_INFORMATION'),
                defaults: { anchor: '100%' },
                items: [{
                    xtype:      'displayfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_TSDB_SIZE')),
                    labelWidth: labelWidth,
                    itemId:     'settingsTsdbSize',
                    anchor:     '100%',
                    value:      fn.formatBytes(json.tsdb_size_bytes)
                }]
            }, {
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_CONFIGURATION'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_LISTEN_ADDRESS')),
                    labelWidth: labelWidth,
                    itemId:     'settingsListenAddress',
                    anchor:     '100%',
                    emptyText:  '0.0.0.0:9090',
                    value:      json.listen_address || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_TSDB_PATH')),
                    labelWidth: labelWidth,
                    itemId:     'settingsTsdbPath',
                    anchor:     '100%',
                    emptyText:  '/share/Configuration/prometheus/data',
                    value:      json.storage_tsdb_path || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_CMDLINE_APPEND')),
                    labelWidth: labelWidth,
                    itemId:     'settingsCmdlineAppend',
                    anchor:     '100%',
                    emptyText:  '--log.level=warn',
                    value:      json.cmdline_append || ''
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('PROMETHEUS', 'BTN_RESTART'),
                        cls:     'prometheus-btn-white',
                        handler: function () { fn.restartDaemon(); }
                    },
                    {
                        xtype:   'button',
                        text:    _S('PROMETHEUS', 'BTN_RELOAD'),
                        cls:     'prometheus-btn-white',
                        handler: function () { fn.reloadDaemon(); }
                    },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.saveSettingsTab(); }
                    }
                ]
            }]
        }));
    },

    formatBytes: function (bytes) {
        bytes = Number(bytes) || 0;
        var mb = bytes / (1024 * 1024);
        if (mb >= 1024) {
            return (mb / 1024).toFixed(2) + ' GB';
        }
        return mb.toFixed(2) + ' MB';
    },

    saveSettingsTab: function () {
        var fn          = this,
            listenAddr  = fn.win.down('#settingsListenAddress'),
            tsdbPath    = fn.win.down('#settingsTsdbPath'),
            cmdline     = fn.win.down('#settingsCmdlineAppend'),
            urlOverride = fn.win.down('#prometheusLinkOverride');

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'settings' }),
            method: 'post',
            params: {
                listen_address:    listenAddr  ? (listenAddr.getValue() || '0.0.0.0:9090') : '0.0.0.0:9090',
                storage_tsdb_path: tsdbPath    ? (tsdbPath.getValue() || '/share/Configuration/prometheus/data') : '/share/Configuration/prometheus/data',
                cmdline_append:    cmdline     ? cmdline.getValue()     : '',
                web_url_override:  urlOverride ? urlOverride.getValue() : ''
            },
            success: function () {
                fn.win.el.unmask();
                fn.switchTab('settings');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    restartDaemon: function () {
        var fn = this;

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'restart' }),
            method: 'post',
            success: function () { fn.win.el.unmask(); },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    reloadDaemon: function () {
        var fn = this;

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'reload' }),
            method: 'post',
            success: function () { fn.win.el.unmask(); },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Prometheus tab ─────────────────────────────────────────────────── */
    renderPrometheusTab: function (cardPanel, json) {
        var fn         = this,
            labelWidth = 160;

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-prometheus',
            border:     false,
            layout:     'anchor',
            autoScroll: true,
            defaults:   { anchor: '100%' },
            items: [{
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_GLOBAL'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_SCRAPE_INTERVAL')),
                    labelWidth: labelWidth,
                    itemId:     'prometheusScrapeInterval',
                    anchor:     '100%',
                    emptyText:  '15s',
                    value:      json.scrape_interval || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_EVALUATION_INTERVAL')),
                    labelWidth: labelWidth,
                    itemId:     'prometheusEvaluationInterval',
                    anchor:     '100%',
                    emptyText:  '15s',
                    value:      json.evaluation_interval || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_SCRAPE_TIMEOUT')),
                    labelWidth: labelWidth,
                    itemId:     'prometheusScrapeTimeout',
                    anchor:     '100%',
                    emptyText:  '10s',
                    value:      json.scrape_timeout || ''
                }]
            }, {
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_STORAGE'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'textfield',
                    fieldLabel: 'retention.time',
                    labelWidth: labelWidth,
                    itemId:     'prometheusRetentionTime',
                    anchor:     '100%',
                    emptyText:  '15d',
                    value:      json.retention_time || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: 'retention.size',
                    labelWidth: labelWidth,
                    itemId:     'prometheusRetentionSize',
                    anchor:     '100%',
                    emptyText:  '100GB',
                    value:      json.retention_size || ''
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('PROMETHEUS', 'BTN_RESTART'),
                        cls:     'prometheus-btn-white',
                        handler: function () { fn.restartDaemon(); }
                    },
                    {
                        xtype:   'button',
                        text:    _S('PROMETHEUS', 'BTN_RELOAD'),
                        cls:     'prometheus-btn-white',
                        handler: function () { fn.reloadDaemon(); }
                    },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.savePrometheusTab(); }
                    }
                ]
            }]
        }));
    },

    savePrometheusTab: function () {
        var fn              = this,
            scrapeInterval   = fn.win.down('#prometheusScrapeInterval'),
            evalInterval     = fn.win.down('#prometheusEvaluationInterval'),
            scrapeTimeout    = fn.win.down('#prometheusScrapeTimeout'),
            retentionTime    = fn.win.down('#prometheusRetentionTime'),
            retentionSize    = fn.win.down('#prometheusRetentionSize');

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'prometheus' }),
            method: 'post',
            params: {
                scrape_interval:     scrapeInterval ? (scrapeInterval.getValue() || '15s') : '15s',
                evaluation_interval: evalInterval   ? (evalInterval.getValue()   || '15s') : '15s',
                scrape_timeout:      scrapeTimeout  ? (scrapeTimeout.getValue()  || '10s') : '10s',
                retention_time:      retentionTime  ? (retentionTime.getValue()  || '15d') : '15d',
                retention_size:      retentionSize  ? (retentionSize.getValue()  || '100GB') : '100GB'
            },
            success: function () {
                fn.win.el.unmask();
                fn.switchTab('prometheus');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Apache tab ──────────────────────────────────────────────────────── */
    renderApacheTab: function (cardPanel, json) {
        var fn = this;

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-prometheus',
            border:     false,
            layout:     'anchor',
            autoScroll: true,
            defaults:   { anchor: '100%' },
            items: [{
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_APACHE_SETTINGS'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype: 'displayfield',
                    value: _S('PROMETHEUS', 'NOTICE_HOSTS_PERSISTENCE')
                }, {
                    xtype: 'displayfield',
                    value: _S('PROMETHEUS', 'NOTICE_APACHE_SITES')
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PROMETHEUS', 'LABEL_APACHE_HOSTNAME'),
                    itemId:     'apacheHostname',
                    emptyText:  'prometheus',
                    value:      json.apache_hostname || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PROMETHEUS', 'LABEL_APACHE_FQDN'),
                    itemId:     'apacheFqdn',
                    emptyText:  '${hostname}.${domain}',
                    value:      json.apache_fqdn || ''
                }, {
                    xtype: 'displayfield',
                    value: _S('PROMETHEUS', 'LABEL_APACHE_PLACEHOLDERS')
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PROMETHEUS', 'LABEL_APACHE_REDIRECT'),
                    itemId:     'apacheRedirect',
                    emptyText:  'https://${server_fqdn}/',
                    value:      json.apache_redirect_to || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PROMETHEUS', 'LABEL_APACHE_PROXY_TO'),
                    itemId:     'apacheProxyTo',
                    emptyText:  'https://127.0.0.1:9090/',
                    value:      json.apache_proxy_to || ''
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.saveApacheTab(); }
                    }
                ]
            }]
        }));
    },

    saveApacheTab: function () {
        var fn       = this,
            hostname = fn.win.down('#apacheHostname'),
            fqdn     = fn.win.down('#apacheFqdn'),
            redirect = fn.win.down('#apacheRedirect'),
            proxyTo  = fn.win.down('#apacheProxyTo');

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'apache' }),
            method: 'post',
            params: {
                apache_hostname:      hostname ? hostname.getValue() : 'prometheus',
                apache_fqdn:          fqdn     ? fqdn.getValue()     : '${hostname}.${domain}',
                apache_redirect_to:   redirect ? redirect.getValue() : 'https://${server_fqdn}/',
                apache_proxy_to:      proxyTo  ? proxyTo.getValue()  : 'https://127.0.0.1:9090/'
            },
            success: function (json) {
                fn.win.el.unmask();
                if (json && json.warning) {
                    AS.ARC.msgWindow.show({ parentWin: fn.win, title: _S('COMMON', 'WARNING'), width: 400, height: 160, iconType: 'warn', asItems: [{ xtype: 'displayfield', value: json.warning }], fbar: [{ text: _S('COMMON', 'OK'), handler: function () { this.up('window').close(); } }] });
                }
                fn.switchTab('apache');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Node Exporter tab ──────────────────────────────────────────────── */
    renderNodeExporterTab: function (cardPanel, json) {
        var fn         = this,
            labelWidth = 200;

        var store = Ext.create('Ext.data.Store', {
            pageSize: 5,
            fields:   ['target'],
            data:     Ext.Array.map(json.targets || [], function (t) { return { target: t }; })
        });

        var grid = Ext.create('Ext.grid.Panel', {
            itemId:          'neTargetsGrid',
            store:           store,
            border:          false,
            sortableColumns: false,
            style: {
                border: '#BBB 1px solid'
            },
            columns: [{
                header:       _S('PROMETHEUS', 'COL_NE_TARGET'),
                dataIndex:    'target',
                menuDisabled: true,
                flex:         1
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'top',
                items: [{
                    text:    _S('PROMETHEUS', 'BTN_ADD'),
                    handler: function () { fn.showTargetPopup('add', null, store); }
                }, {
                    text:     _S('PROMETHEUS', 'BTN_MODIFY'),
                    itemId:   'neModifyBtn',
                    disabled: true,
                    handler: function () {
                        var sel = grid.getSelectionModel().getSelection();
                        if (sel.length) { fn.showTargetPopup('modify', sel[0], store); }
                    }
                }, {
                    text:     _S('PROMETHEUS', 'BTN_DELETE'),
                    itemId:   'neDeleteBtn',
                    disabled: true,
                    handler: function () {
                        var sel = grid.getSelectionModel().getSelection();
                        if (sel.length) { store.remove(sel); }
                    }
                }]
            }],
            bbar: Ext.create('AS.ARC.pagingToolbar', {
                store: store
            }),
            listeners: {
                selectionchange: function (model, sel) {
                    var has = sel.length > 0;
                    grid.down('#neModifyBtn').setDisabled(!has);
                    grid.down('#neDeleteBtn').setDisabled(!has);
                }
            }
        });

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-prometheus',
            border:     false,
            layout:     'anchor',
            autoScroll: true,
            defaults:   { anchor: '100%' },
            items: [{
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_NODE_EXPORTER_SETTINGS'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'displayfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_NE_JOB_NAME')),
                    labelWidth: labelWidth,
                    value:      'node-exporter'
                }, {
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_NE_METRICS_PATH')),
                    labelWidth: labelWidth,
                    itemId:     'neMetricsPath',
                    emptyText:  '/metrics',
                    value:      json.metrics_path || ''
                }, {
                    xtype:      'combobox',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_NE_SCHEME')),
                    labelWidth: labelWidth,
                    itemId:     'neScheme',
                    store:      ['http', 'https'],
                    editable:   false,
                    value:      json.scheme || 'http'
                }, {
                    xtype:      'combobox',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_NE_INSECURE_SKIP_VERIFY')),
                    labelWidth: labelWidth,
                    itemId:     'neInsecureSkipVerify',
                    store:      ['false', 'true'],
                    editable:   false,
                    value:      json.insecure_skip_verify || 'false'
                }]
            }, {
                xtype:    'fieldset',
                title:    _S('PROMETHEUS', 'SECTION_NODE_EXPORTER_TARGETS'),
                defaults: { anchor: '100%' },
                items:    [grid]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('PROMETHEUS', 'BTN_RELOAD'),
                        cls:     'prometheus-btn-white',
                        handler: function () { fn.reloadDaemon(); }
                    },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.saveNodeExporterTab(); }
                    }
                ]
            }]
        }));
    },

    showTargetPopup: function (mode, record, store) {
        var fn       = this,
            isModify = (mode === 'modify');

        fn.targetPopup = Ext.create('AS.ARC.msgWindow', {
            parentWin: fn.win,
            title:     isModify ? _S('PROMETHEUS', 'TITLE_MODIFY_TARGET') : _S('PROMETHEUS', 'TITLE_ADD_TARGET'),
            width:     550,
            height:    200,
            iconType:  'info',
            asItems: [{
                xtype:      'textfield',
                fieldLabel: AS.ARC.util.fontToBold(_S('PROMETHEUS', 'LABEL_NE_TARGET_HOST')),
                itemId:     'popupTarget',
                labelWidth: 60,
                style:      'width: auto;',
                emptyText:  _S('PROMETHEUS', 'HINT_NE_TARGET_HOST'),
                value:      isModify ? record.get('target') : ''
            }],
            fbar: [{
                text:    _S('COMMON', 'OK'),
                handler: function () {
                    var fld = fn.targetPopup.down('#popupTarget');
                    if (!fld) { return; }

                    var val = Ext.String.trim(fld.getValue());

                    if (!val || /^https?:\/\//i.test(val) || !/^[^:]+:\d+$/.test(val)) {
                        fld.markInvalid(_S('PROMETHEUS', 'ERR_TARGET_FORMAT'));
                        return;
                    }

                    if (isModify) {
                        record.set('target', val);
                    } else {
                        store.add({ target: val });
                    }
                    fn.targetPopup.close();
                }
            }, {
                text:    _S('COMMON', 'CANCEL'),
                handler: function () { fn.targetPopup.close(); }
            }]
        });

        fn.targetPopup.show();
    },

    saveNodeExporterTab: function () {
        var fn                 = this,
            metricsPath        = fn.win.down('#neMetricsPath'),
            scheme             = fn.win.down('#neScheme'),
            insecureSkipVerify = fn.win.down('#neInsecureSkipVerify'),
            grid               = fn.win.down('#neTargetsGrid');

        var targets = [];
        if (grid) {
            grid.getStore().each(function (rec) {
                var t = Ext.String.trim(rec.get('target'));
                if (t) { targets.push(t); }
            });
        }

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'node-exporter' }),
            method: 'post',
            params: {
                metrics_path:         metricsPath        ? (metricsPath.getValue()        || '/metrics') : '/metrics',
                scheme:               scheme             ? (scheme.getValue()             || 'http')     : 'http',
                insecure_skip_verify: insecureSkipVerify ? (insecureSkipVerify.getValue() || 'false')    : 'false',
                targets:              targets.join(',')
            },
            success: function () {
                fn.win.el.unmask();
                fn.switchTab('node-exporter');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Layout ─────────────────────────────────────────────────────────── */
    getMainPanel: function () {
        var fn = this;

        return Ext.create('Ext.panel.Panel', {
            itemId: 'main',
            border: false,
            layout: 'border',
            items: [{
                region: 'west',
                itemId: 'westPanel',
                cls:    'as-selector-panel',
                border: false,
                width:  170,
                layout: 'fit',
                items:  [fn.getNavGrid()]
            }, {
                region: 'center',
                xtype:  'panel',
                itemId: 'cardPanel',
                border: false,
                layout: 'fit'
            }]
        });
    }
});

Ext.define('AS.ARC.apps.prometheus.main', {
    extend:     'AS.ARC._appBase',
    appTag:     'cappysan-prometheus',
    title:      'Prometheus',
    appMaxNum:  1,
    appOpenNum: 0,
    appIsReady: true,
    appWins:    [],

    createWindow: function () {
        var desktop = this.core.getDesktop(),
            app     = this;

        if ((this.appOpenNum === this.appMaxNum) || !this.appIsReady) {
            this.appWins[0].show();
            return;
        }

        this.appIsReady = false;

        var prometheus = Ext.create('AS.ARC.apps.prometheus.core', {
            app:     this,
            desktop: desktop,
            id:      this.id + '-' + Ext.id()
        });

        prometheus.win.on('render', function () {
            app.appOpenNum++;
            app.appIsReady = true;
        });

        prometheus.win.on('beforeclose', function () {
            app.appOpenNum--;
            app.appIsReady = true;
            app.appWins.pop();
        });

        prometheus.win.show();
        this.appWins.push(prometheus.win);
        return prometheus.win;
    }
});
