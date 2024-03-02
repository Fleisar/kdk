(function () {
    const DOM = {
        head: {
            title: () => document.querySelector('head>title'),
            icon: () => document.querySelector('head>link#icon'),
        },
        loadScreen: {
            root: () => document.querySelector('#app-ui>.loadScreen'),
            icon: () => document.querySelector('#app-ui>.loadScreen img'),
            title: () => document.querySelector('#app-ui>.loadScreen h1'),
            progress: () => document.querySelector('#app-ui>.loadScreen progress'),
        },
        updateModal: {
            versions: () => document.querySelectorAll('#app-ui>.window.updateRequest>span>a'),
            title: () => document.querySelector('#app-ui>.window.updateRequest>h3>a.name'),
            description: () => document.querySelector('#app-ui>.window.updateRequest>p'),
        }
    };
    const storage = window.storage;
    const {readyDOM} = window.utils;
    const app = {
        _naming: {
            config: 'appConfig',
        },
        _serviceWorker: 'sw.js',
        _defaultManifest: 'app.json',
        info: null,

        /**
         * Install new App using manifest
         * @param manifestName {string} Manifest URL
         * @param reload {boolean} If page reload needed
         */
        async install(manifestName = this._defaultManifest, reload = false) {
            const startInstalling = Date.now();
            const manifest = await fetch(manifestName).then((r) => r.json());

            if (manifest == null) {
                throw 'Error white fetching manifest';
            }

            this.ui.appendMedia(manifest);

            try {
                manifest.sources.forEach(({ url }) => {
                    storage.deleteFile(url);
                });
                await this._downloadAppSource(manifest.sources);
            } catch (e) {
                manifest.sources.forEach(({ url }) => {
                    storage.deleteFile(url);
                });
                console.error(e);
                throw `Failed to download source files. Installation aborted`;
            }

            this.uninstall(manifest.sources);

            this._saveManifest(manifest);

            if (reload) {
                window.location.reload();
            } else {
                this.run(true);
            }

            if (this.info.devMode) {
                const installDuration = Date.now() - startInstalling;
                console.info(`App installed for ${installDuration}ms`);
            }
        },

        /**
         * Save and apply new manifest
         * @param manifest {object}
         * @private
         */
        _saveManifest(manifest) {
            this.info = manifest;
            this._saveConfig();
        },

        /**
         * Download App's source files and store its
         * @param sources
         * @private
         */
        async _downloadAppSource(sources) {
            for (let i = 0; i < sources.length; i += 1) {
                const { url } = sources[i];
                const content = await fetch(url)
                    .then((r) => {
                        if (!r.ok) {
                            return null;
                        }
                        return r.text();
                    });

                if (content == null) {
                    throw `Error while fetching source file "${url}"`;
                }

                storage.createFile(url, content);
                this.progress(i + 1, sources.length);
            }
        },

        /**
         * Delete source files and clear saved manifest
         * @param excludeFiles {object[]}
         */
        uninstall(excludeFiles) {
            const excludeSet = new Set(excludeFiles.map(({ url }) => url));
            if (this.info != null) {
                this.info.sources.forEach(({ url }) => {
                    if (!excludeSet.has(url)) {
                        storage.deleteFile(url);
                    }
                });
            }

            this.info = null;
            localStorage.removeItem(this._naming.config);
        },

        /**
         * Run installed app
         * @param install
         */
        run(install = false) {
            this.info.sources.forEach((source) => {
                storage.prepareDOMNode(source.url, source.type);
            });

            readyDOM(() => {
                const meta = [];
                const appNameMeta = document.createElement('meta');
                appNameMeta.name = 'application-name';
                appNameMeta.content = this.info.application.name;
                meta.push(appNameMeta);
                if (this.info.application.manifest) {
                    const manifestMeta = document.createElement('link');
                    manifestMeta.rel = 'manifest';
                    manifestMeta.href = this.info.application.manifest;
                    meta.push(manifestMeta);
                }
                document.head.append(...meta);
                this.ui.appendMedia();

                if (this.info.timeout) {
                    setTimeout(this.loaded, Number(this.info.timeout));
                } else {
                    this.loaded();
                }
            });

            if (install && this.info.install != null) {
                eval(this.info.install);
            }
            if (this.info.running) {
                eval(this.info.running);
            }
        },

        /**
         * Controls head title
         * @param text {string?}
         * @return {string}
         */
        title(text) {
            if (text != null) {
                DOM.head.title().innerText = text;
            }

            return DOM.head.title().innerText;
        },

        /**
         * Controls head icon
         * @param url {string}
         * @param rel {string}
         */
        icon(url, rel = 'icon') {
            if (url != null) {
                DOM.head.icon().setAttribute('href', url);
                DOM.head.icon().setAttribute('rel', rel);
            }

            return DOM.head.icon().getAttribute('href');
        },

        /**
         * Controls load screen progress
         * @param value {number}
         * @param max {number?}
         */
        progress(value, max) {
            if (max != null) {
                DOM.loadScreen.progress().setAttribute('max', max);
            }
            DOM.loadScreen.progress().setAttribute('value', value);
        },

        /**
         * On load callback function
         */
        loaded() {
            readyDOM(() => {
                DOM.loadScreen.root().classList.add('fade');
            });
        },

        /**
         * Hide update message
         */
        skipUpdate() {
            this.info.update.release = Math.floor(Date.now() / 1e3);
        },

        chrome: {
            /**
             * Register service worker
             */
            sw() {
                if (!navigator.serviceWorker.controller) {
                    navigator.serviceWorker.register(app._serviceWorker)
                        .then((reg) => {
                            console.log('Service worker has been registered for scope:' + reg.scope);
                        });
                }
            }
        },
        ui: {
            /**
             * Display update dialog
             * @param manifest
             */
            updateDialog(manifest) {
                const [oldVersion, newVersion] = DOM.updateModal.versions();
                oldVersion.innerText = `${app.info.update.version} (${app.info.update.release})`;
                newVersion.innerText = `${manifest.update.version} (${manifest.update.release})`;
                DOM.updateModal.title().innerText = app.info.name;
                DOM.updateModal.description().innerHTML = manifest.update.description;
                this.window.open('updateRequest');
            },
            window: {
                current: null,
                select(name) {
                    return document.querySelector('#app-ui>.window.' + name);
                },
                open(name) {
                    if (this.current != null) {
                        this.close();
                    }
                    this.select(name).style.display = 'block';
                    this.current = name;
                },
                close() {
                    this.select(this.current).style.display = 'none';
                    this.current = null;
                }
            },
            appendMedia(manifest = app.info) {
                readyDOM(() => {
                    app.title(manifest.name);
                    DOM.loadScreen.title().innerText = manifest.name;
                    if (manifest.logo) {
                        DOM.loadScreen.icon().setAttribute('src', manifest.logo);
                    }
                    if (manifest.icon) {
                        app.icon(...manifest.icon);
                    }
                });
            }
        },

        /**
         * check new manifest for updates
         * @param manifestUri
         * @return {Promise<void>}
         */
        async checkUpdate(manifestUri = this._defaultManifest) {
            const manifest = await fetch(manifestUri).then((r) => r.json());
            if (manifest.update.release !== this.info.update.release) {
                this.ui.updateDialog(manifest);
            }
        },

        _init() {
            const appConfigData = localStorage.getItem(this._naming.config);
            let appConfig;
            try {
                appConfig = JSON.parse(appConfigData);
            } catch (e) {
                throw 'Error while reading app config';
            }

            this.info = appConfig;

            if (appConfig == null || this.info.devMode) {
                this.install();
            } else {
                this.run();

                if (this.info.updatePolicy === 'auto') {
                    this.checkUpdate();
                }
            }
        },
        _saveConfig() {
            const appConfigData = JSON.stringify(this.info);
            localStorage.setItem(this._naming.config, appConfigData);
        },
    }
    app._init();

    window.App = app;
})()
