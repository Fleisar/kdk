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
 *     listeners: Record<ContainerEvent, Set<ContainerListener>>;
 * }} ContainerType
 */

class ContainerManager {
    /** @type {JQuery<HTMLElement>} */
    #rootElement;

    /** @type {boolean} */
    #rootOpened = false;

    /** @type {boolean} */
    #alwaysOpen = false;

    /** @type {ContainerType | null} */
    #currentContainer = null;

    /** @type {Map<string, ContainerType>} */
    #containers = new Map();

    constructor(selector, alwaysOpen = false) {
        this.#rootElement = $(selector);
        this.#alwaysOpen = alwaysOpen;
    }

    get currentContainer() {
        return this.#currentContainer?.name;
    }

    /**
     * @param name {string}
     * @return ContainerType
     */
    get(name) {
        const container = this.#containers.get(name);
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
        if (name in this.#containers) {
            throw new Error(`Container with name "${name}" already exists`);
        }

        const element = $(selector);

        if (element.length !== 1) {
            throw new ReferenceError(`Element with selector "${name}" does not exist or more than one`);
        }

        this.#containers.set(name, {
            name,
            element,
            listeners: {},
        });
    }

    /**
     * @param name {string}
     * @param [data] {object}
     */
    open(name, data) {
        const container = this.get(name);
        if (this.#currentContainer != null) {
            this.close(undefined, false);
        } else {
            this.#openRootDOM();
        }
        this.#openContainerDOM(container);
        this.#currentContainer = container;
        this.#fireEvent(container, 'open', data);
    }

    /**
     * @param [data] {any}
     * @param closeContainer {boolean}
     */
    close(data, closeContainer = true) {
        if (this.#currentContainer != null) {
            this.#closeContainerDOM(this.#currentContainer);
            this.#fireEvent(this.#currentContainer, 'close', data);
            this.#currentContainer = null;
        }
        if (closeContainer && !this.#alwaysOpen) {
            this.#closeRootDOM();
            this.#rootOpened = false;
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
        return this.#fireEvent(container, eventType, data);
    }

    /**
     * @param container {ContainerType}
     * @param eventType {ContainerEvent}
     * @param [data] {any}
     */
    #fireEvent(container, eventType, data) {
        const listeners = container.listeners[eventType] ?? new Set();

        listeners.forEach((listener) => {
            listener(data);
        });
    }

    /**
     * @param container {ContainerType}
     */
    #openContainerDOM(container) {
        container.element.addClass('active');
    }

    /**
     * @param container {ContainerType}
     */
    #closeContainerDOM(container) {
        container.element.removeClass('active');
    }

    #openRootDOM() {
        this.#rootElement.addClass('use');
    }

    #closeRootDOM() {
        this.#rootElement.removeClass('use');
    }
}
