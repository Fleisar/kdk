/**
 * @typedef {object & { id: string | number }} Data
 * */

/* eslint-disable-next-line no-unused-vars */
class ListStorage {
    /**
     * @param name {string}
     */
    constructor(name) {
        this.name = name;
        /** @type {Map<string | number, Data>} */
        this.map = new Map();
        if (name == null || typeof name !== 'string') {
            throw new SyntaxError('name must be a string');
        }

        const rawList = localStorage.getItem(name);
        if (rawList != null) {
            let list = {};
            try {
                list = JSON.parse(rawList);
            } catch (e) {
                throw new SyntaxError(`Entry "${name}" corrupted. More description below:${e}`);
            }
            this.map = new Map(Object.entries(list));
        }
    }

    /**
     * @param data {Data}
     */
    push(data) {
        if (!['number', 'string'].includes(typeof data.id)) {
            throw new SyntaxError('data must include id type of string or number');
        }
        this.map.set(data.id, data);
        this.save();
    }

    /**
     * @param id {number | string}
     * @return {boolean}
     */
    has(id) {
        return this.map.has(id.toString());
    }

    /**
     * @param [id] {number | string}
     * @return {Data[] | Data | undefined}
     */
    get(id) {
        if (id == null) {
            return Array.from(this.map.values());
        }

        return this.map.get(id.toString());
    }

    /**
     * @param id {string | number}
     * @param data {Data}
     */
    set(id, data) {
        if (!this.map.has(id.toString())) {
            throw new SyntaxError(`entry with id "${id}" not found`);
        }
        this.map.set(id.toString(), data);
        this.save();
    }

    /**
     * @param id {string | number}
     */
    delete(id) {
        this.map.delete(id.toString());
        this.save();
    }

    save() {
        const list = Object.fromEntries(this.map);
        const rawList = JSON.stringify(list);
        localStorage.setItem(this.name, rawList);
    }
}
