export function readyDOM(callback: () => void) {
	if (document.readyState === 'loading') {
		document.addEventListener('readystatechange', callback, {once: true});
	} else {
		callback();
	}
}
