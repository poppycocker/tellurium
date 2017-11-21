// !! for ol 4.4.2 !!

const vm = require('vm')
const request = require('request')
const fs = require('fs')
// setup env for node-canvas is required.
// https://github.com/Automattic/node-canvas
require('browser-env')()

module.exports = (args, done) => {
  const argcheck = []
  if (!args.src) {
    argcheck.push("option 'src' is required.")
  }
  if (!args.dest) {
    argcheck.push("option 'dest' is required.")
  }
  if (argcheck.length > 0) {
    done(new Error(argcheck.join('\n')))
  }
  request(
    {
      url: args.src,
      proxy: args.proxy
    },
    (err, res, body) => {
      if (err) {
        done(err)
      } else if (res.statusCode !== 200) {
        done(new Error(`cdnjs returns ${res.statusCode}.`))
      } else {
        vm.runInThisContext(body)
        generate()
      }
    }
  )

  const generate = () => {
    const notNameSpaceButModule = [
      'color',
      'colorlike',
      'condition',
      'coordinate',
      'easing',
      'extent',
      'featureloader',
      'filter',
      'has',
      'interaction',
      'loadingstrategy',
      'proj',
      'render',
      'size',
      'tilegrid',
      'xml'
    ]
    const bothNameSpaceAndModule = [
      'control'
      // 'events'
    ]
    const neitherNameSpaceNorModule = ['defaults', 'inherits']
    const output = []
    const modules = []
    const namespaces = []
    const listPaths = (currentRootObj, currentPath) => {
      Object.keys(currentRootObj).forEach(v => {
        const nextPath = `${currentPath}.${v}`
        // namespace
        if (
          v.match(/^[a-z].+/) &&
          typeof currentRootObj[v] === 'object' &&
          !notNameSpaceButModule.find(name => name === v)
        ) {
          namespaces.push(nextPath)
          listPaths(currentRootObj[v], nextPath)
          return
        }
        if (neitherNameSpaceNorModule.find(name => name === v)) {
          return
        }
        // module/class name
        modules.push(nextPath)
      })
    }
    listPaths(ol, 'ol')

    modules.forEach(path => {
      output.push(
        `import ${path.replace(/\./g, '')} from '${path
          .replace(/\./g, '/')
          .toLowerCase()}'`
      )
    })

    output.push('')
    output.push("import olOrg from 'ol/index'")
    output.push('const ol = Object.assign({}, olOrg)')
    output.push('')

    namespaces.forEach(path => {
      output.push(`${path} = {}`)
    })

    output.push('')

    output.push('// both namespace and module: merge module to namespace')
    bothNameSpaceAndModule.forEach(name => {
      output.push(`import ol${name}__ from 'ol/${name}'`)
      output.push(`Object.assign(ol.${name}, ol${name}__)`)
    })

    output.push('')

    modules.forEach(path => {
      output.push(`${path} = ${path.replace(/\./g, '')}`)
    })

    output.push('')
    output.push('export default ol')
    output.push('')

    fs.writeFile(args.dest, output.join('\n'), err => done(err))
  }
}
