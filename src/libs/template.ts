export class Template {
	private template: HTMLElement;

	constructor(templateName: string) {
		const template = document.getElementById(templateName);
		if (template == null) {
			throw new ReferenceError(`Template ${templateName} not found`);
		}
		this.template = template;
	}

	clone(data: Record<string, any> = {}) {
		if (typeof data !== 'object') {
			throw new SyntaxError('Data must be an object');
		}
		const copy = this.template.cloneNode(true) as HTMLTemplateElement;
		const { innerHTML } = copy;
		copy.innerHTML = innerHTML.replaceAll(
			/%([A-Za-z0-9-_]{1,})/g,
			(str, key) => {
				const replaced = data[key];
				if (replaced === undefined) {
					return str;
				}
				return typeof replaced === 'object'
					? JSON.stringify(replaced)
						.replaceAll('"', '&quot;')
					: replaced;
			},
		);
		return copy.content;
	}
}
