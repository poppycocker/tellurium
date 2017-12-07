const path = require('path')
const webpack = require('webpack')
const CopywebpackPlugin = require('copy-webpack-plugin')

const resolve = dir => path.join(__dirname, dir)

// The path to the Cesium source code
const cesiumSource = resolve('node_modules/cesium/Source')

module.exports = {
  devtool: '#source-map',
  devServer: {
    contentBase: path.join(__dirname, '')
  },
  entry: ['babel-polyfill', './src/tellurium.js'],
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
      '@@': resolve('src'),
      // Cesium module name
      cesium: path.resolve(__dirname, cesiumSource)
    },
    extensions: ['.js'],
    modules: ['node_modules', 'build/googshifted', 'build/olreunion', 'assets']
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
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader']
      }
    ]
  },
  plugins: [
    // Copy Cesium Assets, Widgets, and Workers to a static directory
    new CopywebpackPlugin([
      { from: path.join(cesiumSource, '../Build/Cesium/Workers'), to: 'Workers' }
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
