/* global $ */

/**
 * @typedef HoverMenuEvents {'open' | 'click' | 'close'}
 */

/**
 * @typedef HoverMenuEventListener {(idOrEvent: number | PointerEvent) => void}
 */

/**
 * @typedef HoverMenuItem {{
 *   text: string,
 *   classes?: string[]
 *   style?: CSSProperties,
 *   action?: boolean,
 * }}
 */

/**
 * @typedef HoverMenuOptions {{
 *   style: CSSProperties,
 *   classes: string[]
 * }}
 */

/* eslint-disable-next-line no-unused-vars */
class HoverMenu {
    /**
     * @param selector {string}
     * @param menu {(string | HoverMenuItem)[]}
     * @param [options] {Partial<HoverMenuOptions>}
     */
    constructor(selector, menu, options = {}) {
        this.isOpen = false;
        /** @type {Record<HoverMenuEvents, Set<HoverMenuEventListener> | undefined>}  */
        this.listeners = {};
        this.rootSelector = selector;
        this.menuElement = HoverMenu.createMenu();
        this.outsideController = new AbortController();
        this.rootController = new AbortController();
        this.items = menu.map((item, index) => {
            const element = HoverMenu.createMenuItem(item);
            this.attachItemListener(element, item, index);

            this.menuElement.append(element);
            return element;
        });

        if (options.style != null) {
            Object.assign(this.menuElement, options.style);
        }
        if (options.classes != null) {
            this.menuElement.classList.add(...options.classes);
        }

        this.resizeListener();
        this.resizeObserver = new ResizeObserver(() => this.resizeListener());
        this.resizeObserver.observe(this.menuElement);
        this.resizeObserver.observe(document.body);
        this.outsideClickListener();
        this.updateSelector();
        document.body.append(this.menuElement);
        $(this.menuElement).hide();
    }

    /**
     * @param eventName {HoverMenuEvents}
     * @param callback {HoverMenuEventListener}
     */
    addEventListener(eventName, callback) {
        if (this.listeners[eventName] === undefined) {
            this.listeners[eventName] = new Set();
        }

        this.listeners[eventName].add(callback);
    }

    /**
     * @param eventName {HoverMenuEvents}
     * @param [callback] {HoverMenuEventListener}
     */
    removeEventListener(eventName, callback) {
        if (this.listeners[eventName] === undefined) {
            return;
        }

        if (callback == null) {
            this.listeners[eventName].delete(callback);
            return;
        }

        this.listeners[eventName].clear();
    }

    /**
     * @param eventName {HoverMenuEvents}
     * @param listenerArgs {Parameters<HoverMenuEventListener>}
     */
    fireEvent(eventName, ...listenerArgs) {
        const listeners = this.listeners[eventName];

        if (listeners == null) {
            return;
        }

        listeners.forEach((listener) => {
            listener(...listenerArgs);
        });
    }

    /**
     * @param event {MouseEvent}
     */
    open(event) {
        this.isOpen = true;
        this.updateMenuPosition(event.clientX, event.clientY);
        $(this.menuElement).show();
        this.fireEvent('open', event);
    }

    close() {
        this.isOpen = false;
        $(this.menuElement).hide();
        this.fireEvent('close');
    }

    /**
     * @returns {[[number, number], [number, number]]}
     */
    calcMenuBoundaries() {
        const menuWidth = $(this.menuElement).width();
        const menuHeight = $(this.menuElement).height();
        const windowWidth = $(document.body).width();
        const windowHeight = $(document.body).height();

        return [
            [0, windowWidth - menuWidth - 16],
            [0, windowHeight - menuHeight - 16],
        ];
    }

    resizeListener() {
        this.boundaries = this.calcMenuBoundaries();
        this.updateMenuPosition();
    }

    updateMenuPosition(x, y) {
        const { left, top } = $(this.menuElement).offset();

        $(this.menuElement).offset({
            left: window.utils.numberInRange(x != null ? x : left, ...this.boundaries[0]),
            top: window.utils.numberInRange(y != null ? y : top, ...this.boundaries[1]),
        });
    }

    /**
     * @param element {HTMLLIElement}
     * @param item {HoverMenuItem}
     * @param id {number}
     */
    attachItemListener(element, item, id) {
        element.addEventListener('click', () => {
            this.fireEvent('click', id);
            if (!item.action) {
                this.close();
            }
        });
    }

    updateSelector() {
        this.rootController.abort('Re-bind listeners');
        this.rootController = new AbortController();
        document.querySelectorAll(this.rootSelector).forEach((element) => {
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.open(e);
                return false;
            }, { signal: this.rootController.signal });
        });
    }

    outsideClickListener() {
        this.outsideController.abort('Re-bind listeners');
        this.outsideController = new AbortController();
        document.body.addEventListener('click', () => {
            this.close();
        }, { signal: this.outsideController.signal });
        this.menuElement.addEventListener('click', (e) => {
            e.stopPropagation();
        }, { signal: this.outsideController.signal });
    }

    static createMenu() {
        const ulElement = document.createElement('ul');
        ulElement.classList.add('ui-hovermenu');
        ulElement.id = `hover-menu__${Date.now()}`;

        return ulElement;
    }

    /**
     * @param desc {string | HoverMenuItem}
     */
    static createMenuItem(desc) {
        /** @type {HoverMenuItem} */
        const item = typeof desc === 'string' ? { text: desc } : desc;
        const liElement = document.createElement('li');
        liElement.innerHTML = item.text;
        if (item.classes != null) {
            liElement.classList.add(...item.classes);
        }

        return liElement;
    }
}
