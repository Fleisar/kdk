self.addEventListener('install', function(event) {
    var indexPage = new Request('index.html');
    event.waitUntil(
        fetch(indexPage).then(function(response) {
            return caches.open('pwabuilder-offline').then(function(cache) {
                return cache.put(indexPage, response);
            });
        }));
});
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function(error) {
            console.log( '[PWA Builder] Network request Failed. Serving content from cache: ' + error );
            return caches.open('pwabuilder-offline').then(function (cache) {
                return cache.match(event.request).then(function (matching) {
                    var report =  !matching || matching.status == 404?Promise.reject('no-match'): matching;
                    return report
                });
            });
        })
    );
})