type BindEventHandler<TEvent extends string> = JQuery.TypeEventHandler<HTMLElement, undefined, HTMLElement, HTMLElement, TEvent>;

export class Bind<TEvent extends string> {
	private handlers: Set<BindEventHandler<TEvent>> = new Set();

	constructor(
		private selector: string,
		private action: TEvent
	) {
		this.update();
	}

	update() {
		const { handlers } = this;
		$(this.selector).on(this.action, function Fn(e) {
			handlers.forEach((f) => f.call(this, e));
		});
	}

	bind(func: BindEventHandler<TEvent>) {
		this.handlers.add(func);
	}

	unbind(func: BindEventHandler<TEvent>) {
		this.handlers.delete(func);
	}

	delete() {
		this.clear();
		$(this.selector).off(this.action);
	}

	clear() {
		this.handlers.clear();
	}
}
