/**
 * Set REST API routes
 */

const auth = require('./auth/auth');
const resolveDbConfig = require('./config/resolve-db-config');
const resolveUtils = require('./helpers/utils');

module.exports = function (app, config) {
    if (config.auth) auth(app, config);

    const dbConfig = resolveDbConfig.with(config);
    const utils = resolveUtils.with(config);
    const logger = config.logger;
    const urlPrefix = config.urlPrefix || '';

    //Get database names
    app.get(urlPrefix + '/dbs', action('get-db-names'));

    //Get names of all collections in specified database
    app.get(urlPrefix + '/:db', action('get-collection-names'));

    //Query
    app.get(urlPrefix + '/:db/:collection/:id?', action('get-query'));

    //Insert
    app.post(urlPrefix + '/:db/:collection', action('post-insert'));

    //Update
    app.put(urlPrefix + '/:db/:collection/:id', action('put-update'));

    //Delete
    app.delete(urlPrefix + '/:db/:collection/:id', action('delete-query'));

    /**
     * Return route action
     * @param  {string} name
     */
    function action(name) {
        return function(request, result) {
            const routeAction = require('./actions/' + name);

            return routeAction(request, result, {config, dbConfig, utils, logger});
        }
    }
};
