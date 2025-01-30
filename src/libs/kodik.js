(function () {
	window.kodik = function (selector) {
		this._a = {
			on: {
				play: [],
				pause: [],
				time_update: [],
				duration_time: [],
				video_started: [],
				video_ended: [],
				volume_change: [],
				current_episode: [],
				enter_pip: [],
				exit_pip: [],
			},
			do: {
				play: [],
				pause: [],
				seek: ['seconds'],
				volume: ['volume'],
				mute: [],
				unmute: [],
				change_episode: ['seasons', 'episode'],
				enter_pip: [],
				exit_pip: [],
				get_time: [],
			},
		};
		window.addEventListener('message', (d, a = null) => {
			if (d.data.key === undefined || !d.data.key.startsWith('kodik_player_')) return false;
			if (Object.keys(this._a.on)
				.indexOf(a = d.data.key.substr(13)) === -1) {
				console.groupCollapsed('Undefined action');
				console.warn(d.data);
				console.groupEnd();
			}

			this._a.on[a].forEach((f) => f(d.data));
		});
		if ((this.SELF = document.querySelector(selector)) === null) {
			console.warn('Kodik player not found');
		}
		Object.keys(this._a)
			.forEach((p) => Object.keys(this._a[p])
				.forEach((a) => this[`${p}_${a}`] = (h) => this[p](a, h)));
	};
	window.kodik.prototype = {
		on(action, handler) {
			if (Object.keys(this._a.on)
				.indexOf(action) === -1) {
				throw 'This action doesn\'t exist';
			}
			if (typeof handler !== 'function') throw 'Handler must be a function';
			return this._a.on[action].push(handler), this;
		},
		do(action, data) {
			if (Object.keys(this._a.do)
				.indexOf(action) === -1) {
				throw 'This action doesn\'t exist';
			}
			if (!Object.keys(data)
				.reduce((a, b) => a && Object.keys(this._a.do)
					.indexOf(b), true)) {
				throw 'Invalid construction';
			}
			this.SELF.contentWindow.postMessage({
				key: 'kodik_player_api',
				value: { method: action, ...data }
			}, '*');
		},
	};
}());
