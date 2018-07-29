/**
 * Utils for routes actions
 */

module.exports = {
    with: resolveWith
};

function resolveWith(config) {
    return {
        defaultJsonTransform,
        defaultCsvTransform,
        transformCollection
    };

    /**
     * Transform collection for json output.
     *
     * By default, don't transform json data.
     */
    function defaultJsonTransform(input) {
        return input;
    }

    /**
     * Transform collection for csv output.
     */
    function defaultCsvTransform(input) {
        if (input.length == 0) {
            return [];
        }

        // Convert to headers and rows for csv.
        var keys = Object.keys(input[0]);
        return [keys].concat(
            input.map(function (dataItem) {
                return keys.map(function (key) {
                    return dataItem[key];
                });
            })
        );
    }

    /**
     * Transform a collection for output.
     */
    function transformCollection(outputType, input) {
        var transform = config.transformCollection;

        if (!transform) {
            if (outputType === 'json') {
                transform = defaultJsonTransform;
            } else if (outputType === 'csv') {
                // Convert input array of objects into an array of rows/columns for csv output.
                transform = defaultCsvTransform
            } else {
                throw new Error('Unknown output transform type: ' + outputType + '\\n' +
                                'Valid types are "json" and "csv"');
            }
        }

        return transform(input);
    }
}
