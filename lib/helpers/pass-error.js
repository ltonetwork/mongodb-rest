/**
 * Catch error and pass it further
 */

module.exports = passError;

function passError(prefix, error) {
    const message = prefix + error.message;

    throw new Error(message);
}
