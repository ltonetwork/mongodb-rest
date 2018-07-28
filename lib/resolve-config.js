/**
 * Configuration for REST server
 */

const fs = require("fs");
const path = require("path");
const defaultLogger = require('./logger');

module.exports = {
    with: resolveWith
};

//Default config
const defaultConfig = {
    db: 'mongodb://localhost:27017',
    server: {
        port: 3000,
        address: "0.0.0.0"
    },
    accessControl: {
        allowOrigin: "*",
        allowMethods: "GET,POST,PUT,DELETE,HEAD,OPTIONS",
        allowCredentials: false
    },
    mongoOptions: {
        serverOptions: {
        },
        dbOptions: {
            w: 1
        }
    },
    humanReadableOutput: true,
    collectionOutputType: "json",
    urlPrefix: "",
    logger: defaultLogger,
    ssl: {
        enabled: false,
        options: {}
    }
};

/**
 * Use default or user provided config
 * @param  {object} config
 * @return {object}
 */
function resolveWith(config) {
    const logger = (config && config.logger) || defaultLogger;
    const curDir = process.cwd();

    if (!config) {
        const configFilePath = path.join(curDir, "config.js");

        if (fs.existsSync(configFilePath)) {
            logger.verbose("Loading configuration from: " + configFilePath);

            config = require(configFilePath);
        }
        else {
            logger.verbose("Using default configuration.");
            logger.verbose("Please put config.js in current directory to customize configuration.");

            config = defaultConfig;
        }
    }

    logger.verbose('Input Configuration:');
    logger.verbose(config);

    config.logger = logger;

    if (!config.db) config.db = "mongodb://localhost:27017";
    if (!config.server) config.server = {};
    if (!config.server.port) config.server.port = 3000;
    if (!config.server.address) config.server.address = "0.0.0.0";

    logger.verbose('Configuration with defaults applied:');
    logger.verbose(config);

    return config;
}
