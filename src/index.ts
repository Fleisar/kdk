/* global
    Anilibria, kodik, kodikBackend,
    shikimori, Template, ListStorage
*/

import { readyDOM } from "./shared/lib";
import { HoverMenu } from "./libs/hover-menu";
import { URI } from "./libs/uri";
import LazyLoad from "vanilla-lazyload";
import { Bind } from "./libs/bind.addon";
import shikimoriIcon from "./assets/shikimori.svg";
import { ConfigCollector } from "./libs/configCollector";
import { Template } from "./libs/template";
import { ContainerManager } from "./modules/ContainerManager";
import hotkeys from "hotkeys-js";

interface Config {
	disableAnimations: boolean;
	showTime: boolean;
	showReleases: boolean;
	showCollection: boolean;
	showHistory: boolean;
	showFavorite: boolean;
	colorBG: string;
	colorText: string;
	colorFill: string;
	colorHref: string;
	colorAttention: string;
	highEffects: boolean;
	playerMode: 'cinema' | 'fullscreen' | 'windowed';
	showTracking: boolean;
	disableAds: boolean;
	realtimeSearch: boolean;
	collectInformation: boolean;
}

$(() => {
  const defaultConfig = {
    showHistory: true,
    realtimeSearch: true,
    collectInformation: true,
  };
  const url = new URI('#');
  const binds = {
    aPage: new Bind('a[data-page]', 'click'),
    aWindow: new Bind('[data-window]', 'click'),
    hover: new Bind('header a', 'mousemove'),
    bodyScroll: new Bind('.page.general', 'scroll'),
    lazyLoad: new LazyLoad({}),
    titleHover: new HoverMenu('.ui-title', [
      'Открыть',
      '<span class="material-icons icon">info</span>Информация',
      '<span class="material-icons icon">playlist_add</span>Добавить в коллекцию',
      '<span class="material-icons icon">playlist_remove</span>Удалить из коллекции',
      '<span class="material-icons icon">content_copy</span>Скопировать название',
      {
        text: `<span class="icon">${shikimoriIcon}</span>Открыть в Shikimori`,
        classes: ['externalLink'],
      },
    ], {classes: ['icon-list', 'ui-hovermenu', 'ui-material-list']}),
    config: new ConfigCollector<Config>({config: defaultConfig}),
    anilibria: new Anilibria(),
    kodik: new kodik('.page.player .player-kodik'),
    kodikBackend: new kodikBackend('07e3119af111900bf95bd7c9554430a4'),
    sHistory: new ListStorage('sHistory'),
    sFavorite: new ListStorage('sFavorite'),
    sCollections: new ListStorage('sCollections'),
    titleHigh: new Bind('.ui-title', 'mousemove'),
  };
  const toRGB = (hex: string) => {
    const hexCode = hex.split('');
    const red = parseInt(hexCode[1] + hexCode[2], 16);
    const green = parseInt(hexCode[3] + hexCode[4], 16);
    const blue = parseInt(hexCode[5] + hexCode[6], 16);
    return [red, green, blue];
  };
  const collections = {
    title(data, inner = this.titleBase) {
      return `<a data-page="player" href="#player/shikimori/${data.id}" title="${(data.russian ? `${data.russian}\n` : '') + data.name}">${inner(data)}</a>`;
    },
    titleBase(data, bottom: string, options = {}) {
      return `
                <div class="ui-title${options.classes ? ` ${options.classes.join(' ')}` : ''}" data-add='${JSON.stringify(data)}' ${options.style ? `style="${Object.keys(options.style).map((k) => `${k}:${options.style[k]}`).join(';')}"` : ''}>
                    <div class="preview">
                        <div class="lazy backdrop" data-bg="${shikimori.origin}${data.image.preview}"></div>
                        <div class="lazy" data-bg="${shikimori.origin}${binds.config.config.highPreview ? data.image.original || data.image.preview : data.image.preview}"></div>
                    </div>
                    <div>${bottom || ''}</div>
                </div>
            `;
    },
    titleExtended(data, bottom: string, options = {}) {
      return `
                <div class="ui-title${options.classes ? ` ${options.classes.join(' ')}` : ''}" data-add='${JSON.stringify(data)}' ${options.style ? `style="${Object.keys(options.style).map((k) => `${k}:${options.style[k]}`).join(';')}"` : ''}>
                    <div class="preview">
                        <div class="lazy backdrop" data-bg="${shikimori.origin}${data.image.preview}"></div>
                        <div class="lazy" data-bg="${shikimori.origin}${binds.config.config.highPreview ? data.image.original || data.image.preview : data.image.preview}"></div>
                    </div>
                    <div>${bottom || ''}</div>
                </div>
            `;
    },
    minTitle(name: string, time: string, from: string) {
      return `<a data-window="search" data-add='{"text":"${name}"}'><div class="ui-min-title" style="--from:'${from}'" title="Время: ${time}"><h4>${name}</h4></div></a>`;
    },
    titleInfo(data) {
      const formatDate = (dateString: string) => (
        new Date(dateString).toLocaleDateString(
          undefined,
          {day: 'numeric', month: 'long', year: 'numeric'},
        )
      );
      const template = new Template('template-title-info');
      const payload = {
        ...data,
        titleCard: this.titleBase(data, '', {style: {margin: 'auto'}, classes: ['inactive']}),
        normalizedName: data.russian || data.name,
        status: data.status || 'Неизвестно',
        airedOn: data.aired_on != null ? formatDate(data.aired_on) : 'Неизвестно',
        releasedOn: data.released_on != null ? formatDate(data.released_on) : 'Неизвестно',
        normalizedEpisodes: `${data.episodes_aired}${data.episodes > 0 ? ` из ${data.episodes}` : ''}`,
        collectionAdd: {title: data},
        collectionRemove: {remove: data.id},
        openInShikimori: `${shikimori.origin}${data.url}`,
      };
      return template.clone(payload);
    },
    loadingResults() {
      return '<div class="ui-load"><span class="material-icons">hourglass_empty</span></div>';
    },
    noResults(text = 'Не удалось ничего найти') {
      return `<div class="ui-error"><div><span class="material-icons">announcement</span><h5>${text}</h5></div></div>`;
    },
    progress(statistic, digits = 2) {
      const data = statistic[1];
      const progress: string[] = [];
      const precent = 360 / Object.keys(data).filter((k) => (data[k].size !== '0B' ? k : null)).length;
      const description: string[] = [];
      Object.keys(data).filter((k) => (data[k].size !== '0B' ? k : null)).forEach((k, i) => {
        const precents = Math.ceil(data[k].part * 10 ** (digits + 2)) / 10 ** digits;
        progress.push(`<div title="${k} - ${precents}%" style="--color:${data[k].color || precent * i}deg;--part:${data[k].part}"></div>`);
        description.push(`<div style="--color:${data[k].color || precent * i}deg" title="${precents}%" class="ui-progress-part">${data[k].description || k} (${data[k].size})</div>`);
      });
      return `<span>Всего: ${statistic[0]}</span><div class="ui-progress">${progress.join('')}</div>${description.join('')}`;
    },
    playerBar(data) {
      const template = new Template('template-player-bar');
      const payload = {
        data: JSON.stringify(data),
        name: data.russian || data.name,
      };
      return template.clone(payload);
    },
    materialItem(text: string, data) {
      return `${data.window || data.page || data.href ? `<a ${data.data || data.href ? ` href="${data.data || data.href}"` : ''} ${data.href ? 'target="_blank"' : ''} ${data.page ? `data-page='${data.page}'` : ''} ${data.window ? `data-window='${data.window}'${data.data ? ` data-add="${data.data}"` : ''}` : ''}>` : ''}<li ${data.active ? 'class="active"' : ''}>${text}</li>${data.window || data.page || data.href ? '</a>' : ''}`;
    },
    consoleRow(text: string, color: string) {
      return `<pre style="color:${color};margin:0">${text}</pre>`;
    },
    filterItem(name: string, title, options) {
      return `<div class="ui-select"><span>${title}</span><select name="${name}">${Object.values(options).map((i) => `<option value="${i.value}" ${i.selected ? 'selected' : ''}>${i.name}</option>`).join('')}</select><i class="material-icons">expand_more</i></div>`;
    },
    collection(name: string, data) {
      const template = new Template('template-collection');
      return template.clone({data, name});
    },
    collectionBreadcrumb(name: string) {
      const template = new Template('template-collection-breadcrumb');
      return template.clone({name});
    },
    collectionAdd() {
      const template = new Template('template-collection-alert');
      return template.clone({text: 'Чтобы добавить тайтл в коллекцию, выберите её в списке ниже'});
    },
    collectionRemove() {
      const template = new Template('template-collection-alert');
      return template.clone({text: 'Чтобы удалить тайтл из коллекции, выберите её в списке ниже'});
    },
  };
  const config = <TKey extends keyof Config>(k: TKey, v?: Config[TKey]) => {
    const body = $('body');
    const kodik = $('.page.player .player-kodik.player');

	if (v == null) {
		return;
	}

    switch (k) {
      case 'disableAnimations': {
        body.attr('disableAnimations', v.toString());
        break;
      }
      case 'showTime': {
        $('.ui-clock')
          .attr('display', v.toString());
        break;
      }
      case 'showReleases': {
        $('header [data-window=releases]')
          .attr('display', v.toString());
        break;
      }
      case 'showCollection': {
        $('header [data-window=collections]')
          .attr('display', v.toString());
        break;
      }
      case 'showHistory': {
        $('header [data-window=history]')
          .attr('display', v.toString());
        break;
      }
      case 'showFavorite': {
        $('header [data-window=favorite]')
          .attr('display', v.toString());
        break;
      }
      case 'colorBG': {
        body.css('--colorBackground', toRGB(v as string)
          .join(', '));
        break;
      }
      case 'colorText': {
        body.css('--colorText', toRGB(v as string)
          .join(', '));
        break;
      }
      case 'colorFill': {
        body.css('--colorFill', toRGB(v as string)
          .join(', '));
        break;
      }
      case 'colorHref': {
        body.css('--colorHref', toRGB(v as string)
          .join(', '));
        break;
      }
      case 'colorAttention': {
        body.css('--colorAttention', toRGB(v as string)
          .join(', '));
        break;
      }
      case 'highEffects': {
        body.attr('highEffects', v.toString());
        break;
      }
      case 'playerMode': {
        $('div.page.player, div.window.config div.player-preview')
          .attr('playerMode', v as string);
        break;
      }
      case 'showTracking': {
        $('header [data-window=tracking]')
          .attr('display', v.toString());
        break;
      }
      case 'disableAds': {
        if (v) {
          kodik.attr('sandbox', 'allow-same-origin allow-scripts');
        } else {
          kodik.removeAttr('sandbox');
        }
        break;
      }
      default:
        break;
    }
  };
  const windowManager = new ContainerManager('.windows');
  const windows = {
    bind() {
      binds.aWindow.bind((e) => {
        const name = e.delegateTarget.dataset.window;
        const data = JSON.parse(e.delegateTarget.dataset.add || 'null');
        if (name == null || windowManager.currentContainer === name && data == null) {
          return windowManager.close();
        }
        return windowManager.open(name, data);
      });
      $('.windows').on('click', (e) => {
        if (e.target.classList.contains('windows')) {
          windowManager.close();
        }
      });
    },
    array: {
      config: async () => {
        $('.window.config .storage').html(collections.progress(await workers.storage._data()));
      },
      'title-info': (title) => {
        $('.windows .window.title-info .ui-grid').html(collections.titleInfo(title));
        const timeline = $('.window.title-info .ui-material-list.timeline');
        const links = $('.window.title-info .ui-material-list.links');
        shikimori.anime(title.id).franchise().then((r) => {
          timeline.html('');
          r.nodes.forEach((n) => {
            timeline.append(collections.materialItem(n.name, {
              page: 'player',
              data: `#player/shikimori/${n.id}`,
              active: n.id === title.id,
            }));
          });
          binds.aPage.update();
        });
        shikimori.anime(title.id).external_links().then((r) => {
          links.html('');
          r.forEach((l) => {
            const kind = workers.shikimori.linkTitle(l.kind);
            links.append(collections.materialItem(`<span class="icon"><img src="${shikimori.origin}/assets/blocks/b-external_links/${kind ? l.kind : 'official_site'}.png" alt="${kind || 'official_site'}" height="100%"></span>${kind || l.kind}`, {href: l.url}));
          });
        });
        binds.lazyLoad.update();
        binds.titleHigh.update();
        binds.aWindow.update();
      },
      search: (data) => {
        const searchDebounceTime = 1e3 / 4;
        let searchInputDebounce: number = 0;
        if (data != null && data.text) {
          $('.window.search input[type=text]').val(data.text);
          workers.search.search(data.text);
        }
        $('.window.search .search-input>input[type=text]').focus().unbind('input').on('input', (e) => {
          const search = $('.window.search input[type=text]').val()?.toString() ?? '';
          if (e.key === 'Enter') {
            workers.search.search(search);
            clearTimeout(searchInputDebounce);
          }

          if (
            search.length >= 2
            && binds.config.getValue('realtimeSearch')
          ) {
            clearTimeout(searchInputDebounce);
            searchInputDebounce = setTimeout(() => {
              workers.search.search(search);
            }, searchDebounceTime);
          }
        });
        $('.window.search .search-input>button').unbind('click').click(() => {
          workers.search.search($('.window.search input[type=text]').val()?.toString() ?? '');
        });
      },
      history() {
        const results = $('.window.history .results');
        const
          hs = workers.metric.history();
        results.html('');
        if (hs === false) return results.html(collections.noResults('Сбор данных отключён'));
        Object.values(hs.get()).reverse().forEach((d) => results.append(collections.title(d)));
        binds.titleHigh.update();
        binds.lazyLoad.update();
      },
      collections(data) {
        const results = $('.window.collections .result').html('');
        const titleList = $('.window.collections .titles').html('');
        const cll = workers.metric.collections();
        if (cll === false) {
          results.html(collections.noResults('Сбор данных отключён'));
          return;
        }
        const renderList = () => {
          const list = cll.get().reverse();
          results.html(list.length > 0
            ? ''
            : collections.noResults('Пока тут пусто'));

          list.forEach((d) => results.append(
            collections.collection(d.name, {
              id: d.id,
              name: d.name,
              new: data != null ? data.title : undefined,
              delete: data != null ? data.remove : undefined,
            }),
          ));
          binds.aWindow.update();
        };
        renderList();

        if (data == null) {
          return;
        }

        if (data.id === null) {
          const newCollectionName = prompt('Название новой коллекции');
          if (newCollectionName == null) {
            return;
          }
          cll.push({id: Date.now(), name: newCollectionName});
          renderList();
        }
        if (data.id != null) {
          const listStorage = new ListStorage(`collection-${data.id}`);
          results.html('');
          if (data.new != null && !listStorage.has(data.new.id)) {
            listStorage.push(data.new);
          }
          if (data.delete != null) {
            listStorage.delete(data.delete);
          }
          const items = listStorage.get().reverse();
          results.append(collections.collectionBreadcrumb(data.name));
          items.forEach((d) => {
            titleList.append(collections.title(d));
          });
          binds.titleHigh.update();
          binds.titleHover.updateSelector();
          binds.lazyLoad.update();
          binds.aWindow.update();
        }
        if (data.title != null) {
          results.prepend(collections.collectionAdd());
        }
        if (data.remove != null) {
          results.prepend(collections.collectionRemove());
        }
      },
    },
  };
  Object.entries(windows.array).forEach(([windowName]) => {
    windowManager.register(windowName, `.window.${windowName}`);
    windowManager.addEventListener(windowName, 'open', windows.array[windowName as keyof typeof windows.array]);
  });
  ['info-usage', 'info-processing', 'about', 'tutorial'].forEach((windowName) => {
    windowManager.register(windowName, `.window.${windowName}`);
  });
  $('header nav > a[data-window]').each((_, element) => {
    const name = $(element).data('window');

    windowManager.addEventListener(name, 'open', () => {
      $(element).addClass('active');
    });
    windowManager.addEventListener(name, 'close', () => {
      $(element).removeClass('active');
    });
  });
  const pageManager = new ContainerManager('main', true);
  const pages = {
    _current: 'general',
    levels: [] as string[],
    init() {
      return this.processor();
    },
    bind() {
      binds.aPage.bind((e) => {
        const data = JSON.parse(e.delegateTarget.dataset.add || 'null');
        const name = e.delegateTarget.dataset.page;
        if (name == null || pageManager.currentContainer === name && data == null) {
          return pageManager.close();
        }
        return pageManager.open(name, data);
      });
    },
    processor() {
      this.levels = url.address.split('/');
      switch (this.levels[0]) {
        case 'player':
          return pageManager.open('player');
        case 'general':
        default:
          return pageManager.open('general');
      }
    },
    array: {
      general: {
        state: null as 'loading' | null,
        shikimori: shikimori.animes(),
        main() {
          $('main>.vcontainer').html('');
          this.scrollUpdate();
        },
        load(page = 1) {
          this.state = 'loading';
          this.shikimori.page(page).then((r) => {
            const results = $('.page.general div.all');
            if (r.length === 0) {
              results.append(collections.noResults('Не удалось загрузить больше.'));
              return;
            }
            r.forEach((t) => {
              results.append(collections.title(t, collections.titleExtended));
            });
            this.state = null;
            binds.lazyLoad.update();
            binds.titleHigh.update();
            binds.aWindow.update();
            binds.titleHover.updateSelector();
          }, () => {
            $('.page.general>.vcontainer').html(collections.noResults());
          });
        },
        scrollUpdate() {
          let pageOffset = 1;
          this.load(pageOffset);
          workers.console.log('Load titles in general page...');
          binds.bodyScroll.bind(({target}) => {
            pageOffset += 1;
            const toBottom = target.children[0].clientHeight
              - target.scrollTop
              - target.clientHeight;
            if (toBottom < 500 && this.state !== 'loading') this.load(pageOffset);
          });
        },
      },
      player: {
        _current: 'kodik',
        _title: undefined,
        _data: undefined,
        _state: undefined,
        main(data) {
          this.update(data);
        },
        load() {
          workers.kodik();
        },
        update(data) {
          if (this._title !== pages.levels[1].toString() + pages.levels[2].toString()) {
            this.setPlayer(pages.levels[1], pages.levels[2]);
          }

          if (data != null && data.action === 'reload') {
            this.players.kodik.reload();
          }
        },
        setPlayer(name: string, id: string) {
          workers.console.log(`Running player - ${name}:${id}`);
          this._title = name.toString() + id.toString();
          shikimori.animes().reset().ids([Number(id)]).then((r) => {
            this._data = r[0];
            document.title = `KDK - ${this._data.russian || this._data.name}`;
            $('.page.player .ui-bar').html(collections.playerBar(this._data));
            const history = workers.metric.history();
            if (history != null) {
              history.push({
                id: this._data.id,
                name: this._data.name,
                russian: this._data.russian,
                image: {preview: this._data.image.preview, original: this._data.image.original},
              });
            }
            $('header>nav>a.player-show').show()
              .attr('title', this._data.russian || this._data.name || 'Плеер')
              .attr('data-add', JSON.stringify(this._data || '{}'));
            binds.aWindow.update();
            binds.aPage.update();
          });
          $(`.page.player .player-${this._current}`).hide();
          const players = {
            kodik: $('.page.player .player-kodik'),
          };
          switch (name) {
            case 'animetop':
              break;
            case 'shikimori':
              players.kodik.show();
              this.players.kodik.setShikimori(id);
              break;
            case 'kodik':
            default:
              players.kodik.show();
              this.players.kodik.setVideo(id);
              break;
          }
        },
        players: {
          kodik: {
            setShikimori(id: string) {
              binds.kodikBackend.search({shikimori_id: Number(id)}).then((d) => {
                if (d.results.length === 0) {
                  alert('anime not found');
                  pageManager.open('general');
                  return;
                }
                $('.page.player .player-kodik').attr('src', d.results[0].link);
              });
            },
            setVideo(id: string) {

            },
            reload() {
              const iframe = $('.page.player .player-kodik').get(0) as HTMLIFrameElement;
			  // Hack to reload iframe content
			  // https://stackoverflow.com/questions/86428/what-s-the-best-way-to-reload-refresh-an-iframe
              iframe.src = iframe.src;
            },
          },
        },
      },
    },
  };
  Object.entries(pages.array).forEach(([pageName, page]) => {
  	const name = pageName as keyof typeof pages.array;
    let isWorking = false;
    pageManager.register(pageName, `.page.${pageName}`);
    pageManager.addEventListener(pageName, 'open', (data) => {
      if (isWorking) {
        if ('update' in page) {
          page.update(data);
        }
      } else {
        if (page.main != null) {
          page.main(data);
        }
        isWorking = true;
      }
      windowManager.close();
    });
    pageManager.addEventListener(pageName, 'close', () => {
      if (page.main == null) {
        return;
      }
    });
  });
  $('header nav > a[data-page]').each((_, element) => {
    const name = $(element).data('page');

    pageManager.addEventListener(name, 'open', () => {
      $(element).addClass('active');
    });
    pageManager.addEventListener(name, 'close', () => {
      $(element).removeClass('active');
    });
  });
  const workers = {
    ui() {
      binds.hover.bind(function (e) {
        $(this).css({
          '--x': `${e.offsetX}px`,
          '--y': `${e.offsetY}px`,
        });
      });
      pages.init();
      pages.bind();
      binds.titleHigh.bind(function (e) {
        $(this).css({
          '--x': e.offsetX,
          '--y': e.offsetY,
        });
      });
    },
    search: {
      dom: {
        results: $('.window.search .results'),
      },
      search(text: string) {
        this.dom.results.html(collections.loadingResults());
        shikimori.animes().status('').order('').search(text)
          .then((r) => {
            this.dom.results.html('');
            if (r.length === 0) $('.window.search .results').html(collections.noResults());
            r.forEach((t) => {
              this.dom.results.append(collections.title(t));
            });
            binds.titleHover.updateSelector();
            binds.titleHigh.update();
            binds.lazyLoad.update();
            binds.aWindow.update();
          });
      },
    },
    clock: {
	  interval: 0,
      set() {
        const date = new Date();
        $('.ui-clock').text(`${date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`}:${date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`}`);
        this.interval = setInterval(() => {
          const date = new Date();
          const elem = $('.ui-clock');
          const format = `${date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`}:${date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`}`;
          if (elem.text() !== format) elem.text(format);
        }, 1e3);
      },
    },
    hotkeys() {
      hotkeys('esc,alt+o,alt+s,alt+c', (e, h) => {
        switch (h.key) {
          case 'esc':
            if (windowManager.container != null) windowManager.close();
            else pageManager.open('general');
            break;
          case 'alt+o':
            windowManager.open('config');
            break;
          case 'alt+s':
            windowManager.open('search');
            break;
          case 'alt+c':
            windowManager.open('console');
            break;
          default:
            break;
        }
      });
    },
    metric: {
      state: () => binds.config.getValue('collectInformation'),
      init() {

      },
      history() {
        return workers.metric.state() ? binds.sHistory : false;
      },
      favorite() {
        return workers.metric.state() ? binds.sFavorite : false;
      },
      collections() {
        return workers.metric.state() ? binds.sCollections : false;
      },
    },
    hoverMenu() {
      let tile: Record<any, any> = {};
      binds.titleHover.addEventListener('click', (id) => {
        switch (Number(id)) {
          case 0: {
            url.set(`#player/shikimori/${tile.id}`, {});
            break;
          }
          case 1: {
            windowManager.open('title-info', tile);
            break;
          }
          case 2: {
            windowManager.open('collections', {title: tile});
            break;
          }
          case 3: {
            windowManager.open('collections', {remove: tile.id});
            break;
          }
          case 4: {
            navigator.clipboard.writeText(tile.name);
            break;
          }
          case 5: {
            window.open(shikimori.origin + tile.url);
            break;
          }
          default:
            break;
        }
      });
      binds.titleHover.addEventListener('open', (e) => {
	  	if (!(e instanceof PointerEvent)) {
			  return;
		}
	  	const { dataset: { add = '{}' } } = e.currentTarget as HTMLElement;
        tile = JSON.parse(add);
      });
    },
    styles() {
      const f = () => {
        const hd: HTMLElement | null = document.querySelector('header');
        const cs = $('#--headerCeilSize').height() ?? 0;
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
		if (hd != null) {
			(hd.children[0] as HTMLElement).style.height = ((document.querySelectorAll('header>nav>a[display=true]').length + 4) * cs >= hd.offsetHeight) ? 'fit-content' : '100%';
		}
      };
      window.addEventListener('resize', f);
      readyDOM(f);
    },
    storage: {
      init() {},
      size: {
        _Processor(name: string) {
          const list = localStorage.getItem(name);
          return list === null ? 0 : new Blob([list]).size;
        },
        _old: {
          Favorite: 'lsfavorite',
          Cache: 'cache',
          History: 'lshistory',
        },
        _list: {
          favorite: 'sFavorite',
          history: 'sHistory',
        },
        async all() {
          let size = await this.self() ?? 0;
          Object.values(this._old).forEach((v) => size += this._Processor(v));
          return size;
        },
	  	history() {
			return this._Processor(this._list.history);
		},
        self() {
          return navigator.storage.estimate().then((s) => s.usage);
        },

      },
      async _data() {
        const storage = await navigator.storage.estimate();
        const data = {
          system: {size: storage.usage ?? 0, description: 'Файлы сайта'},
          history: {size: this.size.history(), description: 'История просмотров'},
        };
        const all = Object.values(data).reduce((a, b) => a + b.size, 0);
        const convertedSizes = Object.values(data).map((value) => ({
			...value,
			part: value.size / all,
			size: this._convert(value.size)
		}));
        return [this._convert(all), convertedSizes];
      },
      _convert(bytes: number, digits = 2) {
        const sizes: [number, string][] = [
          [2 ** 0, 'B'],
          [2 ** 10, 'KB'],
          [2 ** 20, 'MB'],
          [2 ** 30, 'GB'],
        ];
        const [measureSize, measureUnit] = sizes.reduce((prev, curr) => (
          (Math.abs(curr[0] - bytes) < Math.abs(prev[0] - bytes)) ? curr : prev));
        const delimiter = 10 ** digits;
        return `${Math.ceil((bytes / measureSize) * delimiter) / delimiter}${measureUnit}`;
      },
    },
    shikimori: {
      linkTitle(kind: string) {
        switch (kind) {
          case 'wikipedia':
            return 'Wikipedia';
          case 'anime_news_network':
            return 'Anime News Network';
          case 'myanimelist':
            return 'MyAnimeList';
          case 'anime_db':
            return 'AniDB';
          case 'world_art':
            return 'World Art';
          case 'twitter':
            return 'Twitter';
          case 'official_site':
            return 'Официальный сайт';
          case 'kage_project':
            return 'Kage Project';
          case 'kinopoisk':
            return 'Кинопоиск';
          case 'ruranobe':
            return 'РуРанобэ';
          case 'readmanga':
            return 'ReadManga';
          case 'novelupdates':
            return 'NovelUpdates';
          case 'mangaupdates':
            return 'MangaUpdates';
          case 'mangafox':
            return 'MangaFox';
          case 'mangachan':
            return 'Манга-тян';
          case 'mangahub':
            return 'Mangahub';
          case 'smotret_anime':
            return 'Смотреть аниме';
          case 'youtube_channel':
            return 'YouTube';
          case 'novel_tl':
            return 'Novel.tl';
          case 'mangalib':
            return 'MangaLib';
          case 'ranobelib':
            return 'RanobeLib';
          case 'remanga':
            return 'ReManga';
          case 'mangadex':
            return 'MangaDex';
          case 'more_tv':
            return 'more.tv';
          case 'baike_baidu_wiki':
            return 'Baike Baidu Wiki';
          case 'namu_wiki':
            return 'Namu Wiki';
        }
      },
    },
    console: {
      log(text: string, col = '#fff') {
        const log = $('.window.console .result');
        log.append(collections.consoleRow(text, col));
        $('.window.console').scrollTop(log.height() ?? 0);
      },
      error(text: string) {
        return this.log(text, '#f77');
      },
      warn(text: string) {
        return this.log(text, '#ff7');
      },
    },
    kodik() {
      binds.kodik.on('current_episode', (d) => {
        pages.array.player._state = d;
      }).on('time_update', (data) => {
        const history = workers.metric.history();
        const {id} = pages.array.player._data;
        if (history == null || id == null) {
          return false;
        }

        const item = history.get(id);
        Object.assign(item, {
          episodes: {
            ...item.episodes || {},
            [pages.array.player._state.episode]: data,
          },
        });
        history.set(id, item);
      });
    },
    redirect() {
      url.onRedirect((st) => {
        console.groupCollapsed(`Redirected to #${url.address}`);
        console.log(st);
        console.groupEnd();
        workers.console.log(`Page changed to ${url.address}`);
        pages.processor();
      });
    },
  };
  // config load
  binds.config.addEventListener('update', config);
  // ui preload
  workers.ui();
  workers.styles();
  workers.hoverMenu();
  workers.clock.set();
  // internal init
  workers.storage.init();
  workers.hotkeys();
  workers.redirect();
  // app link
  windows.bind();
  // debug info
  workers.console.log('Start loading...');
});
