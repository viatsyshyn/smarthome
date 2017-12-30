var webpack = require('webpack');
var buildPath = require('./build-path').buildPath;
var fs = require('fs');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const CONFIG = require('./load-config').CONFIG;

var nodeModules = {
  'config.json': 'config.json'
};
fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: {
    'server': buildPath('src', 'server.ts')
  },

  target: 'node',

  node: {
    __dirname: false
  },

  output: {
    path: buildPath('dist'),
    filename: '[name].js',
    chunkFilename: '[id].[hash].chunk.js',
    libraryTarget: 'commonjs'
  },

  externals: nodeModules,

  devtool: 'sourcemap',

  resolve: {
    extensions: ['', '.js', '.ts']
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader']
      }
    ]
  },

  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.DefinePlugin({
      'process.env.ENV': JSON.stringify(ENV),
      'process.env.PORT': JSON.stringify(CONFIG.port)
    })
  ]
}
