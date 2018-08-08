/**
 * Default logger
 */

const defaultLogger = {
    verbose: function (msg) {
        // console.log(msg);
    },
    info: function (msg) {
        console.log(msg);
    },
    warn: function (msg) {
        console.log(msg);
    },
    error: function (msg) {
        console.log(msg);
    },
};

module.exports = defaultLogger;
