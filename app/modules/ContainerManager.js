/* global $ */

/**
 * @typedef {'open' | 'close' | string} ContainerEvent
 */

/**
 * @typedef {(data?: any) => void} ContainerListener
 */

/**
 * @typedef {{
 *     name: string;
 *     element: JQuery<HTMLElement>;
 *     listeners: Record<ContainerEvent, Set<ContainerListener> | undefined>;
 * }} ContainerType
 */

/* eslint-disable-next-line no-unused-vars */
class ContainerManager {
    constructor(selector, alwaysOpen = false) {
        this.rootElement = $(selector);
        this.alwaysOpen = alwaysOpen;
        /** @type {ContainerType | null} */
        this.container = null;
        /** @type {Map<string, ContainerType>} */
        this.containers = new Map();
    }

    get currentContainer() {
        if (this.container == null) {
            return null;
        }

        return this.container.name;
    }

    /**
     * @param name {string}
     * @return ContainerType
     */
    get(name) {
        const container = this.containers.get(name);
        if (container == null) {
            throw new ReferenceError(`Container with name "${name}" does not exist`);
        }
        return container;
    }

    /**
     * @param name {string}
     * @param selector {string}
     */
    register(name, selector) {
        if (name in this.containers) {
            throw new Error(`Container with name "${name}" already exists`);
        }

        const element = $(selector);

        if (element.length !== 1) {
            throw new ReferenceError(`Element with selector "${name}" does not exist or more than one`);
        }

        this.containers.set(name, {
            name,
            element,
            listeners: Object(),
        });
    }

    /**
     * @param name {string}
     * @param [data] {object}
     */
    open(name, data) {
        const container = this.get(name);
        if (this.container != null) {
            this.close(undefined, false);
        } else {
            this.openRootDOM();
        }
        ContainerManager.openContainerDOM(container);
        this.container = container;
        ContainerManager.genericFireEvent(container, 'open', data);
    }

    /**
     * @param [data] {any}
     * @param closeContainer {boolean}
     */
    close(data, closeContainer = true) {
        if (this.container != null) {
            ContainerManager.closeContainerDOM(this.container);
            ContainerManager.genericFireEvent(this.container, 'close', data);
            this.container = null;
        }
        if (closeContainer && !this.alwaysOpen) {
            this.closeRootDOM();
        }
    }

    /**
     * @param name {string}
     * @param eventType {ContainerEvent}
     * @param callback {ContainerListener}
     */
    addEventListener(name, eventType, callback) {
        const container = this.get(name);
        if (container.listeners[eventType] == null) {
            container.listeners[eventType] = new Set();
        }

        container.listeners[eventType].add(callback);
    }

    /**
     * @param name {string}
     * @param eventType {ContainerEvent}
     * @param callback {ContainerListener}
     */
    removeEventListener(name, eventType, callback) {
        const container = this.get(name);
        if (container.listeners[eventType] == null) {
            return;
        }

        container.listeners[eventType].delete(callback);
    }

    /**
     * @param name {string}
     * @param eventType {ContainerEvent}
     * @param [data] {any}
     */
    fireEvent(name, eventType, data) {
        const container = this.get(name);
        return ContainerManager.genericFireEvent(container, eventType, data);
    }

    /**
     * @param container {ContainerType}
     * @param eventType {ContainerEvent}
     * @param [data] {any}
     */
    static genericFireEvent(container, eventType, data) {
        const listeners = container.listeners[eventType] || new Set();

        listeners.forEach((listener) => {
            listener(data);
        });
    }

    /**
     * @param container {ContainerType}
     */
    static openContainerDOM(container) {
        container.element.addClass('active');
    }

    /**
     * @param container {ContainerType}
     */
    static closeContainerDOM(container) {
        container.element.removeClass('active');
    }

    openRootDOM() {
        this.rootElement.addClass('use');
    }

    closeRootDOM() {
        this.rootElement.removeClass('use');
    }
}
