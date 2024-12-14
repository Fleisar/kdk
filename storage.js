(function () {
    const {readyDOM} = window.utils;
    const storage = {
        _prefix: 'storage-',
        _naming: {
            indexes: 'storageIndexes',
        },
        _version: 2,
        _sizeLimit: 1e6,
        _selfCheck: true,
        _autoSave: true,
        _canOverwrite: true,
        _saveTimeout: 5e3,

        _storage: new Map(),
        _saveQueue: null,

        /**
         * Create file record in storage
         * @param name {string} Name of the file
         * @param content {string} Should be limited by size limit (1000000 by default)
         * */
        createFile(name, content) {
            const storageName = `${this._prefix}${this._storage.size}`;

            if (content.length > this._sizeLimit) {
                throw `File content length must be less ${this._sizeLimit}`;
            }

            if (this._canOverwrite || !this._storage.has(name)) {
                localStorage.setItem(storageName, content);
            } else {
                throw `File with name "${name}" is already exists`;
            }

            if (this._selfCheck && localStorage.getItem(storageName) == null) {
                throw `Error white writing "${name}" in storage`;
            } else {
                this._storage.set(name, storageName);
            }

            if (this._autoSave) {
                this.saveIndexes();
            }
        },

        /**
         * Delete file record from storage
         * @param name {string} Name of the file
         */
        deleteFile(name) {
            const storageName = this._storage.get(name);
            if (storageName != null) {
                localStorage.removeItem(storageName);
            } else {
                return;
            }

            if (this._selfCheck && localStorage.getItem(storageName) != null) {
                throw `Error white erasing "${name}" from storage`;
            } else {
                this._storage.delete(name);
            }

            if (this._autoSave) {
                this.saveIndexes();
            }
        },

        /**
         * Returns file content if it's exist
         * @param name {string}
         */
        get(name) {
            const storageName = this._storage.get(name);
            if (storageName == null) {
                return null;
            }

            const content = localStorage.getItem(storageName);

            if (this._selfCheck && content == null) {
                throw new ReferenceError(`Error while reading "${name}" from storage`);
            }

            return content;
        },

        /**
         * Generate DOM Node for embedding
         * @param name {string}
         * @param type {string}
         */
        prepareDOMNode(name, type) {
            const content = this.get(name);
            let blob, element;

            switch (type) {
                case 'script': {
                    blob = new Blob([content], {type: 'text/javascript'});
                    element = document.createElement('script');
                    element.src = URL.createObjectURL(blob);
                    element.dataset.name = name;

                    readyDOM(() => {
                        document.head.appendChild(element);
                    });
                    break;
                }
                case 'style': {
                    blob = new Blob([content], {type: 'text/css'});
                    element = document.createElement('link');
                    element.href = URL.createObjectURL(blob);
                    element.rel = 'stylesheet';
                    element.dataset.name = name;

                    readyDOM(() => {
                        document.head.appendChild(element);
                    });
                    break;
                }
                case 'html':
                default: {
                    element = document.createElement('div');
                    element.dataset.name = name;
                    element.innerHTML = content;

                    readyDOM(() => {
                        document.body.appendChild(element);
                    });
                    break;
                }
            }
        },

        /**
         * @param name {string}
         * @return {boolean}
         */
        isExists(name) {
            return this._storage.has(name);
        },

        /**
         * Load storage indexes
         * @private
         */
        _loadIndexes() {
            const storageIndexesJSON = localStorage.getItem(this._naming.indexes);
            let storageIndexes;

            try {
                storageIndexes = Object.entries(JSON.parse(storageIndexesJSON ?? '{}'));
            } catch (e) {
                throw `Error while reading storage config`;
            }

            if (storageIndexes == null) {
                return;
            }

            this._storage = new Map(storageIndexes);
        },

        /**
         * Save storage indexes with queue delay
         */
        saveIndexes(timeout = this._saveTimeout) {
            if (this._saveQueue != null) {
                return;
            }

            const timeoutFn = () => {
                this._saveQueue = null;
                this._saveIndexes();
            }

            setTimeout(timeoutFn, timeout);
        },

        /**
         * Save storage indexes
         */
        _saveIndexes() {
            const indexObject = Object.fromEntries(this._storage.entries());
            const json = JSON.stringify(indexObject);

            localStorage.setItem(this._naming.indexes, json);
        },

        /**
         * Check storage indexes
         * @return {string[]}
         * @private
         */
        _checkIndexes() {
            const failed = [];
            for (const [name, storageName] of this._storage.entries()) {
                if (localStorage.getItem(storageName) == null) {
                    failed.push(name);
                }
            }

            return failed;
        },
    }
    storage._loadIndexes();
    window.addEventListener('beforeunload', storage._saveIndexes.bind(storage));

    window.storage = storage;
})()
