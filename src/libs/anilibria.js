/* API docs (official): https://github.com/anilibria/docs/blob/master/api_v2.md */
/* !!Attention!! Authorization is going through third-party service */
(function () {
	window.Anilibria = function (email, password) {
		if (typeof email === 'string' && typeof password === 'string') {
			this._request('', {
				url: 'https://pur.fle.su/anilibria.php',
				method: 'post',
				post: true,
				data: {
					mail: email,
					passwd: password,
				},
			})
				.then((r) => {
					r = JSON.parse(r);
					if (r[1].err === 'ok') this.session = r[0];
				});
		}
		Object.keys(this._allowedKeys)
			.forEach((m) => {
				this[m] = function (options = {}) {
					Object.keys(options)
						.forEach((k) => {
							if (!(k in this._allowedKeys[m])) throw `Invalid key ${k} in ${m}`;
							if (typeof options[k] !== this._allowedKeys[m][k]) throw `Invalid type of ${k}(${typeof options[k]}) in ${m}`;
						});
					return this._request(m, {
						method: this._methods[m] || 'get',
						data: { ...options, ...(this.session !== undefined ? { session: this.session } : {}) }
					});
				};
			});
	};
	window.Anilibria.prototype = {
		POOL: 'https://api.anilibria.tv/v2/',
		PROXY: 'https://pur.fle.su/ref/post.php?url=',
		_request(url, options) {
			const method = (options.method || 'get').toUpperCase();
			const query = this._httpBuildQuery(options.data || {});
			return new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.onreadystatechange = () => {
					if (xhr.readyState === XMLHttpRequest.DONE) return resolve(JSON.parse(xhr.responseText));
				};
				xhr.onerror = () => reject(xhr);
				xhr.open(method, (options.proxy ? this.PROXY : '') + (options.url || this.POOL + url) + (options.post ? '' : `?${query}`), options.async || true);
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xhr.send(options.data ? query : null);
			});
		},
		_httpBuildQuery(object) {
			const query = Object.keys(object)
				.map((k) => `${k}=${typeof object[k] !== 'object' ? object[k].toString() : Object.values(object[k])
					.join(',')}`);
			return query.join('&');
		},
		_allowedKeys: {
			getTitle: {
				id: 'number',
				code: 'string',
				torrent_id: 'number',
				filter: 'object',
				remove: 'object',
				include: 'object',
				description_type: 'string',
				playlist_type: 'string',
			},
			getTitles: {
				id_list: 'object',
				code_list: 'object',
				filter: 'object',
				remove: 'object',
				include: 'object',
				description_type: 'string',
				playlist_type: 'string',
			},
			getUpdates: {
				filter: 'object',
				remove: 'object',
				include: 'object',
				limit: 'number',
				since: 'number',
				description_type: 'string',
				playlist_type: 'string',
				after: 'number',
			},
			getChanges: {
				filter: 'object',
				remove: 'object',
				include: 'object',
				limit: 'number',
				since: 'number',
				description_type: 'string',
				after: 'number',
			},
			getSchedule: {
				filter: 'object',
				remove: 'object',
				include: 'object',
				days: 'object',
				description_type: 'string',
				playlist_type: 'string',
			},
			getRandomTitle: {
				filter: 'object',
				remove: 'object',
				include: 'object',
				description_type: 'string',
				playlist_type: 'string',
			},
			getYouTube: {
				filter: 'object',
				remove: 'object',
				limit: 'number',
				since: 'number',
				after: 'number',
			},
			getFeed: this.getUpdates,
			getYears: {},
			getGenres: {
				sorting_type: 'number',
			},
			getCachingNodes: {},
			getTeam: {},
			getSeedStats: {
				users: 'object',
				filter: 'object',
				remove: 'object',
				limit: 'number',
				after: 'number',
				sort_by: 'string',
				order: 'number',
			},
			getRSS: {
				rss_type: 'string',
				session: 'string',
				limit: 'number',
				since: 'number',
				after: 'number',
			},
			searchTitles: {
				search: 'string',
				year: 'object',
				season_code: 'object',
				genres: 'object',
				voice: 'object',
				translator: 'object',
				editing: 'object',
				decor: 'object',
				timing: 'object',
				filter: 'object',
				remove: 'object',
				include: 'object',
				description_type: 'string',
				playlist_type: 'string',
				limit: 'number',
				after: 'number',
			},
			advancedSearch: {
				query: 'string',
				filter: 'object',
				remove: 'object',
				include: 'object',
				description_type: 'string',
				playlist_type: 'string',
				limit: 'number',
				after: 'number',
				order_by: 'string',
				sort_direction: 'number',
			},
			getFavorites: {
				filter: 'object',
				remove: 'object',
				include: 'object',
				description_type: 'string',
				playlist_type: 'string',
			},
			addFavorite: {
				title_id: 'number',
			},
			delFavorite: this.addFavorite,
		},
		_methods: {
			addFavorite: 'put',
			delFavorite: 'delete',
		},
	};
}());
