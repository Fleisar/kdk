type URIData = Record<string, unknown>;
type URIEventHandler = (data: URIData) => void;

export class URI {
	private listeners: Set<URIEventHandler> = new Set();
	address = location.href.split('#')[1];
	page: URIData = {};

	constructor(url: string, data: URIData = {}) {
		this.attachWindowListener();

		this.onRedirect((d) => {
			this.page = d;
			this.address = location.href.split('#')[1];
		});

		if (location.hash.length <= 2) {
			this.set(url, data);
		} else {
			this.call({});
		}
	}

	private attachWindowListener() {
		window.addEventListener('popstate', (e) => {
			this.call(e.state);
		});
	}

	set(url: string, data: URIData = {}) {
		window.history.pushState(data, '', url);
		this.call(data);
	}

	private call(data: URIData) {
		this.listeners.forEach((f) => f(data));
	}

	onRedirect(callback: URIEventHandler) {
		this.listeners.add(callback);
	}

	off(callback: URIEventHandler) {
		this.listeners.delete(callback);
	}
}
