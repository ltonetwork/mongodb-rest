/**
 * Set REST API routes
 */

const auth = require('./auth/auth');
const resolveDbConfig = require('./config/resolve-db-config');
const resolveUtils = require('./helpers/utils');
const endpoint = require('./helpers/endpoint');
const beforeAction = require('./before-action');

module.exports = function (app, config) {
    if (config.auth) auth(app, config);

    const logger = config.logger;
    const dbConfig = resolveDbConfig.with(config);
    const utils = resolveUtils.with(config);

    const isDbEndpoint = endpoint.isDbEndpoint(config);
    const dbParam = isDbEndpoint ? '' : '/:db';
    const urlPrefix = config.urlPrefix || '';

    //Get all databases names
    app.get(prefixed('/dbs'), action('get-db-names'));

    //Get names of all collections in specified database
    app.get(prefixed('/'), action('get-collection-names'));

    //Query
    app.get(prefixed('/:collection/:id?'), action('get-query'));

    //Insert
    app.post(prefixed('/:collection'), action('post-insert'));

    //Update
    app.put(prefixed('/:collection/:id'), action('put-update'));

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
            const allowAction = beforeAction(request, response, config);
            if (!allowAction) return;

            const routeAction = require('./actions/' + name);

            return routeAction(request, response, {config, dbConfig, utils, logger});
        }
    }
};
