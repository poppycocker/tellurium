module.exports.getAssignmentExpressionStatement = function(identifier) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      left: {
          type: 'Identifier',
          name: identifier
      }
    }
  };
}

module.exports.getGoogExpressionStatement = function(identifier) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'goog'
        },
        property: {
          type: 'Identifier',
          name: identifier
        }
      }
    }
  };
}

module.exports.getGoog2ExpressionStatement = function(identifier1, identifier2) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: 'goog'
          },
          property: {
            type: 'Identifier',
            name: identifier1
          }
        },
        property: {
          type: 'Identifier',
          name: identifier2
        }
      }
    }
  };
}

module.exports.getGoogVariableDeclaration = function(identifier) {
  return {
    init: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'goog'
        },
        property: {
          type: 'Identifier',
          name: identifier
        }
      }
    }
  };
}

module.exports.rename = function(name) {
  const parts = name.split('.');
  if (parts.length === 1) {
    return name + 'Base'; // avoid conflicts with global window[name]
  }
  return parts.map((part, index) => {
      if (index === 0) {
    return part;
  } else {
    return part[0].toUpperCase() + part.substring(1, part.length);
  }
}).join('');
}


module.exports.getMemberExpression = function(name) {
  function memberExpression(parts) {
    const dotIndex = parts.lastIndexOf('.');
    if (dotIndex > 0) {
      return {
        type: 'MemberExpression',
        object: memberExpression(parts.slice(0, dotIndex)),
        property: {
          type: 'Identifier',
          name: parts.slice(dotIndex + 1)
        }
      };
    } else {
      return {
        type: 'Identifier',
        name: parts
      };
    }
  }
  return memberExpression(name);
}


module.exports.stringify = function(object) {
  return JSON.stringify(object, null, '\t');
};


module.exports.symbolToRelativePath = function (moduleName, name) {
  const moduleParts = moduleName.split('.');
  const parts = name.split('.');

  if (moduleParts[0] !== parts[0]) {
    if (parts[0] === 'ngeo') {
      parts[0] = 'ngeo6';
    }

    return parts.join('/').toLowerCase();
  }

  const moduleLength = moduleParts.length;
  let commonDepth = 1;

  while (commonDepth < moduleLength - 2) {
    if (moduleParts[commonDepth] === parts[commonDepth]) {
      ++commonDepth;
    } else {
      break;
    }
  }

  if (parts[0] === 'ngeo') {
    parts[0] = 'ngeo6';
  }
  const back = new Array(moduleLength - commonDepth).join('../') || './';
  let relative = back + parts.slice(commonDepth).join('/').toLowerCase();
  if (relative.endsWith('/')) {
    relative += 'index';
  }
  return relative;
};
