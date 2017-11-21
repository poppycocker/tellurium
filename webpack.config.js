const path = require('path')
const webpack = require('webpack')
const CopywebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

// The path to the Cesium source code
const cesiumSource = 'node_modules/cesium/Source'
const cesiumWorkers = '../Build/Cesium/Workers'

module.exports = {
  devtool: '#source-map',
  devServer: {
    contentBase: path.join(__dirname, '')
  },
  entry: ['babel-polyfill', './src/core/tellurium.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'tellurium.js',
    // Needed to compile multiline strings in Cesium
    sourcePrefix: ''
  },
  amd: {
    // Enable webpack-friendly use of require in Cesium
    toUrlUndefined: true
  },
  node: {
    // Resolve node module use of fs
    fs: 'empty'
  },
  resolve: {
    alias: {
      // Cesium module name
      cesium: path.resolve(__dirname, cesiumSource)
    },
    extensions: ['.js'],
    modules: ['node_modules', '../build/googshifted', '../build/olreunion']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    // new UglifyJSPlugin({ sourceMap: true }),
    new HtmlWebpackPlugin({
      template: 'sample/minimum.html'
    }),
    // Copy Cesium Assets, Widgets, and Workers to a static directory
    new CopywebpackPlugin([
      { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' }
    ]),
    new CopywebpackPlugin([
      { from: path.join(cesiumSource, 'Assets'), to: 'Assets' }
    ]),
    new CopywebpackPlugin([
      { from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }
    ]),
    new webpack.DefinePlugin({
      // Define relative base path in cesium for loading assets
      CESIUM_BASE_URL: JSON.stringify('')
    })
  ]
}
