import 'core-js/es6';
import 'core-js/es7/reflect';
import 'webcomponents.js/webcomponents-lite';

require('zone.js/dist/zone');
if (process.env.ENV === 'production') {

} else {
  Error['stackTraceLimit'] = Infinity;
  require('zone.js/dist/long-stack-trace-zone');
}
