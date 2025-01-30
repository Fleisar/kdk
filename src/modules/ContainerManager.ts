type ContainerEvent = 'close' | 'open';
type ContainerEventData = any;
type ContainerListener = (data?: ContainerEventData) => void;
interface ContainerType {
	name: string;
	element: JQuery;
	listeners: Record<ContainerEvent, Set<ContainerListener> | undefined>;
}

/* eslint-disable-next-line no-unused-vars */
export class ContainerManager {
	private rootElement: JQuery;
	private containers: Map<string, ContainerType> = new Map();
	container: ContainerType | null = null;

	constructor(
		selector: string,
		private alwaysOpen = false,
	) {
		this.rootElement = $(selector);
	}

	get currentContainer() {
		if (this.container == null) {
			return null;
		}

		return this.container.name;
	}

	static genericFireEvent(container: ContainerType, eventType: ContainerEvent, data?: ContainerEventData) {
		const listeners = container.listeners[eventType] || new Set();

		listeners.forEach((listener) => {
			listener(data);
		});
	}

	static openContainerDOM(container: ContainerType) {
		container.element.addClass('active');
	}

	static closeContainerDOM(container: ContainerType) {
		container.element.removeClass('active');
	}

	get(name: string) {
		const container = this.containers.get(name);
		if (container == null) {
			throw new ReferenceError(`Container with name "${name}" does not exist`);
		}
		return container;
	}

	register(name: string, selector: string) {
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

	open(name: string, data?: ContainerEventData) {
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

	close(data?: ContainerEventData, closeContainer = true) {
		if (this.container != null) {
			ContainerManager.closeContainerDOM(this.container);
			ContainerManager.genericFireEvent(this.container, 'close', data);
			this.container = null;
		}
		if (closeContainer && !this.alwaysOpen) {
			this.closeRootDOM();
		}
	}

	addEventListener(name: string, eventType: ContainerEvent, callback: ContainerListener) {
		const container = this.get(name);
		if (container.listeners[eventType] == null) {
			container.listeners[eventType] = new Set();
		}

		container.listeners[eventType].add(callback);
	}

	removeEventListener(name: string, eventType: ContainerEvent, callback: ContainerListener) {
		const container = this.get(name);
		if (container.listeners[eventType] == null) {
			return;
		}

		container.listeners[eventType].delete(callback);
	}

	fireEvent(name: string, eventType: ContainerEvent, data: ContainerEventData) {
		const container = this.get(name);
		return ContainerManager.genericFireEvent(container, eventType, data);
	}

	openRootDOM() {
		this.rootElement.addClass('use');
	}

	closeRootDOM() {
		this.rootElement.removeClass('use');
	}
}
