const {getGoogExpressionStatement, rename, getMemberExpression, stringify} = require('./util');


module.exports = (info, api, options) => {
  const j = api.jscodeshift;
  const root = j(info.source);


  const noRewriteRequires = options['skip-requires'] ? options['skip-requires'].split(',') : [];
  const declareLegacy = typeof options.legacy !== undefined ? options.legacy : false;

  const replacements = {};

  let provideCount = 0;

  // Replace goog.provide() with goog,module() and declare legacy namespace
  root.find(j.ExpressionStatement, getGoogExpressionStatement('provide'))
    .forEach(path => {
      if (provideCount++ !== 0) {
        throw new Error('Only one provide allowed');
      }
      replacements[path.node.expression.arguments[0].value] = 'exports';
      path.node.expression.callee.property.name = 'module';
      if (declareLegacy) {
        path.insertAfter(j.expressionStatement(j.callExpression(j.identifier('goog.module.declareLegacyNamespace'), [])));
      }
    });


  // Transform goog.require() into variable declarations
  root.find(j.ExpressionStatement, getGoogExpressionStatement('require'))
    .forEach(path => {
      const name = path.value.expression.arguments[0].value;
      noRewriteRequires.some(prefix => name.indexOf(prefix) === 0);
      if (noRewriteRequires.some(prefix => name.indexOf(prefix) === 0)) {
        return;
      }
      // if (name.indexOf('goog') != -1) {
      //   return;
      // }
      const alias = rename(name);
      replacements[name] = alias;
      const assignment = j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier(alias),
          path.node.expression
        )
        ]);
      path.replace(assignment);
    });

  // Replace all uses of required or provided names with renamed identifiers
  Object.keys(replacements).sort().reverse().forEach(name => {
    if (name.indexOf('.') > 0) {
      root.find(j.MemberExpression, getMemberExpression(name))
        .replaceWith(j.identifier(replacements[name]));
    } else {
      root.find(j.Identifier, {name: name})
        .replaceWith(j.identifier(replacements[name]));
    }
  });

  return root.toSource();
};
