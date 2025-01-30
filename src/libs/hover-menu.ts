import { numberInRange } from "../shared/lib";

type HoverMenuEvents = 'open' | 'click' | 'close';
type HoverMenuEventListener = (idOrEvent?: number | PointerEvent) => void;
type HoverMenuItem = {
	text: string,
	classes?: string[],
	style?: CSSStyleDeclaration,
	action?: boolean,
}
type HoverMenuOptions = {
	style: CSSStyleDeclaration,
	classes: string[],
}

/* eslint-disable-next-line no-unused-vars */
export class HoverMenu {
	private listeners: Record<HoverMenuEvents | string, Set<HoverMenuEventListener> | undefined> = {};
	private rootSelector: string;
	private readonly menuElement: HTMLElement;
	private outsideController: AbortController;
	private rootController: AbortController;
	private resizeObserver: ResizeObserver;
	private boundaries: ReturnType<HoverMenu['calcMenuBoundaries']>;

	constructor(selector: string, menu: (string | HoverMenuItem)[], options: Partial<HoverMenuOptions> = {}) {
		this.rootSelector = selector;
		this.menuElement = HoverMenu.createMenu();
		this.outsideController = new AbortController();
		this.rootController = new AbortController();
		menu.forEach((item, index) => {
			const element = HoverMenu.createMenuItem(item);
			this.attachItemListener(
				element,
				index,
				typeof item === 'string' ? true : item.action,
			);

			this.menuElement.append(element);
		});

		if (options.style != null) {
			Object.assign(this.menuElement, options.style);
		}
		if (options.classes != null) {
			this.menuElement.classList.add(...options.classes);
		}

		this.boundaries = this.calcMenuBoundaries();
		this.resizeObserver = new ResizeObserver(() => this.resizeListener());
		this.resizeObserver.observe(this.menuElement);
		this.resizeObserver.observe(document.body);
		this.outsideClickListener();
		this.updateSelector();
		document.body.append(this.menuElement);
		$(this.menuElement)
			.hide();
	}

	static createMenu() {
		const ulElement = document.createElement('ul');
		ulElement.classList.add('ui-hovermenu');
		ulElement.id = `hover-menu__${Date.now()}`;

		return ulElement;
	}

	static createMenuItem(desc: string | HoverMenuItem) {
		const item = typeof desc === 'string' ? { text: desc } : desc;
		const liElement = document.createElement('li');
		liElement.innerHTML = item.text;
		if (item.classes != null) {
			liElement.classList.add(...item.classes);
		}

		return liElement;
	}

	addEventListener(eventName: HoverMenuEvents, callback: HoverMenuEventListener) {
		if (this.listeners[eventName] === undefined) {
			this.listeners[eventName] = new Set();
		}

		this.listeners[eventName].add(callback);
	}

	removeEventListener(eventName: HoverMenuEvents, callback?: HoverMenuEventListener) {
		if (this.listeners[eventName] === undefined) {
			return;
		}

		if (callback != null) {
			this.listeners[eventName].delete(callback);
			return;
		}

		this.listeners[eventName].clear();
	}

	fireEvent(eventName: HoverMenuEvents, ...listenerArgs: Parameters<HoverMenuEventListener>) {
		const listeners = this.listeners[eventName];

		if (listeners == null) {
			return;
		}

		listeners.forEach((listener) => {
			listener(...listenerArgs);
		});
	}

	open(event: PointerEvent) {
		this.updateMenuPosition(event.clientX, event.clientY);
		$(this.menuElement).show();
		this.fireEvent('open', event);
	}

	close() {
		$(this.menuElement).hide();
		this.fireEvent('close');
	}

	calcMenuBoundaries() {
		const menuWidth = $(this.menuElement).width() ?? 0;
		const menuHeight = $(this.menuElement).height() ?? 0;
		const windowWidth = $(document.body).width() ?? 0;
		const windowHeight = $(document.body).height() ?? 0;

		return [
			[0, windowWidth - menuWidth - 16],
			[0, windowHeight - menuHeight - 16],
		] as const;
	}

	resizeListener() {
		this.boundaries = this.calcMenuBoundaries();
		this.updateMenuPosition();
	}

	updateMenuPosition(x?: number, y?: number) {
		const {
			left,
			top,
		} = $(this.menuElement).offset() ?? { left: 0, top: 0 };

		$(this.menuElement).offset({
			left: numberInRange(x != null ? x : left, ...this.boundaries[0]),
			top: numberInRange(y != null ? y : top, ...this.boundaries[1]),
		});
	}

	attachItemListener(element: HTMLLIElement, id: number, canClose: boolean = true) {
		element.addEventListener('click', () => {
			this.fireEvent('click', id);
			if (canClose) {
				this.close();
			}
		});
	}

	updateSelector() {
		this.rootController.abort('Re-bind listeners');
		this.rootController = new AbortController();
		document.querySelectorAll(this.rootSelector)
			.forEach((element) => {
				element.addEventListener('contextmenu', (e) => {
					e.preventDefault();
					this.open(e as PointerEvent);
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
}
