self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('pwabuilder-offline').then((cache) => (
            new Promise((res) => {
                let cachedPages = ['index.html', 'app.core.js', 'storage.js', 'styles.css'];
                let counter = 0;
                cachedPages.forEach((page) => (
                    fetch(page).then((res) => {
                        cache.put(page, res);
                        counter += 1;
                        if (counter === cachedPages.length) {
                            res();
                        }
                    })
                ));
            })
        ))
    );
});
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function(error) {
            console.log( '[PWA Builder] Network request Failed. Serving content from cache: ' + error );
            return caches.open('pwabuilder-offline').then(function (cache) {
                return cache.match(event.request).then(function (matching) {
                    return !matching || matching.status === 404 ? Promise.reject('no-match') : matching
                });
            });
        })
    );
})
