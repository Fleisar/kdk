(() => {
	const readyDOM = (func) => {
		if (document.readyState === 'loading') {
			document.addEventListener('readystatechange', func, { once: true });
		} else {
			func();
		}
	};

	const numberInRange = (number, min, max) => {
		if (number < min) {
			return min;
		}
		if (number > max) {
			return max;
		}
		return number;
	};

	window.utils = {
		readyDOM,
		numberInRange,
	};
})();
