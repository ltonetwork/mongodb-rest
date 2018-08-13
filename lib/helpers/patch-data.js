/**
 * Prepare data for performing patch update
 */

module.exports = preparePatchData;

function preparePatchData(data) {
    const unset = {};

    for (var name in data) {
        if (data[name] !== null) continue;

        unset[name] = '';
        delete data[name];
    }

    var result = {};
    if (Object.keys(data).length) result.$set = data;
    if (Object.keys(unset).length) result.$unset = unset;
    if (!Object.keys(result).length) result = null;

    return result;
}
