/**
 * Set REST API routes
 */

const auth = require('./auth/auth');
const endpoint = require('./helpers/endpoint');
const beforeRoute = require('./before-route');

module.exports = function (app, config) {
    if (config.auth) auth(app, config);

    const logger = config.logger;
    const isDbEndpoint = endpoint.isDbEndpoint(config);
    const dbParam = isDbEndpoint ? '' : '/:db';
    const urlPrefix = config.urlPrefix || '';

    //Get all databases names
    app.get(prefixed('/dbs'), action('get-db-names'));

    //Get names of all collections in specified database
    app.get(prefixed('/'), action('get-collection-names'));

    //Query
    app.get(prefixed('/:collection/:id?'), action('get-query'));

    //Bulk write operations
    app.post(prefixed('/bulk'), action('post-bulk'));

    //Insert
    app.post(prefixed('/:collection'), action('post-insert'));

    //Replace
    app.put(prefixed('/:collection/:id'), action('put-update'));

    //Update
    app.patch(prefixed('/:collection/:id'), action('patch-update'));

    //Delete
    app.delete(prefixed('/:collection/:id'), action('delete-query'));


    /**
     * Build route url
     * @param  {string} url  Tail of route url
     * @return {string}      Full relative url
     */
    function prefixed(url) {
        if (url === '/') url = '';

        return url === '/dbs' ?
            urlPrefix + url :
            urlPrefix + dbParam + url;
    }

    /**
     * Return route action
     * @param  {string} name
     */
    function action(name) {
        return function(request, response) {
            if (!before(request, response)) return;

            const routeAction = require('./actions/' + name);
            routeAction(request, response, config);
        }
    }

    /**
     * Perform all registered checks before executing route action
     * @param  {object} request
     * @param  {object} response
     * @return {boolean}
     */
    function before(request, response) {
        for (var name in beforeRoute) {
            var result = beforeRoute[name](request, response, config);
            if (!result) return false;
        }

        return true;
    }
};
