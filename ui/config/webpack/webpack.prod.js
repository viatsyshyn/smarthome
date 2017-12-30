var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var buildPath = require('./build-path').buildPath;

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const CONFIG = require('./load-config').CONFIG;

module.exports = webpackMerge(commonConfig, {
  devtool: 'source-map',

  entry: {
    'polyfills': buildPath('src', 'polyfills.ts'),
    'vendor': buildPath('src', 'vendor.ts'),
    'app': buildPath('src', 'client.ts')
  },

  output: {
    path: buildPath('dist'),
    publicPath: '/static/',
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].chunk.js'
  },

  htmlLoader: {
      minimize: false // workaround for ng2
  },

  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({ // https://github.com/angular/angular/issues/10618
        mangle: {
            keep_fnames: true
        }
    }),
    new ExtractTextPlugin('[name].[hash].css')
  ]
});
