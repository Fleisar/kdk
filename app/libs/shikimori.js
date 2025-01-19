/* API docs (official): https://shikimori.one/api/doc/1.0 */

const shikimori = {
    origin: 'https://shikimori.one',
    apiEndpoint: 'https://shikimori.one/api',
    animesDefaultValue: {
        limit: 50,
        order: 'ranked',
        status: 'ongoing',
    },
    anime(id) {
        return new Anime(id);
    },
    animes(args = {}) {
        return new Animes(args);
    },
};

class Anime {
    constructor(id = 0) {
        this.id = Number(id);
    }

    roles() { this.request = '/roles'; }

    similar() { this.request = '/similar'; }

    related() { this.request = '/related'; }

    screenshots() { this.request = '/screenshots'; }

    franchise() { this.request = '/franchise'; }

    external_links() { this.request = '/external_links'; }

    topics() { this.request = '/topics'; }

    then(callback, onError = callback) {
        return fetch(`${shikimori.api}/animes/${this.id}${this.request}`).then((r, e) => {
            if (e || r.ok !== true) {
                onError(r, e);
                return Promise.reject(e);
            }
            return r.json().then((json) => callback(json));
        });
    }
}

class Animes {
    constructor(args = {}) {
        this.value = { ...shikimori.animesDefaultValue, ...args };
    }

    reset() {
        this.value = {};
        return this;
    }

    page(num) {
        if (typeof num !== 'number') return this.value.page || 0;
        this.value.page = num;
        return this;
    }

    limit(num) {
        if (typeof num !== 'number') throw 'Limit must be a number';
        this.value.limit = num;
        return this;
    }

    order(type) {
        if (['id', 'ranked', 'kind', 'popularity', 'name', 'aired_on', 'episodes', 'status', 'random', ''].indexOf(type) === -1) throw 'Invalid type of order';
        this.value.order = type;
        return this;
    }

    kind(kind) {
        if (['tv', 'movie', 'ova', 'ona', 'special', 'music', 'tv_13', 'tv_24', 'tv_48', ''].indexOf(kind) === -1) throw 'Invalid type of kind';
        this.value.kind = kind;
        return this;
    }

    status(st) {
        if (['anons', 'ongoing', 'released', ''].indexOf(st) === -1) throw 'Invalid type of status';
        this.value.status = st;
        return this;
    }

    season(season) {
        this.season = season;
        return this;
    }

    score(num) {
        if (typeof num !== 'number') throw 'Score must be a number';
        this.value.score = num;
        return this;
    }

    duration(d) {
        if (['S', 'D', 'F'].indexOf(d) === -1) throw 'Invalid duration';
        this.value.duration = d;
        return this;
    }

    rating(rating) {
        if (['none', 'g', 'pg', 'pg_13', 'r', 'r_plus', 'rx'].indexOf(rating) === -1) throw 'Invalid duration';
        this.value.rating = rating;
        return this;
    }

    genre(genres) {
        genres.forEach((arg) => { if (typeof arg !== 'number') throw 'Genre id must be a number'; });
        this.value.genre = genres;
        return this;
    }

    studio(studios) {
        studios.forEach((arg) => { if (typeof arg !== 'number') throw 'Studio id must be a number'; });
        this.value.studio = studios;
        return this;
    }

    franchise(franchise1, franchise2, franchise3) {
        this.value.franchise = arguments;
        return this;
    }

    censored(state) {
        this.value.censored = Boolean(state);
        return this;
    }

    ids(ids) {
        ids.forEach((arg) => { if (typeof arg !== 'number') throw 'Id must be a number'; });
        this.value.ids = ids;
        return this;
    }

    exclude_ids() {
        const args = arguments;
        args.forEach((arg) => { if (typeof arg !== 'number') throw 'Id must be a number'; });
        this.value.exclude_ids = args;
        return this;
    }

    search(text) {
        this.value.search = text.toString();
        return this;
    }

    then(callback, onError = callback) {
        if (typeof callback !== 'function') throw 'Callback must be a function';
        const args = this.value;
        const http_query = Object.keys(args).map((k) => {
            if (typeof args[k] === 'object') args[k] = Object.values(args[k]).join(',');
            else args[k] = args[k].toString();
            if (args[k] === '') return '';
            return `${k}=${args[k]}`;
        }).join('&');
        fetch(`${shikimori.apiEndpoint}/animes?${http_query}`).then((r, e) => {
            if (e) return onError(r, e);
            if (r.ok) r.json().then((json) => callback(json));
        });
        return this;
    }
}
