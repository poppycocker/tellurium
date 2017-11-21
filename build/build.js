const here = __dirname
const chalk = require('chalk')
const exec = require('child_process').exec
const fs = require('fs-extra')
const ora = require('ora')
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('../webpack.config')
const olReunionGen = require(path.join(here, 'gen_olreunion.js'))

const paths = {
  olcs_org: path.join(here, '../node_modules/ol-cesium/src/olcs'),
  olcs_shifted: path.join(here, './googshifted/olcs'),
  jscodeshift: path.join(here, '../node_modules/.bin/jscodeshift'),
  gp2gm: path.join(here, 'transforms/goog_provide_to_goog_module.js'),
  gm2em: path.join(here, 'transforms/goog_module_to_es6_module.js')
}
const olReunionGenOpts = {
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ol3/4.4.2/ol.js',
  dest: path.join(here, 'olreunion/olreunion.js'),
  proxy: 'http://localhost:3128'
}

const spinner = ora('building tellurium ...').start()

fs
  .copy(paths.olcs_org, paths.olcs_shifted)
  .then(() => {
    return new Promise((resolve, reject) => {
      spinner.text =
        '  applying googshift to ol-cesium: goog.provide() -> goog.module() ...'
      exec(
        `${paths.jscodeshift} -t ${paths.gp2gm} ${paths.olcs_shifted}`,
        (err, stdout, stderr) => (err ? reject(err) : resolve())
      )
    })
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      spinner.text =
        '  applying googshift to ol-cesium: goog.module() -> import ...'
      exec(
        `${paths.jscodeshift} -t ${paths.gm2em} ${paths.olcs_shifted}`,
        (err, stdout, stderr) => (err ? reject(err) : resolve())
      )
    })
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      spinner.text = '  generating ol-reunion module ...'
      olReunionGen(olReunionGenOpts, err => (err ? reject(err) : resolve()))
    })
  })
  .then(() => {
    // run webpack
    return new Promise((resolve, reject) => {
      spinner.text = '  running webpack ...'
      webpack(
        webpackConfig,
        (err, stats) => (err ? reject(err) : resolve(stats))
      )
    })
  })
  .then(stats => {
    process.stdout.write(
      stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
      }) + '\n\n'
    )
    console.log(chalk.cyan('build complete.\n'))
    spinner.stop()
  })
  .catch(err => {
    spinner.stop()
    console.error('Error!')
    console.error(err)
  })
