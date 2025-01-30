type ConfigCollectorEvents = 'update';
type ConfigCollectorConfig = Record<any, any>;
type ConfigCollectorHandler<
	TConfig extends ConfigCollectorConfig
> = <TKey extends keyof TConfig>(key: TKey, value?: TConfig[TKey]) => void;

interface ConfigCollectorOptions<
	TConfig extends ConfigCollectorConfig = ConfigCollectorConfig
> {
	class: string;
	config: Partial<TConfig>;
}

export class ConfigCollector<
	TConfig extends ConfigCollectorConfig = ConfigCollectorConfig
> {
	private listeners: Map<ConfigCollectorEvents, Set<ConfigCollectorHandler<TConfig>>> = new Map();
	private configStore: Partial<TConfig>;

	constructor(options: Partial<ConfigCollectorOptions<TConfig>> = {}) {
		const {
			class: className = 'config-collector',
			config = {},
		} = options;

		this.configStore = config;
	}

	addEventListener(eventName: ConfigCollectorEvents, handler: ConfigCollectorHandler<TConfig>) {
		if (!this.listeners.has(eventName)) {
			this.listeners.set(eventName, new Set());
		}
		this.listeners.get(eventName)!.add(handler);

		return handler;
	}

	removeEventListener(eventName: ConfigCollectorEvents, handler?: ConfigCollectorHandler<TConfig>) {
		if (!this.listeners.has(eventName)) {
			return;
		}

		if (handler == null) {
			this.listeners.delete(eventName);
		} else {
			this.listeners.get(eventName)!.delete(handler);
		}
	}

	fireEvent(eventName: ConfigCollectorEvents, name: keyof TConfig) {
		this.listeners.get(eventName)?.forEach((handler) => {
			handler(name, this.configStore[name]);
		});
	}

	getValue<TKey extends keyof TConfig>(name: TKey): TConfig[TKey] | undefined {
		return this.configStore[name];
	}

	setValue<TKey extends keyof TConfig>(name: TKey, value: TConfig[TKey]) {
		this.configStore[name] = value;

		this.fireEvent('update', name);
	}

	private attachChangeListener(selector: string) {
		document.querySelectorAll(selector).forEach((element) => {
			element.addEventListener('change', () => this.handleElementChange(element));
			this.handleElementChange(element);
		});
	}

	private handleElementChange(element: Element) {
		const name: keyof TConfig = ConfigCollector.getElementName(element);
		const value = ConfigCollector.getElementState(element);

		this.setValue(name, value as TConfig[typeof name]);
	}

	static getElementName(element: Element) {
		// TODO: use dataset instead
		return (element as Element & { name: string}).name;
	}

	static getElementState(element: Element) {
		switch (element.tagName.toLowerCase()) {
			case 'input': {
				const inputElement = element as HTMLInputElement;
				if (inputElement.type === 'checkbox') {
					return inputElement.checked;
				}
				return inputElement.value;
			}
			case 'select': {
				const selectElement = element as HTMLSelectElement;
				return selectElement.value;
			}
			default: {
				throw new SyntaxError(
					'Unable to get element\'s state, extend getElementState to support this element'
				);
			}
		}
	}

	private async loadFromExternalStore() {
		let rawData = localStorage.getItem('configCollector');

		if (rawData == null) {
			return null;
		}

		return JSON.parse(rawData);
	}
}
