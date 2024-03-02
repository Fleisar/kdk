(() => {
    const readyDOM = (func) => {
        if (document.readyState === 'loading') {
            document.addEventListener('readystatechange', func, { once: true });
        } else {
            func();
        }
    };

    window.utils = {
        readyDOM,
    };
})()
