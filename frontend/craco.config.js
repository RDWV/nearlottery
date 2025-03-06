const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    crypto: require.resolve("crypto-browserify"),
                    http: require.resolve("stream-http"),
                    https: require.resolve("https-browserify"),
                    buffer: require.resolve("buffer/"),
                    util: require.resolve("util/"),
                    url: require.resolve("url/"),
                    stream: require.resolve("stream-browserify"),
                    assert: require.resolve("assert/"),
                }
            }
        },
        plugins: {
            add: [
                new webpack.ProvidePlugin({
                    process: 'process/browser',
                    Buffer: ['buffer', 'Buffer'],
                }),
            ],
        },
    },
}; 