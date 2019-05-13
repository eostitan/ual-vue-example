// vue.config.js
var webpack = require('webpack');

module.exports = {
    devServer: {
        open: process.platform === 'darwin',
        host: '0.0.0.0',
        port: 8081, 
        https: false,
        hot:true,
        clientLogLevel: 'info',
        watchOptions: { poll: true }
    },
    configureWebpack: {
        devtool: 'source-map'
    }
}