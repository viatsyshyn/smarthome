let webpack = require('webpack');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let CopyWebpackPlugin = require('copy-webpack-plugin');

let autoprefixer = require('autoprefixer');
let buildPath = require('./build-path').buildPath;

module.exports = {
  entry: {
    'polyfills': './src/polyfills.ts',
    'vendor': './src/vendor.ts',
    'app': './src/main.ts'
  },

  resolve: {
    extensions: ['', '.ts', '.js']
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader', 'angular2-template-loader']
      },
      {
        test: /\.html$/,
        loader: 'html'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'file?name=assets/[name].[hash].[ext]'
      },
      {
        test: /\.css$/,
        exclude: buildPath('src', 'app'),
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss')
      },
      {
        test: /\.css$/,
        include: buildPath('src', 'app'),
        loaders: ['raw', 'postcss']
      },
      {
        test: /\.scss$/,
        exclude: buildPath('src', 'app'),
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!sass?sourceMap')
      },
      {
        test: /\.scss$/,
        include: buildPath('src', 'app'),
        loaders: ['raw', 'sass', 'postcss']
      },
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([ { from: 'src/static', to: '.' } ])
  ],

  postcss: function () {
    return [autoprefixer({ browsers: ['last 2 versions'] })];
  },

  sassLoader: {
    includePaths: [
      buildPath('src', 'styles')
    ]
  },

  node: {
    console: true,
    fs: 'empty',
    vm: 'empty'
  }
};
