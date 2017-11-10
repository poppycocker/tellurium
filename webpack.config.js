const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  devtool: '#source-map',
  entry: ['babel-polyfill', './src/core/tellurium.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'tellurium.js'
  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules', '../build/googshifted']
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [new UglifyJSPlugin({ sourceMap: true })]
}
