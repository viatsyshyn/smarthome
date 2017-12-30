var path = require('path');
const rootDir = path.resolve(__dirname, '..', '..');

function buildPath() {
  let args = [].slice.call(arguments, 0);
  let res = path.join.apply(path, [rootDir].concat(args));
  return res;
}

exports.buildPath = buildPath;
