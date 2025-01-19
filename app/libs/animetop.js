/* API docs (self-written): animetop.api.md */
(function () {
    window.animetop = {
        POOL_REQUEST: 'https://api.animetop.info/v1',
        _request(url, options = {}) {
            return new Promise((r, e) => {
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = () => {
                    if (xhr.readyState !== 4 || xhr.status !== 200) return false;
                    let data;
                    try {
                        data = JSON.parse(xhr.responseText);
                    } catch (err) {
                        return e(err);
                    }
                    return r(data);
                };
                xhr.open(options.hasOwnProperty('method') ? options.method : 'GET', url, true);
                options.hasOwnProperty('method') && options.method.toLocaleUpperCase() === 'POST'
                && xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.send(options.data ? options.data : null);
            });
        },
        list(page = 1, amount = 40) {
            if (amount > 40) return false;
            return this._request(`${this.POOL_REQUEST}/last?page=${page}&quantity=${amount}`);
        },
        search(text) {
            if (text.toString().length < 4) return false;
            return this._request(`${this.POOL_REQUEST}/search`, { method: 'POST', data: `name=${text}` });
        },
        timetable() {
            return this._request(`${this.POOL_REQUEST}/rasp`);
        },
        anime(id) {
            return this._request(`${this.POOL_REQUEST}/info`, { method: 'POST', data: `id=${id}` });
        },
        comments(id) {
            return this._request(`${this.POOL_REQUEST}/comments?id=${id}`);
        },
    };
}());
