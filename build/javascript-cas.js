;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function(process){'use strict';

var M = require('./lib');
if (process.env.JSCAS_COVERAGE){
  var dir = './lib-cov';
  M = require(dir);
}

if (typeof window !== 'undefined') {
    var _M = window.M;
    window.M = M;
    M.noConflict = function () {
        window.M = _M;
        return M;
    };
}
if (typeof module !== 'undefined') {
    module.exports = M;
}

})(require("__browserify_process"))
},{"./lib":3,"__browserify_process":1}],3:[function(require,module,exports){
(function(){/*jslint node: true */

// not sure if this is required:
/*jshint sub: true */

"use strict";

var Expression  = require('./Expression'),
    Context     = require('./Context'),
    MathError   = require('./Error'),
    language    = require('./Language/default'),
    Code        = require('./Language').Code,
    Global      = require('./global');

// Define sin, cos, tan, etc.
var defaults    = require('./global/defaults');
defaults.attach(Global);

module.exports = M;

function M(e, c) {
    return language.parse(e, c || Global);
}

M.toString = function() {
    return [
    'function M(expression, context) {',
    '    /*!',
    '     *  Math JavaScript Library v3.9.1',
    '     *  https://github.com/aantthony/javascript-cas',
    '     *  ',
    '     *  Copyright 2010 Anthony Foster. All rights reserved.',
    '     */',
    '    [awesome code]',
    '}'].join('\n');
};

M['Context']    = Context;
M['Expression'] = Expression;
M['Global']     = Global;
M['Error']      = MathError;

Expression.prototype.s = function (lang) {
    Code.language = language;
    Code.newContext();
    return this._s(Code, lang);
};
Expression.prototype.compile = function (x) {
    return this.s('text/javascript').compile(x);
}

var extensions = {};

M['register'] = function (name, installer){
    if(Expression.prototype[name]) {
        throw('Method .' + name + ' is already in use!');
    }
    extensions[name] = installer;
};

M['load'] = function(name, config) {
    extensions[name](M, Expression, config);
    delete extensions[name];
};

})()
},{"./Language/default":4,"./global/defaults":5,"./Context":6,"./Expression":7,"./Error":8,"./Language":9,"./global":10}],8:[function(require,module,exports){
function MathError(str) {
    this.message = str;
}
MathError.prototype = Object.create(Error.prototype);

module.exports = MathError;

},{}],10:[function(require,module,exports){
var context = {};

module.exports = context;

},{}],11:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":12}],12:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":1}],13:[function(require,module,exports){
(function(process){/* parser generated by jison 0.4.10 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"S":4,"EOF":5,"e":6,"stmt":7,"=":8,"!=":9,"<=":10,"<":11,">":12,">=":13,"csl":14,",":15,"vector":16,"(":17,")":18,"+":19,"-":20,"*":21,"%":22,"/":23,"POWER{":24,"}":25,"_{":26,"!":27,"_SINGLE":28,"SQRT{":29,"FRAC{":30,"{":31,"^SINGLEA":32,"^SINGLEP":33,"identifier":34,"number":35,"IDENTIFIER":36,"LONGIDENTIFIER":37,"DECIMAL":38,"INTEGER":39,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"=",9:"!=",10:"<=",11:"<",12:">",13:">=",15:",",17:"(",18:")",19:"+",20:"-",21:"*",22:"%",23:"/",24:"POWER{",25:"}",26:"_{",27:"!",28:"_SINGLE",29:"SQRT{",30:"FRAC{",31:"{",32:"^SINGLEA",33:"^SINGLEP",36:"IDENTIFIER",37:"LONGIDENTIFIER",38:"DECIMAL",39:"INTEGER"},
productions_: [0,[3,2],[4,1],[4,1],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[14,3],[14,3],[16,3],[6,3],[6,3],[6,3],[6,3],[6,3],[6,4],[6,4],[6,2],[6,2],[6,3],[6,6],[6,2],[6,2],[6,2],[6,2],[6,3],[6,1],[6,1],[6,1],[34,1],[34,1],[35,1],[35,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 2:this.$ = $$[$0];
break;
case 3:this.$ = $$[$0];
break;
case 4:this.$ = ['=', $$[$0-2], $$[$0]];
break;
case 5:this.$ = ['!=', $$[$0-2], $$[$0]];
break;
case 6:this.$ = ['<=', $$[$0-2], $$[$0]];
break;
case 7:this.$ = ['<', $$[$0-2], $$[$0]];
break;
case 8:this.$ = ['>', $$[$0-2], $$[$0]];
break;
case 9:this.$ = ['>=', $$[$0-2], $$[$0]];
break;
case 10:this.$ = [',.', $$[$0-2], $$[$0]];
break;
case 11:this.$ = [',', $$[$0-2], $$[$0]];
break;
case 12:this.$ = $$[$0-1];
break;
case 13:this.$ = ['+', $$[$0-2], $$[$0]];
break;
case 14:this.$ = ['-', $$[$0-2], $$[$0]];
break;
case 15:this.$ = ['*', $$[$0-2], $$[$0]];
break;
case 16:this.$ = ['%', $$[$0-2], $$[$0]];
break;
case 17:this.$ = ['/', $$[$0-2], $$[$0]];
break;
case 18:this.$ = ['^', $$[$0-3], $$[$0-1]];
break;
case 19:this.$ = ['_', $$[$0-3], $$[$0-1]];
break;
case 20:this.$ = ['!', $$[$0-1]];
break;
case 21:this.$ = ['_', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 22:this.$ = ['sqrt', $$[$0-1]];
break;
case 23:this.$ = ['frac', $$[$0-4], $$[$0-1]];
break;
case 24:this.$ = ['^', $$[$0-1], yytext.substring(1)];
break;
case 25:this.$ = ['^', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 26:this.$ = ['@-', $$[$0]]
break;
case 27:this.$ = ['default', $$[$0-1], $$[$0]];
break;
case 28:this.$ = $$[$0-1]
break;
case 29:this.$ = $$[$0];
break;
case 30:this.$ = $$[$0];
break;
case 31:this.$ = $$[$0];
break;
case 32:this.$ = yytext;
break;
case 33:this.$ = yytext.substring(1);
break;
case 34:this.$ = {type: 'Number', primitive: yytext};
break;
case 35:this.$ = {type: 'Number', primitive: yytext};
break;
}
},
table: [{3:1,4:2,6:3,7:4,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{1:[3]},{5:[1,16]},{5:[2,2],6:28,8:[1,29],9:[1,30],10:[1,31],11:[1,32],12:[1,33],13:[1,34],16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,2],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,3],25:[2,3]},{6:35,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:36,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:37,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:38,14:39,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,29],8:[2,29],9:[2,29],10:[2,29],11:[2,29],12:[2,29],13:[2,29],15:[2,29],17:[2,29],18:[2,29],19:[2,29],20:[2,29],21:[2,29],22:[2,29],23:[2,29],24:[2,29],25:[2,29],26:[2,29],27:[2,29],28:[2,29],29:[2,29],30:[2,29],32:[2,29],33:[2,29],36:[2,29],37:[2,29],38:[2,29],39:[2,29]},{5:[2,30],8:[2,30],9:[2,30],10:[2,30],11:[2,30],12:[2,30],13:[2,30],15:[2,30],17:[2,30],18:[2,30],19:[2,30],20:[2,30],21:[2,30],22:[2,30],23:[2,30],24:[2,30],25:[2,30],26:[2,30],27:[2,30],28:[2,30],29:[2,30],30:[2,30],32:[2,30],33:[2,30],36:[2,30],37:[2,30],38:[2,30],39:[2,30]},{5:[2,31],8:[2,31],9:[2,31],10:[2,31],11:[2,31],12:[2,31],13:[2,31],15:[2,31],17:[2,31],18:[2,31],19:[2,31],20:[2,31],21:[2,31],22:[2,31],23:[2,31],24:[2,31],25:[2,31],26:[2,31],27:[2,31],28:[2,31],29:[2,31],30:[2,31],32:[2,31],33:[2,31],36:[2,31],37:[2,31],38:[2,31],39:[2,31]},{5:[2,32],8:[2,32],9:[2,32],10:[2,32],11:[2,32],12:[2,32],13:[2,32],15:[2,32],17:[2,32],18:[2,32],19:[2,32],20:[2,32],21:[2,32],22:[2,32],23:[2,32],24:[2,32],25:[2,32],26:[2,32],27:[2,32],28:[2,32],29:[2,32],30:[2,32],32:[2,32],33:[2,32],36:[2,32],37:[2,32],38:[2,32],39:[2,32]},{5:[2,33],8:[2,33],9:[2,33],10:[2,33],11:[2,33],12:[2,33],13:[2,33],15:[2,33],17:[2,33],18:[2,33],19:[2,33],20:[2,33],21:[2,33],22:[2,33],23:[2,33],24:[2,33],25:[2,33],26:[2,33],27:[2,33],28:[2,33],29:[2,33],30:[2,33],32:[2,33],33:[2,33],36:[2,33],37:[2,33],38:[2,33],39:[2,33]},{5:[2,34],8:[2,34],9:[2,34],10:[2,34],11:[2,34],12:[2,34],13:[2,34],15:[2,34],17:[2,34],18:[2,34],19:[2,34],20:[2,34],21:[2,34],22:[2,34],23:[2,34],24:[2,34],25:[2,34],26:[2,34],27:[2,34],28:[2,34],29:[2,34],30:[2,34],32:[2,34],33:[2,34],36:[2,34],37:[2,34],38:[2,34],39:[2,34]},{5:[2,35],8:[2,35],9:[2,35],10:[2,35],11:[2,35],12:[2,35],13:[2,35],15:[2,35],17:[2,35],18:[2,35],19:[2,35],20:[2,35],21:[2,35],22:[2,35],23:[2,35],24:[2,35],25:[2,35],26:[2,35],27:[2,35],28:[2,35],29:[2,35],30:[2,35],32:[2,35],33:[2,35],36:[2,35],37:[2,35],38:[2,35],39:[2,35]},{1:[2,1]},{6:40,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:41,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:42,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:43,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:44,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:45,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{4:46,6:3,7:4,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,20],8:[2,20],9:[2,20],10:[2,20],11:[2,20],12:[2,20],13:[2,20],15:[2,20],17:[2,20],18:[2,20],19:[2,20],20:[2,20],21:[2,20],22:[2,20],23:[2,20],24:[2,20],25:[2,20],26:[2,20],27:[2,20],28:[2,20],29:[2,20],30:[2,20],32:[2,20],33:[2,20],36:[2,20],37:[2,20],38:[2,20],39:[2,20]},{5:[2,21],8:[2,21],9:[2,21],10:[2,21],11:[2,21],12:[2,21],13:[2,21],15:[2,21],17:[2,21],18:[2,21],19:[2,21],20:[2,21],21:[2,21],22:[2,21],23:[2,21],24:[2,21],25:[2,21],26:[2,21],27:[2,21],28:[2,21],29:[2,21],30:[2,21],32:[2,21],33:[2,21],36:[2,21],37:[2,21],38:[2,21],39:[2,21]},{5:[2,24],8:[2,24],9:[2,24],10:[2,24],11:[2,24],12:[2,24],13:[2,24],15:[2,24],17:[2,24],18:[2,24],19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[2,24],24:[2,24],25:[2,24],26:[2,24],27:[2,24],28:[2,24],29:[2,24],30:[2,24],32:[2,24],33:[2,24],36:[2,24],37:[2,24],38:[2,24],39:[2,24]},{5:[2,25],8:[2,25],9:[2,25],10:[2,25],11:[2,25],12:[2,25],13:[2,25],15:[2,25],17:[2,25],18:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25],27:[2,25],28:[2,25],29:[2,25],30:[2,25],32:[2,25],33:[2,25],36:[2,25],37:[2,25],38:[2,25],39:[2,25]},{5:[2,27],6:28,8:[2,27],9:[2,27],10:[2,27],11:[2,27],12:[2,27],13:[2,27],15:[2,27],16:9,17:[1,8],18:[2,27],19:[2,27],20:[2,27],21:[2,27],22:[2,27],23:[2,27],24:[1,22],25:[2,27],26:[2,27],27:[2,27],28:[2,27],29:[2,27],30:[2,27],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:47,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:48,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:49,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:50,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:51,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:52,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[1,53],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[1,54],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,26],6:28,8:[2,26],9:[2,26],10:[2,26],11:[2,26],12:[2,26],13:[2,26],15:[2,26],16:9,17:[1,8],18:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[1,20],23:[2,26],24:[1,22],25:[2,26],26:[2,26],27:[1,24],28:[2,26],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,15:[1,56],16:9,17:[1,8],18:[1,55],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{15:[1,58],18:[1,57]},{5:[2,13],6:28,8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],15:[2,13],16:9,17:[1,8],18:[2,13],19:[2,13],20:[2,13],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,13],26:[2,13],27:[1,24],28:[2,13],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,14],6:28,8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],15:[2,14],16:9,17:[1,8],18:[2,14],19:[2,14],20:[2,14],21:[2,26],22:[1,20],23:[2,26],24:[1,22],25:[2,14],26:[2,14],27:[1,24],28:[2,14],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,15],6:28,8:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],15:[2,15],16:9,17:[1,8],18:[2,15],19:[2,15],20:[2,15],21:[2,15],22:[1,20],23:[2,15],24:[1,22],25:[2,15],26:[2,15],27:[1,24],28:[2,15],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,16],6:28,8:[2,16],9:[2,16],10:[2,16],11:[2,16],12:[2,16],13:[2,16],15:[2,16],16:9,17:[1,8],18:[2,16],19:[2,16],20:[2,16],21:[2,16],22:[1,20],23:[2,16],24:[1,22],25:[2,16],26:[2,16],27:[2,16],28:[2,16],29:[2,16],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,17],6:28,8:[2,17],9:[2,17],10:[2,17],11:[2,17],12:[2,17],13:[2,17],15:[2,17],16:9,17:[1,8],18:[2,17],19:[2,17],20:[2,17],21:[2,17],22:[1,20],23:[2,17],24:[1,22],25:[2,17],26:[2,17],27:[1,24],28:[2,17],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[1,59],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{25:[1,60]},{5:[2,4],6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,4],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,5],6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,5],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,6],6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,6],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,7],6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,7],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,8],6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,8],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,9],6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[2,9],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,22],8:[2,22],9:[2,22],10:[2,22],11:[2,22],12:[2,22],13:[2,22],15:[2,22],17:[2,22],18:[2,22],19:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22],27:[2,22],28:[2,22],29:[2,22],30:[2,22],32:[2,22],33:[2,22],36:[2,22],37:[2,22],38:[2,22],39:[2,22]},{31:[1,61]},{5:[2,28],8:[2,28],9:[2,28],10:[2,28],11:[2,28],12:[2,28],13:[2,28],15:[2,28],17:[2,28],18:[2,28],19:[2,28],20:[2,28],21:[2,28],22:[2,28],23:[2,28],24:[2,28],25:[2,28],26:[2,28],27:[2,28],28:[2,28],29:[2,28],30:[2,28],32:[2,28],33:[2,28],36:[2,28],37:[2,28],38:[2,28],39:[2,28]},{6:62,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,12],8:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],15:[2,12],17:[2,12],18:[2,12],19:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12],24:[2,12],25:[2,12],26:[2,12],27:[2,12],28:[2,12],29:[2,12],30:[2,12],32:[2,12],33:[2,12],36:[2,12],37:[2,12],38:[2,12],39:[2,12]},{6:63,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,18],8:[2,18],9:[2,18],10:[2,18],11:[2,18],12:[2,18],13:[2,18],15:[2,18],17:[2,18],18:[2,18],19:[2,18],20:[2,18],21:[2,18],22:[2,18],23:[2,18],24:[2,18],25:[2,18],26:[2,18],27:[2,18],28:[2,18],29:[2,18],30:[2,18],32:[2,18],33:[2,18],36:[2,18],37:[2,18],38:[2,18],39:[2,18]},{5:[2,19],8:[2,19],9:[2,19],10:[2,19],11:[2,19],12:[2,19],13:[2,19],15:[2,19],17:[2,19],18:[2,19],19:[2,19],20:[2,19],21:[2,19],22:[2,19],23:[2,19],24:[2,19],25:[2,19],26:[2,19],27:[2,19],28:[2,19],29:[2,19],30:[2,19],32:[2,19],33:[2,19],36:[2,19],37:[2,19],38:[2,19],39:[2,19]},{6:64,16:9,17:[1,8],20:[1,7],29:[1,5],30:[1,6],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,15:[2,11],16:9,17:[1,8],18:[2,11],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,15:[2,10],16:9,17:[1,8],18:[2,10],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{6:28,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,22],25:[1,65],26:[1,23],27:[1,24],28:[1,25],29:[1,5],30:[1,6],32:[1,26],33:[1,27],34:10,35:11,36:[1,12],37:[1,13],38:[1,14],39:[1,15]},{5:[2,23],8:[2,23],9:[2,23],10:[2,23],11:[2,23],12:[2,23],13:[2,23],15:[2,23],17:[2,23],18:[2,23],19:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[2,23],24:[2,23],25:[2,23],26:[2,23],27:[2,23],28:[2,23],29:[2,23],30:[2,23],32:[2,23],33:[2,23],36:[2,23],37:[2,23],38:[2,23],39:[2,23]}],
defaultActions: {16:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
undefined/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 'TEXT'
break;
case 2:return 17
break;
case 3:return 18
break;
case 4:return 30
break;
case 5:return 29
break;
case 6:return 21
break;
case 7:return 10
break;
case 8:return 13
break;
case 9:return 'NE'
break;
case 10:return 37
break;
case 11:return 36
break;
case 12:return 38
break;
case 13:return 39
break;
case 14:return 8
break;
case 15:return 21
break;
case 16:return 21
break;
case 17:return 23
break;
case 18:return 20
break;
case 19:return 19
break;
case 20:return 10
break;
case 21:return 13
break;
case 22:return 11
break;
case 23:return 12
break;
case 24:return 9
break;
case 25:return '&&'
break;
case 26:return 28
break;
case 27:return 33
break;
case 28:return 32
break;
case 29:return 26
break;
case 30:return 24
break;
case 31:return 27
break;
case 32:return 22
break;
case 33:return 22
break;
case 34:return 15
break;
case 35:return '?'
break;
case 36:return ':'
break;
case 37:return 17
break;
case 38:return 18
break;
case 39:return 31
break;
case 40:return 25
break;
case 41:return '['
break;
case 42:return ']'
break;
case 43:return 5
break;
}
},
rules: [/^(?:\s+)/,/^(?:\$[^\$]*\$)/,/^(?:\\left\()/,/^(?:\\right\))/,/^(?:\\frac\{)/,/^(?:\\sqrt\{)/,/^(?:\\cdo[t])/,/^(?:\\l[e])/,/^(?:\\g[e])/,/^(?:\\n[e])/,/^(?:\\[a-zA-Z]+)/,/^(?:[a-zA-Z])/,/^(?:[0-9]+\.[0-9]*)/,/^(?:[0-9]+)/,/^(?:=)/,/^(?:\*)/,/^(?:\.)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:<=)/,/^(?:>=)/,/^(?:<)/,/^(?:>)/,/^(?:!=)/,/^(?:&&)/,/^(?:_[^\(\{])/,/^(?:\^[0-9])/,/^(?:\^[^\(\{0-9])/,/^(?:_\{)/,/^(?:\^\{)/,/^(?:!)/,/^(?:%)/,/^(?:\\%)/,/^(?:,)/,/^(?:\?)/,/^(?::)/,/^(?:\()/,/^(?:\))/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
})(require("__browserify_process"))
},{"fs":14,"path":15,"__browserify_process":1}],4:[function(require,module,exports){
(function(){var Language = require('./');

var Expression = require('../Expression'),
    Global     = require('../global');

var crossProduct = String.fromCharCode(215); // &times; character

// Built by Jison:
var parser = require('../../grammar/parser.js');

parser.parseError = function (str, hash) {
    // {
    //     text: this.lexer.match,
    //     token: this.terminals_[symbol] || symbol,
    //     line: this.lexer.yylineno,
    //     loc: yyloc,
    //     expected:
    //     expected
    // }
    var er = new SyntaxError(str);
    er.line = hash.line;
    throw er;
};


var left = -1, right = +1;
var L = left;
var R = right;



var language = module.exports = new Language(parser, {
        Number: function (str) {
            if (str === '1') {
                return Global.One;
            } else if (str === '0') {
                return Global.Zero;
            }

            if (/^\d+$/.test(str)) {
                return new Expression.Integer(Number(str));
            }
            if (/^[\d]*\.[\d]+$/.test(str)) {
                var decimalPlace = str.indexOf('.');
                // 12.345 -> 12345 / 1000
                // 00.5 -> 5/10
                var denom_p = str.length - decimalPlace - 1;
                var d = Math.pow(10, denom_p);
                var n = Number(str.replace('.', ''));
                
                return new Expression.Rational(n, d).reduce();
            }
            return new Expression.NumericalReal(Number(str));
        },
        String: function (str) {
            return str;
        },
        Single: function (str) {
            // Single latex chars for x^3, x^y etc (NOT x^{abc})
            if (!isNaN(str)) {
                return new Expression.Integer(Number(str));
            }
            
            return new Expression.Symbol.Real(str);
        }
    },
    [
    [';'],          /*L / R makes no difference???!??!? */
    [','],
    [['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='],R],
    [['?',':'],R,2],
    [['∨']],
    [['&&']],
    [['|']],
    [['??????']],//XOR
    [['&']],
    [['==', '≠', '!==', '===']],
    [['<', '<=', '>', '>='],L],
    [['>>', '<<']],
    ['±', R, 2],
    [['+'], true],
    [['-'], L],
    [['∫', '∑'], R, 1],
    [['%']],
    [['*']],
    [crossProduct, R],
    [['@+', '@-', '@±'], R, 1], //unary plus/minus
    [['¬'], L, 1],
    ['default', 0, 2], //I changed this to R for 5sin(t)
    ['∘', 0, 2],
    [['/']],
    [['^']],//e**x
    ['!', L, 1],
    [['~'], R, 1], //bitwise negation
    [['++', '++', '.', '->'],L,1],
    [['::']],
    [['_'], L, 2],
    ['var', R, 1],
    ['break', R, 0],
    ['throw', R, 1],
    ['\'', L, 1],
    ['\u221A', R, 1], // Sqrt
    ['#', R, 1] /*anonymous function*/
]);

/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/

// var mathematica = new Language([
//     [';'],
//     [','],
//     [['=', '+=']]
// ]);

})()
},{"../../grammar/parser.js":13,"./":9,"../Expression":7,"../global":10}],6:[function(require,module,exports){
(function(){var util    = require('util');
var Global  = require('../global');

module.exports = Context;

util.inherits(Context, {prototype: Global});

function Context() {

}

Context.prototype.reset = function () {
    this.splice(0);
};

})()
},{"util":11,"../global":10}],9:[function(require,module,exports){
var util = require('util');

function Language(parser, Construct, language) {
    this.cfg = parser;
    this.Construct = Construct;
    var operators = this.operators = {},
        opPrecedence = 0;
    function op(v, associativity, arity) {

    }
    language.forEach(function (o) {
        function defop(str, o) {
            var associativity = o[1] || 0;
            var arity = (o[2] === undefined) ? 2 : o[2];

            operators[str] =  {
                associativity: associativity,
                precedence: opPrecedence++,
                arity: arity
            };
        }
        var str = o[0];
        if (typeof str === 'string') {
            defop(str, o);
        } else {
            str.forEach(function (s) {
                defop(s, o);
            });
        }
    });
}

Language.Code = require('./Code');

var _        = Language.prototype;

_.parse      = require('./parse');
_.stringify  = require('./stringify');

_.postfix = function (str) {
    var operator = this.operators[str];
    return  operator.associativity === 0 && 
            operator.arity === 1;
};

_.unary = function (str) {
    var unary_secondarys = ['+', '-', '±'];
    return (unary_secondarys.indexOf(o) !== -1) ? ('@' + o) : false;
};

_.associative = function (str) {
    return this.operators[str].associativity === 0;
};



module.exports = Language;

},{"util":11,"./parse":16,"./Code":17,"./stringify":18}],5:[function(require,module,exports){
(function(){var Expression = require('../Expression');
var util = require('util');

module.exports.attach = function (global) {


    function Derivative(wrt) {
        return new Expression.Function({
            default: function (x) {
                return x.differentiate(wrt);
            }
        })
    }
        

    global['Infinity'] = new Expression.NumericalReal(Infinity, 0);
    global['Infinity'].title = 'Infinity';
    global['Infinity'].description = '';
    global['infty'] = global.Infinity;


    global['Zero'] = new Expression.Integer(0);
    global['Zero'].title = 'Zero';
    global['Zero'].description = 'Additive Identity';
    global['Zero']['*'] = function (x) {
        return global.Zero;
    };
    global['Zero']['+'] = function (x) {
        return x;
    };
    global['Zero']['@-'] = function (x) {
        return this;
    };

    global['Zero']['-'] = function (x) {
        return x['@-']();
    };

    global['One'] = new Expression.Integer(1);
    global['One'].title = 'One';
    global['One'].description = 'Multiplicative Identity';
    global['One']['*'] = function (x) {
        return x;
    };

    function gammln(xx) {
        var j;
        var x, tmp, y, ser;
        var cof = [
             57.1562356658629235,
            -59.5979603554754912,
             14.1360979747417471,
            -0.491913816097620199,
             0.339946499848118887e-4,
             0.465236289270485756e-4,
            -0.983744753048795646e-4,
             0.158088703224912494e-3,
            -0.210264441724104883e-3,
             0.217439618115212643e-3,
            -0.164318106536763890e-3,
             0.844182239838527433e-4,
            -0.261908384015814087e-4,
             0.368991826595316234e-5
        ];
        if (xx <= 0){
            throw(new Error('bad arg in gammln'));
        }
        y = x = xx;
        tmp = x + 5.24218750000000000;
        tmp = (x + 0.5) * Math.log(tmp) - tmp;
        ser = 0.999999999999997092;
        for (j = 0; j < 14; j++){
            ser += cof[j] / ++y;
        }
        return tmp + Math.log(2.5066282746310005 * ser / x);
    }


    var CartSine = new Expression.Function({
        default: function (x) {
            if(x instanceof Expression.NumericalReal
                || x instanceof Expression.List.Real
                || x instanceof Expression.Symbol.Real) {
                return new M.Expression.List.ComplexCartesian([global.sin.default(x), global.Zero]);
            } else {
                throw(new Error('Complex Sine Cartesian form not implemented yet.'));
            }
        }
    });

    global['sin'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.sin(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.sin, x]);
            }
            return Expression.List([global.sin, x]);
            
            /*
                    // sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
                    var exp_b = Math.exp(x._imag);
                    var cosh_b = (exp_b + 1 / exp_b) / 2;
                    var sinh_b = (exp_b - 1 / exp_b) / 2;
                    return new Expression.ComplexNumerical(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
            */
        },
        realimag: function () {
            return CartSine;
        },
        'text/latex': '\\sin',
        'text/javascript': 'Math.sin',
        'x-shader/x-fragment': 'sin',
        title: 'Sine Function',
        description: 'See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent',
        examples: ['\\sin (\\pi)'],
        related: ['cos', 'tan']
    });
    global['cos'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.cos(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.cos, x]);
            }
            return Expression.List([global.cos, x]);
            
        },
        derivative: global.sin['@-'](),
        'text/latex': '\\cos',
        'text/javascript': 'Math.cos',
        'x-shader/x-fragment': 'cos',
        title: 'Cosine Function',
        description: 'Cosine Function desc',
        examples: ['\\cos (\\pi)'],
        related: ['sin', 'tan']
    });

    global.sin.derivative = global.cos;

    global['sec'] = (function () {
        var s = new Expression.Symbol.Real();
        var y = global['One']['/'](global['cos'].default(s));
        return new Expression.Function.Symbolic(y, [s]);
    }());

    global['tan'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.tan(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.tan, x]);
            }
            return Expression.List([global.tan, x]);
            
        },
        derivative: global.sec['^'](new Expression.Integer(2)),
        'text/latex': '\\tan',
        'text/javascript': 'Math.tan',
        'x-shader/x-fragment': 'tan',
        title: 'Tangent Function',
        description: 'Tangent Function desc',
        examples: ['\\tan(\\pi/3)', '\\tan (\\pi/2)'],
        related: ['sin', 'cos']
    });

    global['csc'] = global['cosec'] = (function () {
        var s = new Expression.Symbol.Real();
        var y = global['One']['/'](global['sin'].default(s));
        return new Expression.Function.Symbolic(y, [s]);
    }());

    global['log'] = new Expression.Function({
        default: function (x, assumptions) {

            if(x instanceof Expression.Integer && x.a === 1) {
                return global.Zero;
            } else if(x instanceof Expression.Integer && x.a === 0) {
                return global.Infinity['@-']();
            } else if(x instanceof Expression.NumericalReal) {
                var v = x.value;
                if(v > 0){
                    return new Expression.NumericalReal(Math.log(v));
                }
            }

            if(assumptions && assumptions.positive) {
                return Expression.List.Real([global.log, x]);
            }
            
            return Expression.List([global.log, x]);
        },
        realimag: function (x) {
            return CartLog;
        },
        'text/latex': '\\log',
        'text/javascript': 'Math.log',
        'x-shader/x-fragment': 'log',
        title: 'Natural Logarithm',
        description: 'Base e. See http://en.wikipedia.org/wiki/Natural_logarithm',
        examples: ['\\log (ye^(2x))'],
        related: ['exp', 'Log']
    });
    var Half = new Expression.Rational(1, 2);
    var CartLog = new Expression.Function({
        default: function (x) {
            return new Expression.List.ComplexCartesian([
                global.log.default(x.abs()),
                x.arg()
            ])['*'](Half);
        }
    });
    CartLog.__proto__ = global.log;
    global['atan2'] = new Expression.Function({
        default: function(x) {
            if(! (x instanceof Expression.Vector)) {
                throw ('atan only takes vector arguments');
            }
            if(x[0] instanceof Expression.NumericalReal) {
                if(x[1] instanceof Expression.NumericalReal) {
                    return new Expression.NumericalReal(Math.atan2(x[0].value, x[1].value));
                }
            }
            
            return new Expression.List.Real([global.atan2, x]);
            
            return Expression.List([global.atan2, x]);
        },
        apply_realimag: function(op, x) {
            //TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
            return [Expression.List([global.atan2, x]), M.global.Zero];
        },
        'text/latex': '\\tan^{-1}',
        'text/javascript': 'Math.atan2',
        'x-shader/x-fragment': 'atan',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Two argument arctangent function',
        description: 'Arctan(y, x). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2'
    });

    global['factorial'] = new Expression.Function({
        default: function (x) {
            return global.Gamma.default(x['+'](global.One));
        },
        'text/latex': '\\factorial'
    });

    global['atan'] = global.atan2;

    global['Gamma'] = new Expression.Function({
        default: function(x){
            if (x instanceof Expression.Integer) {
                var v = x.a;
                if(v < 0) {
                    return global.ComplexInfinity;
                }
                if(v < 15) {
                    var p = 1;
                    var i = 0;
                    for(i = 1; i < v; i++) {
                        p *= i;
                    }
                    return new Expression.Integer(p);
                }
                return Expression.List.Real([global.Gamma, x]);
            } else if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                if (v === 0) {
                    return global.Infinity;
                } else if(v < 0) {
                    return new Expression.NumericalReal(-Math.PI / (v * Math.sin(Math.PI * v) * Math.exp(gammln(-v))));
                }
                return new Expression.NumericalReal(Math.exp(gammln(v)));
            } else if(x instanceof Expression.NumericalComplex) {
                
            }
            return Expression.List([global.Gamma, x]);
        },
        'text/latex': '\\Gamma',
        'text/javascript': gammln,
        'x-shader/x-fragment': function () {

        },
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Gamma Function',
        description: 'See http://en.wikipedia.org/wiki/Gamma_function',
        examples: ['\\Gamma (x)', 'x!'],
        related: ['Log', 'LogGamma']
    });

    global['Re'] = new Expression.Function({
        default: function(x) {
            return x.real();
        },
        apply_realimag: function(op, x) {
            return [x.real(), global.Zero];
        },
        'text/latex': '\\Re'
    });

    global['Im'] = new Expression.Function({
        default: function(x) {
            return x.imag();
        },
        distributed_under_differentiation: true,
        apply_realimag: function(op, x) {
            return [x.imag(), global.Zero];
        },
        'text/latex': '\\Im'
    });

    function FiniteSet(elements) {
        this.elements = elements || [];
    }
    FiniteSet.prototype.intersect = function (x) {
        var res = [];
        for(var i = 0; i < this.elements.length; i++) {
            if (x.elements.indexOf(this.elements[i]) !== -1) {
                res.push(this.elements[i]);
            }
        }
        return new FiniteSet(res);
    };
    FiniteSet.prototype.enumerate = function (n, fn) {
        this.elements = [];
        for(var i = 0; i < n; i++) {
            this.elements[i] = null;
        }
        if (fn) {
            this.map(fn);
        }
    };
    FiniteSet.prototype.map = function (fn) {
        for(var i = 0, l = this.elements.length; i < l; i++) {
            this.elements[i] = new fn(this.elements[i], i);
        }
        return this;
    };
    FiniteSet.prototype.subset = function (x) {
        for(var i = 0, l = this.elements.length; i < l; i++) {
            if (x.elements.indexOf(this.elements[i]) === -1) {
                return false;
            }
        }
        return false;
    };
    FiniteSet.prototype.psubset = function (x) {
        return (this.elements.length < x.elements.length) && this.subset(x);
    };
    FiniteSet.prototype.supset = function (x) {
        return x.subset(this);
    };

    FiniteSet.prototype.equals = function (x) {
        if (!this.elements.length !== x.elements.length) return false;

        for(var i = 0, l = this.elements.length; i < l; i++) {
            if (this.elements[i] !== x.elements[i]) return false;
        }

        return true;
    }

    util.inherits(ModuloGroup, FiniteSet);
    function ModuloGroup(n, operator) {
        FiniteSet.call(this);

        operator = operator || 'default';

        function Element(_, n) {
            this.n = n;
        }

        Element.prototype[operator]
        = Element.prototype.default
        = function (x) {
            return new Element((this.n + x.n) % n);
        };
        
        this.enumerate(n, Element);

        this.prototype = Element.prototype;

    };

    util.inherits(MultiValue, FiniteSet);

    function MultiValue(elements) {
        FiniteSet.call(this, elements);
    }


    MultiValue.prototype.default = function (x) {
        this.operator('default', x);
    };

    MultiValue.prototype['+'] = function (x) {
        this.operator('+', x);
    };

    MultiValue.prototype['*'] = function (x) {
        this.operator('*', x);
    };

    MultiValue.prototype.operator = function (operator, x) {

        if (x instanceof MultiValue) {
            var res = [];
            for(var i = 0; i < this.elements.length; i++) {
                for(var j = 0; j < x.elements.length; j++) {
                    var n = this.elements[i][operator](j);
                    res.push(n);
                }
            }

            return new MultiValue(res);
        } else {
            return this.map(function (a) {
                return a[operator](x);
            });
        }
    };


    function quadrant(x) {
        if (x instanceof Expression.NumericalReal) {
            return x.value > 0 ? '+' : '-';
        }
        if (x instanceof Expression.Symbol.Real) {
            return '+-';
        }
        if (x instanceof Expression.List.Real) {
            if (x.operator === '^') {
                var q0 = quadrant(x[0]);
                var n = x[1].value;

                if (q0 === '+') return '+';
                if (q0 === '-' || q0 === '+-') return n % 2 === 0 ? '+' : '-';

                return '+-';
            }
            var q = [].map.call(x, quadrant);

            if (q[0] === '+-' || q[1] === '+-') return '+-';

            switch (x.operator) {
                case '-':
                    if (q[1] === '-') q[1] = '+';
                    if (q[1] === '+') q[1] = '-';

                case '+': return q[0] === q[1] ? q[0] : '+-';


                case '/':
                case '*': return q[0] === q[1] ? '+' : '-';


            }
        }
    }

    function isPositive(x) {
        var s = quadrant(x);
        return s === '+';
    }

    global['sqrt'] = new Expression.Function({
        default: function (x) {

            if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                var sqrtMagX = Math.sqrt(v)
                if(v < 0) {
                    return new Expression.List.ComplexCartesian([
                        global.Zero, new Expression.NumericalReal(sqrtMagX)
                    ]);
                }
                return new Expression.NumericalReal(sqrtMagX);

            } else if (x instanceof Expression.List.ComplexPolar) {
                return new Expression.List.ComplexPolar([
                    x[0],
                    x[1]['/'](new Expression.Integer(2))
                ]);
            } else if (x instanceof Expression.List) {
                var pos = isPositive(x);

                // if it is positive
                if (pos === '+') {
                    return Expression.List.Real([global.sqrt, x]);
                    
                } else {
                    return Expression.List([global.sqrt, x]);
                }

            } else if (x instanceof Expression.List.ComplexCartesian) {
                return new Expression.List([global.sqrt, x]);
            }

            return Expression.List([global.sqrt, x]);

            throw('SQRT: ???');
            switch (x.constructor) {
                case Expression.Complex:
                    //http://www.mathpropress.com/stan/bibliography/complexSquareRoot.pdf
                    var sgn_b;
                    if (x._imag === 0.0) {
                        return new Expression.Complex(Math.sqrt(x._real), 0);
                    } else if(x._imag>0) {
                        sgn_b = 1.0;
                    } else {
                        sgn_b = -1.0;
                    }
                    var s_a2_b2 = Math.sqrt(x._real * x._real + x._imag * x._imag);
                    var p = one_on_rt2 * Math.sqrt(s_a2_b2 + x._real);
                    var q = sgn_b * one_on_rt2 * Math.sqrt(s_a2_b2 - x._real);
                case Expression.NumericalReal:
                    return new Expression.RealNumerical(Math.sqrt(x));
                case Expression.List.Real:
                case Expression.List:
                    if (x.operator === '^') {
                        return global.abs.apply(undefined, x[0].apply('^', x[1].apply('/', new Expression.NumericalReal(2,0))));
                    }
                default:
                    return Expression.List([global.sqrt, x]);
            }
        },
        apply_realimag: function(op, x) {
            //TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
            
            //Uses exp, atan2 and log functions. A really bad idea. (square rooting, then squaring, then atan, also [exp(log)])
            return x['^'](new Expression.Rational(1, 2)).realimag();
            //var ri = x.realimag();
            //return [Expression.List([global.sqrt, x]), M.global.Zero];
        },
        'text/latex': '\\sqrt',
        'text/javascript': 'Math.sqrt',
        'x-shader/x-fragment': 'sqrt',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Sqrt Function',
        description: 'See http://en.wikipedia.org/wiki/Square_Root',
        examples: ['\\sqrt (x^4)'],
        related: ['pow', 'abs', 'mod']
    });
    global['abs'] = new Expression.Function({
        default: function (x) {
            //Using abs is better (I think) because it finds the method through the prototype chain,
            //which is going to be faster than doing an if list / switch case list.
            return x.abs();
        },
        'text/latex': '\\abs',
        'text/javascript': 'Math.abs',
        'x-shader/x-fragment': 'abs',
        titie: 'Absolute Value Function',
        description: 'Abs',
        examples: ['\\abs (-3)', '\\abs (i+3)'],
        related: ['arg', 'tan']
    });

    // It is self-referential
    global.abs.derivative = (function () {
            var s = new Expression.Symbol.Real();
            var y = s['/'](s.abs());
            return new Expression.Function.Symbolic(y, [s]);
    }());
    global['arg'] = {
        default: function (x) {
            console.warn('ARG IS FOR USER INPUT ONLY. USE .arg()');
            //Using abs is better (I think) because it finds the method through the prototype chain,
            //which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
            return x.arg();
        },
        'text/latex': '\\arg', //temp
        'text/javascript': 'Math.arg_real',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        titie: 'Arg Function',
        description: 'Arg',
        examples: ['\\arg (-3)', '\\arg (3)', '\\arg(3+2i)'],
        related: ['abs']
    }



    global['e'] = new Expression.NumericalReal(Math.E, 0);
    global['e'].title = 'e';
    global['e'].description = 'The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.';
    global.e.s = function (lang) {
        if(lang === 'text/javascript') {
            return new Code('Math.E');
        }
        if(lang == 'text/latex') {
            return new Code('e');
        }
        return new Code('2.718281828459045');
    };


    global['pi'] = new Expression.NumericalReal(Math.PI, 0);
    global['pi'].title = 'Pi';
    global['pi'].description = '';
    global.pi.s = function (lang) {
        if(lang === 'text/javascript') {
            return new Code('Math.PI');
        }
        if(lang === 'text/latex') {
            return new Code('\\pi');
        }
        return new Code('3.141592653589793');
    };
    // The real circle constant:
    global.tau = global['pi']['*'](new Expression.Integer(2));


    global.log.derivative = new Expression.Function.Symbolic(global.One['/'](new Expression.Symbol.Real()));

    global['i'] = new Expression.List.ComplexCartesian([global['Zero'], global['One']]);
    global['i'].title = 'Imaginary Unit';
    global['i'].description = 'A number which satisfies the property <m>i^2 = -1</m>.';
    global['i'].realimag = function(){
        return Expression.List.ComplexCartesian([
            global.Zero,
            global.One
        ]);
    };
    global['i']['*[TODO]'] = function (x) {
        
    };

    global['d'] = new Expression.Function({
        default: function(x) {
            return new Expression.Infinitesimal(x);
        }
    });

    global.d['/'] = function (x) {
        if(x instanceof Expression.Infinitesimal) {
            if(x.x instanceof Expression.Symbol) {
        
                // Derivative operator
                
                return new Derivative(x.x);
            }
            if(x.x instanceof Expression.Vector) {
                return Expression.Vector(Array.prototype.map.call(x.x, function (x) {
                    return new Derivative(x);
                }));
            }
            throw new Error('Confusing infitesimal operator division');
        }

        throw('Dividing d by some large number.');
        
    };
    global['undefined'] = {
        s: function (lang){
            if (lang === 'text/javascript') {
                return new Code('undefined');
            } else if (lang === 'x-shader/x-fragment') {
                return new Code('(1.0/0.0)');
            }
        },
        differentiate: function (){
            return this;
        },
        '*': function (){
            return this;
        },
        '+': function (){
            return this;
        },
        '-': function () {
            return this;
        },
        '/': function () {
            return this;
        },
        '^': function () {
            return this;
        },
        '@-': function () {
            return this;
        }
    };
    global['sum'] = new Expression.Function({
        default: function (x) {
            throw('Sum not properly constructed yet.');
            return 3;
        }
    });
    global['sum']['_'] = function (eq) {
        // start: 
        var t = eq[0];
        var v = eq[1];
        return new Expression.Sum.Real(t, v);
    }
    
};
})()
},{"util":11,"../Expression":7}],7:[function(require,module,exports){
(function(){var Global = require('../global');

function Expression() {
    
}

module.exports = Expression;

Expression.List                   = require('./List');
Expression.List.Real              = require('./List/Real');
Expression.List.ComplexCartesian  = require('./List/ComplexCartesian');
Expression.List.ComplexPolar      = require('./List/ComplexPolar');
Expression.Constant               = require('./Constant');
Expression.NumericalComplex       = require('./NumericalComplex');
Expression.NumericalReal          = require('./NumericalReal');
Expression.Rational               = require('./Rational');
Expression.Integer                = require('./Integer');
Expression.Symbol                 = require('./Symbol');
Expression.Symbol.Real            = require('./Symbol/Real');
Expression.Statement              = require('./Statement');
Expression.Vector                 = require('./Vector');
Expression.Matrix                 = require('./Matrix');
Expression.Function               = require('./Function');
Expression.Function.Symbolic      = require('./Function/Symbolic');
Expression.Infinitesimal          = require('./Infinitesimal');

var _ = Expression.prototype;

_.toString = null;
_.valueOf = null;

_.imageURL = function () {
    return 'http://latex.codecogs.com/gif.latex?' +
        encodeURIComponent(this.s('text/latex').s);
};

_.renderLaTeX = function () {
    var image = new Image();
    image.src = this.imageURL();
    return image;
};

// substution default:
_.sub = function () {
    return this;
};

// limit default
_.lim = function (x, y) {
    return this.sub(x, y);
};

_[','] = function (x) {
    if(x instanceof Expression.Statement) {
        return new Expression.Conditional(x, this);
    }
    return Expression.Vector([this, x]);
};


['=', '!=', '>', '>=', '<', '<='].forEach(function (operator) {
    _[operator] = function (x) {
        return new Expression.Statement(this, x, operator);
    };
});



// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = function (x) {
    return this['*'](x);
};


// The default operator occurs when two expressions are adjacent to eachother: S -> e e.
// Depending on the type, it usually represents associative multiplication.
// See below for the default '*' operator implementation.
_.default = function (x) {
    return this['*'](x);
};

['/', '+', '-', '@-', '^', '%'].forEach(function (operator) {
    _[operator] = function (x) {
        return new Expression.List([this, x], operator);
    };
});




// This may look like we are assuming that x is a number,
// but really the important assumption is simply
// that it is finite.
// Thus infinities and indeterminates should ALWAYS
// override this operator

_['*'] = function (x) {
    if(x === Global.Zero) {
        return x;
    }
    if(x === Global.One) {
        return this;
    }
    return new Expression.List([this, x], '*');
};











})()
},{"./Constant":19,"./NumericalComplex":20,"./NumericalReal":21,"./Rational":22,"./Integer":23,"../global":10,"./List/Real":24,"./List":25,"./List/ComplexPolar":26,"./Symbol/Real":27,"./List/ComplexCartesian":28,"./Symbol":29,"./Statement":30,"./Vector":31,"./Matrix":32,"./Function":33,"./Infinitesimal":34,"./Function/Symbolic":35}],14:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],15:[function(require,module,exports){
(function(process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

})(require("__browserify_process"))
},{"__browserify_process":1}],17:[function(require,module,exports){
(function(){// stop jshint from complaing about Function (which it calls eval)
/*jshint -W061 */

module.exports = Code;

function Code(s, pre){
    this.pre = [] || pre;
    this.s = '' || s;
    this.vars = 0;
    this.p = Infinity;
}

var _ = Code.prototype;

/*
    This uses a global state.

    Perhaps there is a nicer way, but this will work.
*/
Code.newContext = function () {
    Code.contextVariableCount = 0;
};

Code.newContext();

// For faster evaluation multiple statments. For example (x+3)^2 will first calculate x+3, and so on.
_.variable = function () {
    return 't' + (Code.contextVariableCount++).toString(36);
};

_.merge = function (o, str, p, pre) {
    this.s = str;
    if (pre) {
        this.pre.push(pre);
    }
    var i;
    this.pre.push.apply(this.pre, o.pre);
    this.vars += o.vars;
    this.p = p;
    return this;
};

_.update = function (str, p, pre) {
    this.p = p;
    if(pre) {
        this.pre.push(pre);
    }
    this.s = str;
    return this;
};

// Javascript compliation
_.compile = function (x) {
    return Function(x, this.pre.join('\n') + 'return ' + this.s);
};

_.glslFunction = function (type, name, parameters) {
    return type + ' ' + name + '(' + parameters + '){\n' + this.pre.join('\n') + 'return ' + this.s + ';\n}\n';
};


})()
},{}],18:[function(require,module,exports){
module.exports = function stringify(expr, lang) {
    return expr.s(lang);
};

},{}],19:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./');
var Global = require('../global');
var Expression = require('./');

module.exports = Constant;

util.inherits(Constant, sup);

function Constant() {
    throw new Error('Expression.Constant created directly');
}

var _ = Constant.prototype;

_.simplify = function() {
    return this;
};

_.differentiate = function() {
    return Global.Zero;
};

_.apply = function (x){
    return this['*'](x);
};

})()
},{"util":11,"./":7,"../global":10}],22:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./NumericalReal');
var Global = require('../global');
var Expression = require('./');

module.exports = Rational;

util.inherits(Rational, sup);

function Rational(a, b) {
    this.a = a;
    this.b = b;
}

var _ = Rational.prototype;


_.__defineGetter__("value", function () {
    return this.a / this.b;
});

_['+'] = function (x) {
    if(this.a === 0) {
        return x;
    }
    if(x instanceof Rational){
        /*
            a   c     ad   cb    ad + bc
            - + -  =  -- + -- =  -------
            b   d     bd   bd      b d
        */
        return new Rational(this.a * x.b + this.b * x.a, this.b * x.b);
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.NumericalComplex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        console.warn('Swapped operator order for + with Rational');
        return (x)['+'](this);
        // throw ('Unknown Type for Rational +');
    }
    
    
};

_['-'] = function (x) {
    if(this.a === 0) {
        return x['@-']();
    }
    if(x instanceof Rational){
        /*
            a   c     ad   cb    ad + bc
            - + -  =  -- + -- =  -------
            b   d     bd   bd      b d
        */
        return new Rational(this.a * x.b - this.b * x.a, this.b * x.b);
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.NumericalComplex(this.value - x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x['@-']())['+'](this);
    } else {
        console.warn('Swapped operator order for - with Rational');
        return (x)['+'](this);
        // throw ('Unknown Type for Rational +');
    }
};

_['*'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof Rational){
        return new Rational(this.a * x.a, this.b * x.b);
    }
    return sup.prototype['*'].call(this, x);
};


_['/'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof Rational){
        if (x.a === 0) {
            throw('Division By Zero is not defined for Rational numbers!');
        }
        return new Rational(this.a * x.b, this.b * x.a).reduce();
    }
    return Expression.NumericalReal.prototype['/'].call(this, x);
};

_['^'] = function (x) {
    if(x === Global.Zero) {
        return Global.One;
    }
    if(x === Global.One) {
        return this;
    }
    if(this.a === 0) {
        return Global.Zero;
    }
    if(this.a === this.b) {
        return Global.One;
    }
    if(x instanceof Expression.Integer) {
        return new Rational(
            Math.pow(this.a, x.a),
            Math.pow(this.b, x.a)
        );
    } else if (x instanceof Rational) {
        
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        }

        return Expression.NumericalReal.prototype['^'].call(
            this,
            x
        );
        
    }

    return Expression.List([this, x], '^');
    
};

_.reduce = function () {
    // mutable.
    function gcd(a, b) {
        if(b === 0) {
            return a;
        }
        return gcd(b, a % b);
    }
    var g = gcd(this.b, this.a);
    this.a /= g;
    this.b /= g;
    if(this.b === 1) {
        return new Expression.Integer(this.a);
    }
    if(this.b < 0) {
        this.a = -this.a;
        this.b = -this.b;
    }
    
    return this;
};

})()
},{"util":11,"./NumericalReal":21,"../global":10,"./":7}],20:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./Constant');
var Global = require('../global');
var Expression = require('./');

module.exports = NumericalComplex;

util.inherits(NumericalComplex, sup);

function NumericalComplex(real, imag) {
    this._real = real;
    this._imag = imag;
}

var _ = NumericalComplex.prototype;

_.real = function() {
    return new Expression.NumericalReal(this._real);
};

_.imag = function() {
    return new Expression.NumericalReal(this._imag);
};

_.realimag = function() {
    return Expression.List.ComplexCartesian([
        new Expression.NumericalReal(this._real),
        new Expression.NumericalReal(this._imag)
    ]);
};

_.conjugate = function() {
    return new Expression.NumericalComplex(this._real, -this._imag);
};

_['+'] = function (x) {
    if(this._real === 0 && this._imag === 0) {
        return x;
    }
    if(x instanceof Expression.NumericalComplex){
        return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
    } else if (x instanceof Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real + x.value, this._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for NumericalComplex +');
    }
};

_['-'] = function (x) {
    if(this._real === 0 && this._imag === 0) {
        return x['@-']();
    }
    if(x instanceof Expression.NumericalComplex){
        return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real - x.value, this._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x['@-']())['+'](this);
    } else {
        throw ('Unknown Type for NumericalComplex -');
    }
};

_['*'] = function (x) {
    if(this._imag === 0) {
        if(this._real === 0) {
            return Global.Zero;
        }
        if(this._real === 1) {
            return x;
        }
    }
    
    if(x.constructor === this.constructor){
        return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['*'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['*'](this);
    } else {
        throw ('Unknown Type for NumericalComplex *');
    }
};

_['/'] = function (x) {
    if(this._imag === 0 && this._real === 0) {
        // TODO: Provided x != 0
        return Global.Zero;
    }
    
    if(x.constructor === this.constructor){
        var cc_dd = x._real * x._real + x._imag * x._imag;
        return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real * x._imag) / cc_dd);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return this.realimag()['/'](x);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return this.polar()['/'](x);
    } else if(x.constructor === Expression.List.Real) {
        return Expression.List([this, x], '/');
    } else if(x.constructor === Expression.Symbol.Real) {
        return Expression.List([this, x], '/');
    } else if(x.constructor === Expression.List) {
        return Expression.List([this, x], '/');
    } else {
        throw ('Unknown Type for NumericalComplex /');
    }
};

_['!'] = function (){
    return Global.Gamma.apply(this);
};

// (function(){
//     return;
//     var one_on_rt2 = 1/Math.sqrt(2);
//     Expression.NumericalComplex.prototype.apply = function(operator, x) {
//         switch (operator){
//             case '^':
//                 if(this._real === 0 && this._imag === 0) {
//                     return Global.Zero; // Contradicts x^0 = 1
//                 }
//                 break;
//             case '+':
//                 if(this._real === 0 && this._imag === 0) {
//                     return x;
//                 }
//                 break;
//             case '-':
//                 if(this.value === 0) {
//                     return x.apply('@-');
//                 }
//                 break;
//             case undefined:
//             case '*':
//                 if(this._real === 1 && this._imag === 0){
//                     return x;
//                 }
//                 //Note: There is not meant to be a break here.
//             case '/':
//                 if(this._real === 0 && this._imag === 0){
//                     return Global.Zero; //Contradics x/0 = Infinity
//                 }
//         }
//         if (operator === ',') {
//             return Expression.Vector([this, x]);
//         } else if (x === undefined) {
//             switch (operator) {
                
//                 case '@+':
//                     return this;
//                 case '@-':
//                     return new Expression.NumericalComplex(-this._real, -this._imag);
//                 case '\u221A':
//                     throw('OLD SQRT. New one is a function, not operator.')
//                     return new Expression.NumericalComplex(p, q);
//                 case '++':
//                 case '--':
//                     throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
//                 case '+=':
//                 case '-=':
//                 case '*=':
//                 case '/=':
//                     throw(new ReferenceError('Left side of assignment is not a reference.'));
//                 case '!':
//                     return Global.Gamma.apply(undefined, new Expression.NumericalComplex(this._real + 1, this._imag));
//             }
//         } else if (x.constructor === Expression.NumericalReal) {
//             switch (operator) {
//                 case '*':
//                 case undefined:
//                     return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
//                 case '+':
//                     return new Expression.NumericalComplex(this._real + x.value, this._imag);
//                 case '-':
//                     return new Expression.NumericalComplex(this._real - x.value, this._imag);
//                 case '/':
//                     return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
//                 case '^':
//                     var a = this._real;
//                     var b = this._imag;
//                     var c = x.value;

//                     var hlm = 0.5 * Math.log(a*a + b*b);
//                     var theta = Math.atan2(b, a);
//                     var hmld_tc = theta * c;
//                     var e_hmlc_td = Math.exp(hlm * c);
//                     return new Expression.NumericalComplex(
//                         (e_hmlc_td * Math.cos(hmld_tc)),
//                         (e_hmlc_td * Math.sin(hmld_tc))
//                     );
//                 default:
//             }
//         } else if (x.constructor === this.constructor) {
//             switch (operator) {
//                 case '*':
//                 case undefined:
//                     // (a+bi)(c+di) = (ac-bd) + (ad+bc)i 
//                     return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
//                 case '+':
//                     return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
//                 case '-':
//                     return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
//                 case '/':
//                     //  (a+bi)/(c+di) 
//                     //= [(a+bi)(c-di)]/[(c+di)(c-di)]
//                     //= [(a+bi)(c-di)]/[cc + dd]
//                     //= [ac -dai +bci + bd]/[cc+dd]
//                     //= [ac + bd + (bc - da)]/[cc+dd]
//                     var cc_dd = x._real * x._real + x._imag * x._imag;
//                     return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real*x._imag)/cc_dd);
//                 case '^':
//                     var a = this._real;
//                     var b = this._imag;
//                     var c = x._real;
//                     var d = x._imag;

//                     var hlm = 0.5 * Math.log(a*a + b*b);
//                     var theta = Math.atan2(b, a);
//                     var hmld_tc = hlm * d + theta * c;
//                     var e_hmlc_td = Math.exp(hlm * c - theta * d);
//                     return new Expression.NumericalComplex(
//                         (e_hmlc_td * Math.cos(hmld_tc)),
//                         (e_hmlc_td * Math.sin(hmld_tc))
//                     );
//                 default:
//             }
//         } else if(x.constructor === Expression.List.ComplexCartesian) {
//             return this.realimag().apply(operator, x);
//         } else if(x.constructor === Expression.List.ComplexPolar) {
//             return this.polar().apply(operator, x);
//         } else if(x.constructor === Expression.List.Real) {
//             return this.realimag().apply(operator, x);
//         } else if(x.constructor === Expression.Symbol.Real) {
//             return this.realimag().apply(operator, x);
//         }
//         console.error('cmplx . ' + operator + ' => E.List?');
//         /*
//         if(this._real === 0.0 && this._imag === 0.0){
//             return this;
//         }
//         */
        
        
//         return this.realimag().apply(operator, x);
//         return Expression.List([this, x], operator);
//     }
    
// }());

})()
},{"util":11,"./Constant":19,"../global":10,"./":7}],21:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./NumericalComplex');
var Global = require('../global');
var Expression = require('./');
module.exports = NumericalReal;

util.inherits(NumericalReal, sup);

function NumericalReal(e) {
    this.value = e;
}

var _ = NumericalReal.prototype;

Object.defineProperty(_, "_real", {
    get: function () {
        return this.value;
    }
});
_._imag = 0;

_.real = function() {
    return this;
};
_.imag = function() {
    return Global.Zero;
};
_.realimag = function() {
    return Expression.List.ComplexCartesian([
        this,
        Global.Zero
    ]);
};
_.conjugate = function() {
    return this;
};

_['+'] = function (x) {
    if(this.value === 0) {
        return x;
    }
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value + x.value);
    }
    return x['+'](this);
};

_['@-'] = function (x) {
    return new NumericalReal(-this.value);
};

_['-'] = function (x) {
    if(this.value === 0) {
        return x;
    }
    if(x instanceof NumericalReal) {
        return new NumericalReal(this.value - x.value);
    }
    return x['@-']()['+'](this);
};


_['%'] = function (x) {
    var nonreal = 'The modular arithmetic operator \'%\' is not defined for non-real numbers.';
    if(this.value === 0) {
        return Global.Zero;
    }
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value % x.value);
    } else if(x.constructor === Expression.List.Real) {
        return Expression.List.Real([this, x], '%');
    } else if(x.constructor === Expression.Symbol.Real) {
        return Expression.List.Real([this, x], '%');
    } else if(x.constructor === Expression.List) {
        throw('Not sure about this...');
        // Not sure about this
        // return Expression.List.Real([this, x], '%');
    } else if (x.constructor === Expression.NumericalComplex) {
        throw(new TypeError(nonreal));
    } else if (x.constructor === Expression.List.ComplexCartesian) {
        throw(new TypeError(nonreal));
    } else if (x.constructor === Expression.List.ComplexPolar) {    
        throw(new TypeError(nonreal));
    } else {
        throw ('Unknown Type for NumericalReal %');
    }
};
_['*'] = function (x) {
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value * x.value);
    }
    return x['*'](this);
};
_['/'] = function (x) {
    if(this.value === 0) {
        return Global.Zero;
    }
    if(x instanceof NumericalReal){
        if(x.value === 0) {
            throw('Division by zero not allowed!');
        }
        return new NumericalReal(this.value / x.value);
    } else if (x.constructor === Expression.NumericalComplex) {
        var cc_dd = x._real * x._real + x._imag * x._imag;
        return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value * x._imag) / cc_dd);
    } else if(x instanceof Expression.List.ComplexCartesian) {
        // a/(x+yi) = a/(x+yi) (x-yi)/(x-yi) = a(x-yi) / (x^2 + y^2)
        var x_conj = Expression.List.ComplexCartesian([
            x[0],
            x[1]['@-']()
        ]);
        var two = NumericalReal(2);
        return x_conj['*'](this)['/'](
            (x[0]['^'])(two)
            ['+'] (
                (x[1]['^'])(two)
            )
        );
    // } else if(x instanceof Expression.List.ComplexPolar) {
        
    } else if(x instanceof Expression.List.Real) {
        // TODO: given x != 0
        return Expression.List.Real([this, x], '/');
    } else if(x instanceof Expression.Symbol.Real) {
        // TODO: given x != 0
        return Expression.List.Real([this, x], '/');
    } else if(x instanceof Expression.List) {   
        return Expression.List([this, x], '/');
    } else {
        console.log('Unknown type: ', this, x);
        throw ('Unknown Type for NumericalReal /');
    }
};
_['^'] = function (x) {
    if (this.value === 0) {
        return Global.Zero;
    }
    if (this.value === 1) {
        return Global.One;
    }
    if(x === Global.Zero) {
        return Global.One;
    }
    if(x === Global.One) {
        return this;
    }
    if (x instanceof Expression.Integer) {
        return new NumericalReal(Math.pow(this.value, x.a));
    } else if(x instanceof NumericalReal){
        if(this.value > 0) {
            return new NumericalReal(Math.pow(this.value, x.value));
        }
        // TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
        //      <- I think no, because why else start with a numerical. Implement a rational/integer type
        var r = Math.pow(-this.value, x.value);
        var theta = Math.PI * x.value;
        return new Expression.List.ComplexPolar([
            new NumericalReal(r),
            new NumericalReal(theta)
        ]);
    } else if (x.constructor === Expression.NumericalComplex) {
        var a = this.value;
        var c = x._real;
        var d = x._imag;
        console.error('Bad implementation ( num ^ complex)');
        var hlm = 0.5 * Math.log(a*a);
        var hmld_tc = hlm * d;
        var e_hmlc_td = Math.exp(hlm * c);
        return new Expression.NumericalComplex(
            (e_hmlc_td * Math.cos(hmld_tc)),
            (e_hmlc_td * Math.sin(hmld_tc))
        );
    } else if (x.constructor === Expression.List.ComplexCartesian) {
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List.ComplexPolar) {
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List.Real) {
        if(this.value > 0) {
            return Expression.List.Real([this, x], '^');
        }
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.Symbol.Real) {
        if(this.value > 0) {
            return Expression.List.Real([this, x], '^');
        }
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List) {
        return Expression.List([this, x], '^');
    } else {
        throw console.error ('Unknown Type for NumericalReal ^', x, x instanceof NumericalReal);
    }
};
_['>'] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value > x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['>'].call(this, x);
};
_['<'] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value < x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['<'].call(this, x);
};
_['<='] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value <= x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['<='].call(this, x);
};
_['>='] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value >= x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['>='].call(this, x);
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        var num = this.value.toExponential();
        if(num.indexOf('.') === -1){
            num = num.replace('e','.e');
        }
        return new Code(num);
    }
    return new Code(this.value.toString());
};
// _.applyOld = function(operator, x) {
//     switch (operator){
//         case ',':
//             return Expression.Vector([this, x]);
//         case '^':
//             if(this.value === 0) {
//                 return Global.Zero; // Contradicts x^0 = 1
//             }
//             break;
//         case '+':
//             if(this.value === 0) {
//                 return x;
//             }
//             break;
//         case '-':
//             if(this.value === 0) {
//                 return x.apply('@-');
//             }
//             break;
//         case undefined:
//         case '*':
//             if(this.value === 1){
//                 return x;
//             }
//             //Note: There is not meant to be a break here.
//         case '/':
//             if(this.value === 0){
//                 return Global.Zero; //Contradics x/0 = Infinity
//             }
//     }
//     if(x === undefined){
//         //Unary
//         switch (operator) {
//             case '@+':
//                 return this;
//             case '@-':
//                 return new NumericalReal(-this.value);
//             case '++':
//             case '--':
//                 throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
//             case '+=':
//             case '-=':
//             case '*=':
//             case '/=':
//                 throw(new ReferenceError('Left side of assignment is not a reference.'));
//             case '!':
//                 return Global.Gamma.apply(undefined, new NumericalReal(this.value + 1));
//         }
//     } else if(x.constructor === this.constructor){
//         switch (operator) {
//             case '*':
//             case undefined:
//                 return new NumericalReal(this.value * x.value);
//             case '+':
//                 return new NumericalReal(this.value + x.value);
//             case '-':
//                 return new NumericalReal(this.value - x.value);
//             case '/':
//                 return new NumericalReal(this.value / x.value);
//             case '^':
//                 if(this.value > 0) {
//                     return new NumericalReal(Math.pow(this.value, x.value));
//                 } else {
//                     // TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
//                     var r = Math.pow(-this.value, x.value)
//                     var theta = Math.PI * x.value;
//                     return new Expression.Complex(r*Math.cos(theta), r*Math.sin(theta));
//                 }
//             default:
            
//         }
//     } else if (x.constructor === Expression.Complex) {
//         switch (operator) {
//             case '*':
//             case undefined:
//                 return new Expression.Complex(this.value * x._real, this.value * x._imag);
//             case '+':
//                 return new Expression.Complex(this.value + x._real, x._imag);
//             case '-':
//                 return new Expression.Complex(this.value - x._real, -x._imag);
//             case '/':
//                 var cc_dd = x._real * x._real + x._imag * x._imag;
//                 return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value*x._imag)/cc_dd);
//             case '^':
//                 var a = this.value;
//                 var c = x._real;
//                 var d = x._imag;
//                 console.error('Bad implementation ( num ^ complex)');
//                 var hlm = 0.5 * Math.log(a*a);
//                 var hmld_tc = hlm * d;
//                 var e_hmlc_td = Math.exp(hlm * c);
//                 return new Expression.Complex(
//                     (e_hmlc_td * Math.cos(hmld_tc)),
//                     (e_hmlc_td * Math.sin(hmld_tc))
//                 );
//             default:
//         }
//     } else if(x.constructor === Expression.List.ComplexCartesian) {
//         switch (operator) {
//             case '+':
//             case '-':
//                 return Expression.List.ComplexCartesian([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '/':
//                 return Expression.List.ComplexCartesian([
//                     x[0].apply(operator, this),
//                     x[1].apply(operator, this)
//                 ]);
//             case '^':
//                 console.warn('ineffecient: NR ^ CL');
//                 return this.realimag().apply(operator, x);
            
//         }
//     } else if(x.constructor === Expression.List.ComplexPolar) {
//         switch (operator) {
//             case '+':
//             case '-':
//             case '^':
//                 //(a+bi)+Ae^(ik)
//                 return Expression.List([this, x], operator);
//                 // or ? return this.apply(operator, x.realimag()); //Jump up to above +-
//             case undefined:
//                 operator = '*';
//             case '*':
//                 return Expression.List.ComplexPolar([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//             case '/':
//                 return Expression.List.ComplexPolar([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//         }
//     } else if (x.constructor === Expression.List.Real) {
//         switch(operator) {
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '+':
//             case '-':
//             case '/':
//                 return Expression.List.Real([this, x], operator);
//             case '^':
//                 if(this.value === 0){
//                     throw('N(0) ^ x');
//                 }
//                 if(this.value > 0) {
//                     return Expression.List.Real([this, x], operator);
//                 } else {
//                     return Expression.List.ComplexPolar([
//                         (new Expression.Numerical(-this.value)).apply('^', x),
//                         Global.pi.apply('*', x)
//                     ]);
//                 }
//         }
                
//     } else if (x.constructor === Expression.Symbol.Real) {
//         switch(operator) {
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '+':
//             case '-':
//             case '/':
//                 return Expression.List.Real([this, x], operator);
//             case '^':
//                 if(this.value === 0){
//                     throw('N(0) ^ x');
//                 }
//                 if(this.value > 0) {
//                     return Expression.List.Real([this, x], operator);
//                 } else {
//                     return Expression.List.ComplexPolar([
//                         Expression.List.Real([(new NumericalReal(-this.value)), x], '^'),
//                         Global.pi.apply('*', x)
//                     ]);
//                 }
//         }
//     }
//     throw('?? - real');
//     return Expression.List([this, x], operator);
// };

})()
},{"util":11,"./NumericalComplex":20,"../global":10,"./":7}],23:[function(require,module,exports){
(function(){var util = require('util');
var sup = require('./Rational');
var Global = require('../global');
var Expression = require('./');

module.exports = Integer;

util.inherits(Integer, sup);

function Integer(x) {
    this.a = x;
}

var _ = Integer.prototype;

_.b = 1;

_['+'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a + x.a);
    }
    return x['+'](this);
};

_['-'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a - x.a);
    }
    return sup.prototype['-'].call(this, x);
};

_['/'] = function (x) {
    if(x instanceof Integer) {
        if(this.a % x.a === 0) {
            return new Integer(this.a / x.a);
        }
        return new sup(this.a, x.a);
    }
    return sup.prototype['/'].call(this, x);
};

_['@-'] = function () {
    return new Integer(-this.a);
};

_['*'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a * x.a);
    }
    return x['*'](this);
};

_['^'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(Math.pow(this.a, x.a));
    } else if (x.constructor === sup) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        } else {
            return Expression.NumericalReal.prototype['^'].call(
                this,
                x
            );
        }
    } else if (x.constructor === Expression.List.Real || x.constructor === Expression.Symbol.Real) {
        if(this.a > 0) {
            return Expression.List.Real([
                this,
                x
            ], '^');
        }
    }
    return Expression.NumericalReal.prototype['^'].call(
        this,
        x
    );
    
};

_['%'] = function (x) {
    if(x instanceof Integer) {
        return new Integer(this.a % x.a);
    } else if (x.constructor === sup) {
        return new sup();// @todo: !
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalReal(this % x.value);
    } else {
        return Expression.List.Real([this, x], '%');
    }
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        return new Code(this.a.toString() + '.0');
    }
    return new Code(this.a.toString());
};
})()
},{"util":11,"./Rational":22,"../global":10,"./":7}],25:[function(require,module,exports){
var util = require('util'),
    sup  = require('../'),
    Expression = require('../');

module.exports = List;

util.inherits(List, sup);

/*
    Expression.List should be avoided whenever Expression.List.Real can
    be used. However, knowing when to use Real is an impossible (?) task,
    so sometimes this will have to do as a fallback.
*/
function List(e, operator) {
    e.__proto__ = Expression.List.prototype;
    e.operator = operator;
    return e;
}

List.prototype._s = function (Code, lang) {
    if (lang === 'text/latex' || lang === 'text/javascript') {
        try{
            return Expression.List.Real.prototype._s.apply(this, arguments);
        }
        catch (e) {
            throw (new Error('Use real(), imag(), or abs(), or arg() first.'));
        }
    }
    throw(new Error('Use real(), imag(), or abs(), or arg() first.'));
};

List.prototype.sub = function (x, y) {
    var a = this[0].sub(x, y);
    var b = this[1] && this[1].sub(x, y);

    return a[this.operator || 'default'](b);
};

List.prototype.map = function (f) {
    var elements = Array.prototype.map.call(this, f);
    return elements[0][this.operator || 'default'].apply(this, elements.slice(1));
};
},{"util":11,"../":7}],30:[function(require,module,exports){
var util = require('util');
var sup = require('../');
var Expression = require('../');

function TruthValue(v) {

}

module.exports = Statement;

util.inherits(TruthValue, sup);
util.inherits(Statement, sup);

var _ = TruthValue.prototype;

var True = TruthValue.True = new TruthValue();
var False = TruthValue.False = new TruthValue();

//Only difference: NOT operator
False['~'] = function () {
    return True;
};

// negation operator
_['~'] = function () {
    return False;
};

// disjunction
_.V = function (e) {
    return e === True ? e : this;
};

// conjunction
_['^'] = function (e) {
    return e === True ? this : e;
};


function Statement(x, y, operator) {
    this.a = x;
    this.b = y;

    this.operator = operator;
}

var _ = Statement.prototype;
_['='] = function () {
    
};
_['<'] = function () {
    // a < b < c
    // (a < b) = b
    // b < c
    
    // a < (b < c)
    // a < b .. (b < c) = b
    // (a < b) = a.
};
_.solve = function (vars) {
    // a = b
    // If b has an additive inverse?
    
    // a - b = 0
    var a_b = (this.a)['-'](this.b);
    /*
    Examples:
    (1,2,3) - (x,y,z) = 0 (solve for x,y,z)
    (1,2,3) - x = 0 (solve for x)
    */
    return a_b.roots(vars);
};

},{"util":11,"../":7}],29:[function(require,module,exports){
(function(){var util = require('util'),
    sup  = require('../'),
    Global = require('../../global');
var Expression = require('../');

module.exports = Symbol;

util.inherits(Symbol, sup);

function Symbol(str) {
    this.symbol = str;
}

var _ = Symbol.prototype;

_.differentiate = function (x) {
    return this === x ? Global.One : Global.Zero;
};
_.integrate = function (x) {
    if (this === x) {
        return new Expression.NumericalReal(0.5, 0) ['*'] (x ['^'] (new Expression.NumericalReal(2,0)));
    }
    return (this) ['*'] (x);
};
_.sub = function (x, y) {
    // TODO: Ensure it is real (for Expression.Symbol.Real)
    return this === x ? y : this;
};

_._s = function (Code, x) {
    return new Code(this.symbol || 'x_{free}');
};
})()
},{"util":11,"../":7,"../../global":10}],16:[function(require,module,exports){
(function(){var Expression = require('../Expression');
var Global = require('../global');

module.exports = function (s, base) {
    var self = this;
    if (s === '' || s === undefined) {
        return undefined;
    }

    s = s.replace(/ /g, '');
    
    var root = Object.create({});
    var context = root;
    
    var free = {};
    var bound = {};
    
    function down(vars) {
        var parent = context;
        context = Object.create(context);
        context.$parent = parent;
        var i;
        for (i in vars) {
            if (vars.hasOwnProperty(i)) {
                context[i] = vars[i];
            }
        }
    }
    
    function up(entity) {
        context = context.$parent;
        return entity;
    }
    /*
        Evaluate AST tree (top-down)
        
        Examples:
            * y=x^2
                ['=', y, ['^', x, 2]]
    
    */
    var loose = false;
    function evaluate(ast) {
        if (typeof ast === 'string') {
            var symbol;
            if ((symbol = context[ast])) {
                return symbol;
            } else if ((symbol = base[ast])) {
                bound[ast] = symbol;
            } else {
                free[ast] = symbol = new Expression.Symbol.Real(ast);
            }
            root[ast] = symbol;
            return symbol;
        } else if (ast.primitive) {
            return self.Construct[ast.type](ast.primitive);
        } else if (typeof ast === 'object') {
            
            var ast1 = evaluate(ast[1]);
            
            if (ast.length === 3) {
                switch (ast[0]) {
                    case 'frac':
                        ast[0] = '/';
                        break;
                    case '_':
                        // Don't bind underneath
                        if (ast[1] === 'sum') {
                            var limit = ast[2];
                            if (limit[0] === '=') {
                                // dummy variable: 
                                var x = new Expression.Symbol.Real(limit[1]);
                                
                                // lower limit
                                var a = evaluate(limit[2]);
                                var summinator = new Expression.Sum.Real(x, a);
                                summinator.vars = {};
                                summinator.vars[x.symbol] = x;
                                return summinator;
                            }
                        }
                        break;
                }
                if (ast[0] === 'default' && ast1.vars) {
                    down(ast1.vars);
                        var result = ast1[ast[0]](evaluate(ast[2]));
                        delete result.vars;
                    return up(result);
                }
                return ast1[ast[0]](evaluate(ast[2]));
            }
            if (ast.length === 2) {
                switch (ast[0]) {
                    case 'sqrt':
                        return Global.sqrt.default(evaluate(ast[1]));
                    case '!':
                        return Global.factorial.default(evaluate(ast[1]));
                }
                
                return evaluate(ast[1])[ast[0]]();
            }
            if (ast.length === 4) {
                return evaluate(ast[1])[ast[0]](evaluate(ast[1]), evaluate(ast[2]));
            }
        }
        return ast;
    }
    
    
    // Parse using context free grammar ([graph]/grammar/calculator.jison)
    var ast = this.cfg.parse(s);
    var result = evaluate(ast);
    result._ast = ast;
    if (root !== context) {
        throw('Context still open');
    }
    
    result.unbound = free;
    result.bound = bound;
    return result;
};



})()
},{"../Expression":7,"../global":10}],31:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression  = require('../');
var Global = require('../../global');

module.exports = Vector;

function Vector(e) {
    e.__proto__ = Vector.prototype;
    return e;
}

util.inherits(Vector, sup);

var _ = Vector.prototype;

_[',.'] = function (x) {
    return Vector(Array.prototype.concat.call(this, [x]));
};

_.differentiate = function (x) {
    return Vector(Array.prototype.map.call(this, function (c) {
        return c.differentiate(x);
    }));
};
_.cross = function (x) {
    if (this.length !== 3 || x.length !== 3) {
        throw('Cross product only defined for 3D vectors.');
    }
    /*
    i   j    k
    x   y    z
    a   b    c
    
    = (yc - zb, za - xc, xb - ya)
    */
    
    return new Vector([
        this[1].default(x[2])['-'](this[2].default(x[1])),
        this[2].default(x[0])['-'](this[0].default(x[2])),
        this[0].default(x[1])['-'](this[1].default(x[0]))
    ]);
};

// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = _.cross;
_.default = function (x) {
    var l = this.length;
    if (x instanceof Vector) {
        // Dot product
        if(l !== x.length) {
            throw('Vector Dimension mismatch.');
        }
        var i;
        var sum = Global.Zero;
        for (i = 0; i < l; i++) {
            sum = sum['+'](
                (this[i]).default(x[i])
            );
        }
        return sum;
    } else {
        // Scalar multiplication:
        return Vector(Array.prototype.map.call(this, function (c) {
            return c.default(x);
        }));
    }
};
_['*'] = _.default;
_['+'] = function (x, op) {
    var l = this.length;
    if(l !== x.length) {
        throw(new MathError('Vector Dimension mismatch.'));
    }
    var i;
    var n = new Array(l);
    for (i = 0; i < l; i++) {
        n[i] = this[i][op || '+'](x[i]);
    }
    return Vector(n);
};
_['-'] = function (x) {
    return this['+'](x, '-');
};
_['/'] = function (x) {
    if (x instanceof Vector) {
        throw('Vector division not defined');
    }
    return Vector(Array.prototype.map.call(this, function (c) {
        return c['/'](x);
    }));
    
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {
        if(x.a === 0) {
            throw('Raised to zero power');
        }
        if(x.a === 1) {
            return this;
        }
        if (x.a === 2) {
            var S = Global.Zero;
            var i, l = this.length;
            for (i = 0; i < l; i++) {
                S = S['+'](this[i]['^'](x));
            }
            return S;
        } else {
            return this['^'](new Expression.Integer(x.a - 1))['*'](this);
        }
    } else if(x instanceof Expression.Rational){
        return this['^'](x.a)['^'](Global.One['/'](x.b));
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.Complex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for Vector ^');
    }
    return this.default(this['^'](x['-'](Global.One)));
};

_.old_apply_operator = function(operator, e) {
    var l = this.length;
    var i;
    switch (operator) {
        case ',':
            //Array.prototype.push.apply(this, [e]);
            //Faster:
            //MODIFIES!!!!!!!!!
            this[l] = e;
            return this;
        case undefined:
        case '*':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var sum = M.Global.Zero;
            for (i = 0; i < l; i++) {
                sum = sum.apply('+', this[i].apply('*', e[i]));
            }
            return sum;
        case '+':
        case '-':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var n = new Array(l);
            for (i = 0; i < l; i++) {
                n[i] = this[i].apply(operator, e[i]);
            }
            return Vector(n);
        case '/':
        case '^':
            break;
        default:
            throw('Vector operation not allowed.');
    }
};

_.realimag = function(){
    var l = this.length;
    var _x = new Array(l);
    var _y = new Array(l);
    var i;
    for(i = 0; i < l; i++) {
        var ri = this[i].realimag();
        _x[i] = ri[0];
        _y[i] = ri[1];
    }
    return Expression.List.ComplexCartesian([
        Vector(_x),
        Vector(_y)
    ]);
};

_._s = function(Code, lang) {
    var l = this.length;
    var open = '[';
    var close = ']';
    if(lang === 'x-shader/x-fragment') {
        open = 'vec' + this.length + '(';
        close = ')';
    }
    var c = this[0]._s(Code, lang);
    var i;
    var t_s = [];
    for (i = 0; i < l; i++) {
        var c_i = this[i]._s(Code, lang);
        t_s.push(c_i.s);
        c = c.merge(c_i);
    }
    return c.update(open + t_s.join(',') + close, Infinity);
};
})()
},{"util":11,"../":7,"../../global":10}],32:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup = require('../');
var Expression = require('../');

module.exports = Matrix;

function Matrix(e, r, c) {
    e.__proto__ = Matrix.prototype;

    e.rows = r;
    e.cols = c;

    if (r != c) {
        throw new Error('Matrix size mismatch')
    }

    return e;
}

util.inherits(Matrix, sup);

var _ = Matrix.prototype;

_.default = _['*'] = function (x) {
    if(x.constructor === Expression.Matrix) {
        // Broken
        // O(n^3)
        if (x.rows !== this.cols) {
            throw ('Matrix dimensions do not match.');
        }
        var result = [];
        // result[x.rows * x.cols - 1 ] = undefined;
        var i, j, k, r = 0;
        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < x.cols; j++) {
                var sum = Global.Zero;
                for(k = 0; k < x.rows; k++) {
                    sum = sum['+'](x[k * x.cols + j]);
                }
                result[r++] = sum;
            }
        }
        return Expression.Matrix(result);
    } else {
        throw ('Unknown type');
    }
};

_.reduce = function (app) {
    var x, y;
    for(y = 0; y < this.rows; y++) {
        for(x = 0; x < y; x++) {
            // Make this[x,y] = 0
            var ma = this[x * this.cols + x];
            // 0 = this - (this/ma) * ma
            if(ma === Global.Zero) {
                throw ('Row swap!');
            }
            var tma = this[y * this.cols + x]['/'](ma);
            var i;
            for (i = x + 1; i < this.cols; i++) {
                this[y * this.cols + i] = this[y * this.cols + i]['-'](tma['*'](this[x * this.cols + i]));
            }
        }
    }
    return this;
};


},{"util":11,"../":7}],34:[function(require,module,exports){
(function(){var util  = require('util'),
    sup   = require('../'),
    Global = require('../../global'),
    Expression = require('../');

module.exports = Infinitesimal;
util.inherits(Infinitesimal, sup);
function Infinitesimal(x) {
    this.x = x;
}
var _ = Infinitesimal.prototype;

_['+'] = function (x) {
    if(x instanceof Infinitesimal) {
        throw new Error('Infinitesimal addition');
    }
    return x;
};
_['/'] = function (x) {
    if(x instanceof Infinitesimal) {
        if(x.x instanceof Expression.Symbol) {
            return this.x.differentiate(x.x);
        }
        throw new Error('Confusing infitesimal division');
    }
    this.x = this.x['/'](x);
    return this;
};
_['*'] = function (x) {
    // d^2 = 0
    if(x instanceof Infinitesimal) {
        return Global.Zero;
    }
    this.x = this.x['*'](x);
};
_.s = function (lang) {
    if(lang !== 'text/latex') {
        throw new Error('Infinitesimal numbers cannot be exported to programming languages');
    }
    var c = this.x.s(lang);
    var p = language.precedence('default')
    if(p > c.p) {
        c.s = '\\left(' + c.s + '\\right)';
    }
    return c.update('d' + c.s, p);
};

})()
},{"util":11,"../":7,"../../global":10}],33:[function(require,module,exports){
var util = require('util');
var sup  = require('../');
var Expression = require('../');

module.exports = EFunction;

util.inherits(EFunction, sup);

function EFunction (p) {
    this.default = p.default;
    this['text/latex'] = (p['text/latex']);
    this['x-shader/x-fragment'] = (p['x-shader/x-fragment']);
    this['text/javascript'] = (p['text/javascript']);
    this.derivative = p.derivative;
    this.realimag = p.realimag;
};

var _ = EFunction.prototype;

// @abstract
_.default = function (argument) {
    return;
};

// @abstract
_.differentiate = function () {
    if (this.derivative) {
        return this.derivative;
    }
    throw new Error('EFunction has no derivative defined.');
};

_._s = function (Code, lang) {
    if (this[lang]) {
        return new Code(this[lang]);
    }
    throw new Error('Could not compile function into ' + lang);
};

_['+'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['+'](x), [a]);
};

_['@-'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['@-'](), [a]);
};


},{"util":11,"../":7}],24:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression = require('../../');
var Global = require('../../../global')


module.exports = ListReal;

util.inherits(ListReal, sup);

function ListReal(x, operator) {
    x.__proto__ = ListReal.prototype;
    if(operator !== undefined) {
        x.operator = operator;
    }
    return x;
}

var _ = ListReal.prototype;

_.realimag = function (){
    return sup.ComplexCartesian([
        this,
        Global.Zero
    ]);
};
_.real = function (){
    return this;
};
_.imag = function (){
    return Global.Zero;
};
_.polar = function () {
    return sup.ComplexPolar([
        sup.Real([Global.abs, this]),
        sup.Real([Global.arg, this])
    ]);
};
_.abs = function (){
    return sup.Real([Global.abs, this]);
};
_.arg = function (){
    return sup.Real([Global.arg, this]);
};
_['+'] = function (x) {
    if(this === x) {
        return x['*'](new Expression.Integer(2));
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return this;
        }
    }
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '+' && this[1] instanceof Expression.NumericalReal) {
            return sup.Real([this[0], this[1]['+'](x)], this.operator);
        }
        if(this.operator === '-' && this[1] instanceof Expression.NumericalReal) {
            return sup.Real([this[0], x['-'](this[1])], '+');
        }
        
        return sup.Real([this, x], '+');
    }
    
    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        return sup.Real([this, x], '+');
    }
    return x['+'](this);
    
};
_['-'] = function (x) {
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return this;
        }
    }
    
    if (x === this) {
        return Global.Zero;
    }
    if (x instanceof sup.Real) {
        if (x.operator === '@-') {
            return sup.Real([this, x[0]], '+');
        }
        return sup.Real([this, x], '-');
    }
    if (x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return sup.Real([this, x], '-');
    }
    return this.realimag()['-'](x);
};
_['*'] = function (x) {
    
    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.Zero;
        }
    }
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
            return sup.Real([this[0]['*'](x), this[1]], this.operator);
        }
        return sup.Real([x, this], '*');
    }
    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        if (this[0] instanceof Expression.Function) {
            
        }
        return sup.Real([this, x], '*');
    }
    return x['*'](this);
    
};
_['/'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }

    if(x === this) {
        return Global.One;
    }

    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/') {
            return sup.Real([this[0]['/'](x), this[1]], this.operator);
        }
        return sup.Real([this, x], '/');
    }

    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        return sup.Real([this, x], '/');
    }
    return this.realimag()['/'](x);
};
_['%'] = function (x) {
    return sup.Real([this, x], '%');
};
_['@-'] = function () {
    if(this.operator === '@-') {
        return this[0];
    }
    return sup.Real([this], '@-');
};
_['^'] = function (x) {
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
            return sup.Real([this[0]['^'](x), this[1]['^'](x)], this.operator);
        }
    }
    return Expression.Symbol.Real.prototype['^'].call(this, x);
    
};

_.differentiate = function (x) {

    if (this.operator === '+' ||
        this.operator === '-' ||
        this.operator === '@-') {

        return this[0].differentiate(x)[this.operator](this[1] && this[1].differentiate(x));
    
    } else if (this.operator === '*' || this.operator === undefined) {

        if(this[0] instanceof Expression.Function) {

            var da = this[1].differentiate(x);
            if(da === Global.Zero) return da;

            return this[0].differentiate().default(this[1])['*'](da);
        }

        return this[0][this.operator](
            this[1].differentiate(x)
        )['+'](this[1][this.operator](
            this[0].differentiate(x)
        ));

    } else if (this.operator === '/') {

        return this[1]['*'](
            this[0].differentiate(x)
        )['-'](
            this[0]['*'](
                this[1].differentiate(x)
            )
        )[this.operator](
            this[1]['*'](this[1])
        );
    } else if (this.operator === '^') {

        var df = this[0].differentiate(x);
        var dg = this[1].differentiate(x);

        if (df === Global.Zero) {
            if (dg === Global.Zero) return dg;

            return dg.default(
                Global.log.default(this[0])
            ).default(this);
        }

        var fa = this[0]['^'](
            this[1]['-'](Global.One)
        );

        return fa.default(
            df.default(this[1])['+'](
                this[0]['*'](
                    Global.log.default(this[0])
                )['*'](
                    dg
                )
            )
        );
    }
};

_._s = function (Code, lang) {

    var language = Code.language;
    function paren(x) {
        if(lang === 'text/latex') {
            return '\\left(' + x + '\\right)'; 
        }
        return '(' + x + ')';
    }
    if (this.operator === undefined) {
        if (this[0] instanceof Expression.Function) {
            if(this[0] === Global.abs) {

                var c1 = this[1]._s(Code, lang);

                if(lang === 'text/latex') {
                    return c1.update('\\left|' + c1.s + '\\right|', Infinity);
                }
                var c0 = this[0]._s(Code, lang);
                return c1.update(c0.s + '(' + c1.s + ')', Infinity);
            }
            var c0 = this[0]._s(Code, lang);
            if (this[1] instanceof Expression.Vector) {
                var c1s = Array.prototype.map.call(this[1], function (c) {
                    return c._s(Code, lang);
                });
                var i;
                var t_s = c1s.map(function (e){
                    return e.s;
                });
                if(this[0] === Global.atan) {
                    t_s = t_s.reverse();
                }
                var c0_s = c0.s;
                for (i = 0; i < c1s.length; i++) {
                    c0.merge(c1s[i]);
                }
                return c0.update(c0_s + paren(t_s), language.operators.default.precedence);
            }
            var c1 = this[1]._s(Code, lang);
            return c0.merge(c1, c0.s + paren(c1.s), language.operators.default.precedence);
        } else {
            this.operator = '*';
        }
    }
    var p = language.operators[this.operator].precedence;
    var assoc = language.operators[this.operator] === 0;
    function _(x) {
        if(p > x.p || !assoc){
            return paren(x.s);
        }
        return x.s;
    }

    if(this.operator === '^') {

        if(lang === 'x-shader/x-fragment') {
            if(this[0] === Global.e) {
                var c1 = this[1]._s(Code, lang);
                return c1.update('exp(' + c1.s + ')');
            }
            if(this[1] instanceof Expression.Integer && this[1].a < 5 && this[1].a > -1) {
                var c0 = this[0]._s(Code, lang);
                var j = language.operators['*'].precedence;
                
                var pre = undefined;
                var cs;
                if(this[0] instanceof Expression.Symbol) {
                    cs = c0.s;
                } else {
                    
                    cs = c0.variable();
                    
                    pre = 'float ' + cs + ' = ' + c0.s + ';';
                
                }
                var s = cs;
                var i;
                for(i = 1; i < this[1].a; i++) {
                    s+= '*' + cs;
                }
                return c0.update('(' + s + ')', Infinity, pre);
            }
            if(this[1] instanceof Expression.Integer && this[1].a == -1) {
                var c0 = this[0]._s(Code, lang);
                // todo: precedence not necessary
                return c0.update('(1.0/(' + c0.s + '))');
            }
            if(this[1] instanceof Expression.Rational) {
                // a^2, 3, 4, 5, 6 
                // unsure it is gcd
                this[1] = this[1].reduce();
                var even = this[1].a % 2 ? false : true;
                if(even) {
                    var c1 = this[1]._s(Code, lang);
                    var c0 = this[0]._s(Code, lang);
                    
                    return c0.merge(c1, 'pow(' + c0.s + ',' + c1.s  + ')');
                } else {

                    // x^(a) = (x) * x^(a-1)
                    var c1 = this[1]['-'](Global.One)._s(Code, lang);
                    var c0 = this[0]._s(Code, lang);
                    
                    return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ',' + c1.s + '))');
                }
            }
            if (this[0] instanceof Expression.NumericalReal) {

                // Neg or pos.
                var c1 = this[1]['-'](Global.One)._s(Code, lang);
                var c0 = this[0]._s(Code, lang);
                
                return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
                
            }
            var c1 = this[1]['-'](Global.One)._s(Code, lang);
            var c0 = this[0]._s(Code, lang);
                
            // Needs a new function, dependent on power.
            return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
            
        } else if(lang === 'text/javascript') {
            if(this[0] === Global.e) {
                var c1 = this[1]._s(Code, lang);
                return c1.update('Math.exp(' + c1.s + ')');
            }

            var c1 = this[1]._s(Code, lang);
            var c0 = this[0]._s(Code, lang);

            if(this[1] instanceof Expression.Rational) {
                // a^2, 3, 4, 5, 6 
                var even = this[1].a % 2 ? false : true;

                if(even) {
                    return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
                } else {
                    return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
                }
            } else {
                
                // Needs a new function, dependent on power.
                return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
            }
            
        } else if (lang === 'text/latex'){
            var c0 = this[0]._s(Code, lang);
            var c1 = this[1]._s(Code, lang);
            return c0.merge(c1, _(c0) + '^' + '{' + c1.s + '}')
        }
    }

    var c0 = this[0]._s(Code, lang);

    if(this.operator[0] === '@') {
        return c0.update(this.operator[1] + _(c0), p);
    }

    var c1 = this[1]._s(Code, lang);
    
    if(lang === 'text/latex') {
        if(this.operator === '/') {
            return c0.merge(c1, '\\frac{' + c0.s + '}{' + c1.s + '}')
        }
        if(this.operator === '*') {
            return c0.merge(c1, _(c0) + _(c1), p);
        }
    } else if (lang === 'x-shader/x-fragment') {
        if(this.operator === '%') {
            return c0.merge(c1, 'mod(' + _(c0) + ',' + _(c1) + ')', p);
        }
    }

    return c0.merge(c1, _(c0) + this.operator + _(c1), p);
};


})()
},{"util":11,"../":25,"../../":7,"../../../global":10}],27:[function(require,module,exports){
(function(){var util = require('util'),
    sup  = require('../'),
    Global = require('../../../global');

var Expression = require('../../');

module.exports = Symbol_Real;

util.inherits(Symbol_Real, sup);

function Symbol_Real(str) {
    this.symbol = str;
}

var _ = Symbol_Real.prototype;

_.realimag = function() {
    return Expression.List.ComplexCartesian([this, Global.Zero]);
};
_.real = function() {
    return this;
};
_.imag = function() {
    return Global.Zero;
};
_.polar = function() {
    return Expression.List.ComplexPolar([
        Expression.List.Real([Global.abs, this]),
        Expression.List.Real([Global.arg, this])
    ]);
};
_.abs = function() {
    return Expression.List.Real([Global.abs, this]);
};
_.arg = function() {
    return Expression.List.Real([Global.arg, this]);
};

_['+'] = function (x) {
    if (x === Global.Zero) {
        return this;
    }

    if(x instanceof Expression.NumericalReal) {
        return new Expression.List.Real([this, x], '+');
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '+');
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '+');
    }
    return x['+'](this);
};
_['-'] = function (x) {
    if(this === x) {
        return Global.Zero;
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '-');
    }
    if(x instanceof Expression.List.Real) {
        if (x.operator === '@-') {
            return new Expression.List.Real([this, x[0]], '+');
        }
        return new Expression.List.Real([this, x], '-');
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '-');
    }
    
    return x['@-']()['+'](this);
};

_['@+'] = function (x) {
    return Expression.List.Real([this], '@+');
};

_['@-'] = function (x) {
    return Expression.List.Real([this], '@-');
};

_['*'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.Zero;
        }
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '*');
    }
    if(x instanceof Expression.List.Real) {
        return x['*'](this);
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '*');
    }
    if(x instanceof Expression.NumericalReal) {
        return new Expression.List.Real([x, this], '*');
    }
    if(x instanceof Expression.NumericalComplex) {
        return new Expression.List.Real([this, x], '*');
    }
    if(x instanceof Expression.List.ComplexCartesian) {
        return x['*'](this);
    }
    return x['*'](this);
};
_.apply = _['*'];
_['/'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            throw('Division by zero');
        }
    }
    
    return Expression.List.Real([this, x], '/');
};
_['^'] = function (x) {
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.One;
        }
    }
    
    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if (x instanceof Expression.Integer) {
        return Expression.List.Real([this, x], '^');
    } else if(x instanceof Expression.Rational) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return Expression.List.Real([this, x], '^');
        }
    }
    return Expression.List([this, x], '^');
};
_['%'] = function (x) {
    return Expression.List.Real([this, x], '%');
};
_.applyOld = function(operator, e) {
    throw("Real.apply");
    // if (operator === ',') {
    //     //Maybe this should be a new object type??? Vector?
    //     console.log('APPLY: ', this.constructor, this, e);
    //     return Expression.Vector([this, e]);
    // } else if (operator === '=') {
    //     return Expression.Equation([this, e], operator);
    // }
    // if (e === undefined) {
    //     //Unary:
    //     switch (operator) {
    //         case '!':
    //             //TODO: Can't simplify, so why bother! (return a list, since gamma maps all reals to reals?)
    //             return Global.Gamma.apply(undefined, this.apply('+', Global.One));
    //         case '@-':
    //             return Expression.List.Real([this], operator);
    //         default:
    //     }
    //     throw('Real Symbol('+this.symbol+') could not handle operator '+ operator);
    // } else {
    //     // Simplification:
    //     switch (e.constructor){
    //         case Expression.Symbol.Real:
    //         case Expression.List.Real:
    //             /*if(this.positive && e.positive) {
    //                 return Expression.List.Real([this, e], operator);
    //             }*/
    //             switch(operator) {
    //                 case '^':
    //                     //TODO: Bad idea? This will stay in this form until realimag() is called by user, and user only.
    //                     //return Expression.List([this, e], operator);
    //                     return Expression.List.ComplexPolar([
    //                         Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
    //                         Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
    //                     ]);
    //                 case undefined:
    //                     return Expression.List.Real([this, e], '*');
    //                 default:
    //                     return Expression.List.Real([this, e], operator);
    //             }
    //         case Expression.NumericalReal:
    //             switch(operator){
    //                 case '+':
    //                 case '-':
    //                     if(e.value === 0){
    //                         return this;
    //                     }
    //                     return Expression.List.Real([this, e], operator);
    //                     break;
    //                 case undefined:
    //                 case '*':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.Zero;
    //                     }
    //                     return Expression.List.Real([this, e], '*');
    //                     break;
    //                 case '%':
    //                     return Expression.List.Real([this, e], '%');
    //                 case '^':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.One;
    //                     }
    //                     if(false && opengl_TODO_hack() && e.value === ~~e.value){
    //                         return Expression.List.Real([this, e], operator);
    //                     }
    //                     return Expression.List.ComplexPolar([
    //                         Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
    //                         Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
    //                     ]);
                        
    //                     break;
    //                 case '/':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.Infinity;
    //                     }
    //                     return Expression.List.Real([this, e], operator);
    //                     break;
    //             }
    //             break;
    //         case Expression.Complex:
    //             return this.realimag().apply(operator, e); // GO to above (will apply reals)
    //             break;
    //         case Expression.List.ComplexCartesian:
    //             //Maybe there is a way to swap the order? (e.g. a .real = true property for other things to check)
    //             //or instance of Expression.Real ?
    //             switch(operator) {
    //                 case '+':
    //                 case '-':
    //                     return Expression.List.ComplexCartesian([
    //                         this.apply(operator, e[0]),
    //                         e[1]
    //                     ]);
    //                 case undefined:
    //                     operator = '*';
    //                 case '*':
    //                     return Expression.List.ComplexCartesian([
    //                         this.apply(operator, e[0]),
    //                         this.apply(operator, e[1])
    //                     ]);
    //                 case '/':
    //                     var cc_dd = e[0].apply('*',e[0]).apply('+',e[1].apply('*',e[1]));
    //                     return Expression.List.ComplexCartesian([
    //                         (this.apply('*',e[0])).apply('/', cc_dd),
    //                         this.apply('*',e[1]).apply('/', cc_dd).apply('@-')
    //                     ]);
    //             }
    //         case Expression.List.ComplexPolar:
    //             //Maybe there is a way to swap the order?
    //             return this.polar().apply(operator, e);
    //     }
    //     throw('LIST FROM REAL SYMBOL! '+ operator, e.constructor);
    //     return Expression.List([this, e], operator);
    // }
};


})()
},{"util":11,"../../../global":10,"../":29,"../../":7}],28:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup = require('../');
var Expression = require('../../');

/*
    This type is an attempt to avoid having to call .realimag() down the tree all the time.
    
    Maybe this is a bad idea, because it will end up having:
    
    f(x) = >
    [
        Re_f(x),
        Im_f(x)
        
    ]
    which requires two evaluations of f(x).

*/

module.exports = ComplexCartesian;

util.inherits(ComplexCartesian, sup);

function ComplexCartesian(x) {
    x.__proto__ = ComplexCartesian.prototype;
    return x;
}

var _ = ComplexCartesian.prototype;

_.realimag = function () {
    return this;
};
_.real = function () {
    return this[0];
};
_.imag = function () {
    return this[1];
};
_.conjugate = function () {
    return ComplexCartesian([
        this[0],
        this[1].apply('@-')
    ]);
};

_['@-'] = function (x) {
    return new ComplexCartesian([
        this[0]['@-'](),
        this[1]['@-']()
    ]);
};
_['*'] = function (x) {
    if (x instanceof ComplexCartesian) {
        // (a+bi) * (c+di) = ac + adi + bci - bd
        return new ComplexCartesian([
            this[0]['*'](x[0])['-'](this[1]['*'](x[1])),
            this[0]['*'](x[1])['+'](this[1]['*'](x[0]))
        ]);
    }
    if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return new ComplexCartesian([
            this[0]['*'](x),
            this[1]['*'](x)
        ]);
    }
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {

        if(x instanceof Expression.Rational) {
            if(x.a === x.b) {
                return this;
            }
        }

        if(x instanceof Expression.Rational) {
            if(x.a === 0) {
                return Global.One;
            }
        }
        
        // Binomial expansion
        // (a+b)^N
        var n  = x.a;
        var k;
        var a = this[0];
        var b = this[1];
        var negone = new Expression.Integer(-1);
        var imag_part = Global.Zero;
        
        var real_part = a['^'](
            new Expression.Integer(n)
        );
        
        var ci = 1;
        
        for (k = 1;; k++) {
            var expr;
            if(k === n) {
                expr = (
                    b['^'](
                        new Expression.Integer(k)
                    )
                );
                
                if (ci === 0) {
                    real_part = real_part['+'](expr);
                } else if (ci === 1) {
                    imag_part = imag_part['+'](expr);
                } else if (ci === 2) {
                    real_part = real_part['-'](expr);
                } else if (ci === 3) {
                    imag_part = imag_part['-'](expr);
                    ci = -1;
                }
            
                
                break;
            }
            expr = a['^'](
                new Expression.Integer(n - k)
            )['*'](
                b['^'](
                    new Expression.Integer(k)
                )
            );
            if (ci === 0) {
                real_part = real_part['+'](expr);
            } else if (ci === 1) {
                imag_part = imag_part['+'](expr);
            } else if (ci === 2) {
                real_part = real_part['-'](expr);
            } else if (ci === 3) {
                imag_part = imag_part['-'](expr);
                ci = -1;
            }
            
            ci++;
        }
        return new ComplexCartesian([
            real_part,
            imag_part
        ]);
    }
    return new Expression.List([this, x], '^');
};
_['+'] = function (x) {
    if (x instanceof ComplexCartesian) {
        return new ComplexCartesian([
            this[0]
        ]);
    }
    if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return new ComplexCartesian([
            this[0]['+'](x),
            this[1]
        ]);
    }
    
};

_.differentiate = function (x) {
    return ComplexCartesian([
        this[0].differentiate(x),
        this[1].differentiate(x)
    ]);
};


// _.applyOld = function(o, x) {
//     //TODO: ensure this has an imaginary part. If it doesn't it is a huge waste of computation
//     if (x.constructor === this.constructor) {
//         switch(o) {
//             case '+':
//             case '-':
//                 return ComplexCartesian([
//                     this[0].apply(o, x[0]),
//                     this[1].apply(o, x[1])
//                 ]);
//             case undefined:
//                 //Function evaluation? NO. This is not a function. I think.
//             case '*':
//                 return ComplexCartesian([
//                     this[0].apply('*', x[0]).apply('-', this[1].apply('*', x[1])),
//                     this[0].apply('*', x[1]).apply('+', this[1].apply('*', x[0]))
//                 ]);
//             case '/':
//                 var cc_dd = x[0].apply('*', x[0]).apply('+', x[1].apply('*', x[1]));
//                 return ComplexCartesian([
//                     (this[0].apply('*',x[0]).apply('+',this[1].apply('*',x[1]))).apply('/', cc_dd),
//                     (this[1].apply('*',x[0]).apply('-',this[0].apply('*',x[1]))).apply('/', cc_dd)
//                 ]);
//             case '^':
//                 //The most confusing of them all:
//                 var half = new Expression.NumericalReal(0.5, 0);
//                 var hlm = half.apply('*',
//                     Global.log.apply(undefined,
//                         //The magnitude: if this was for a polar one it could be fast.
//                         this[0].apply('*',
//                             this[0]
//                         ).apply('+',
//                             this[1].apply('*',
//                                 this[1]
//                             )
//                         )
//                     )
//                 );
//                 var theta = Global.atan2.apply(undefined, Expression.Vector([this[1], this[0]]));
//                 var hmld_tc = hlm.apply('*', x[1]).apply('+', theta.apply('*', x[0]));
                
//                 var e_hmlc_td = Global.exp.apply(undefined,
//                     hlm.apply('*',
//                         b[0]
//                     ).apply('-',
//                         theta.apply('*',
//                             b[1]
//                         )
//                     )
//                 );
                

//                 var e_hmlc_td = Global.e.apply('^',
//                     hlm.apply('*',
//                         x[0]
//                     ).apply('-',
//                         theta.apply('*',
//                             x[1]
//                         )
//                     )
//                 );

//                 return ComplexCartesian([
//                     (e_hmlc_td.apply('*',Global.cos.apply(undefined, hmld_tc))),
//                     (e_hmlc_td.apply('*',Global.sin.apply(undefined, hmld_tc)))
//                 ]);
//             case '!':
//                 break;
//             default:
//         }
//     } else if (x.constructor === Expression.List.ComplexPolar){
//         switch (o) {
//             case '*':
//             case '/':
//                 //(x+yi)/A*e^(ik)
//                 var cc_dd = x[0].apply('*', x[0]);
//                 var b = x.realimag();
//                 //Clean this up? Sub?
//                 return ComplexCartesian([
//                     (this[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
//                     (this[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
//                 ]);
//             case '^':
//                 //http://www.wolframalpha.com/input/?i=Re%28%28x%2Byi%29%5E%28A*e%5E%28ik%29%29%29
//                 //(x+yi)^(A*e^(ik))
//             case '+':
//             case '-':
//                 return this.apply(o, x.realimag());
//         }
//     } else if (x.constructor === Expression.Complex) {
//         return this.apply(o, x.realimag());
//     } else if (x.constructor === Expression.Symbol.Real) {
//         console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
//         return this.apply(o, x.realimag());
//     } else if (x.constructor === Expression.List.Real) {
//         console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
//         return this.apply(o, x.realimag());
//     }
//     throw('CMPLX.LIST * ' + o);
// };

},{"util":11,"../":25,"../../":7}],26:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util'),
    sup  = require('../'),
    Expression = require('../../');

module.exports = ComplexPolar;

util.inherits(ComplexPolar, sup);

function ComplexPolar (x){
    x.__proto__ = ComplexPolar.prototype;
    return x;
}
var _ = ComplexPolar.prototype;

_.polar = function(){
    return this;
};
_.realimag = function() {
    //TODO: Return Expression.List.ComplexCartesian
    return Expression.List.ComplexCartesian([
        this[0].apply('*', Global.cos.apply(undefined, this[1])),
        this[0].apply('*', Global.sin.apply(undefined, this[1]))
    ]);
};
_.real = function() {
    return this[0].apply('*', Global.cos.apply(undefined, this[1]));
};
_.imag = function() {
    return this[0].apply('*', Global.sin.apply(undefined, this[1]));
};
_.conjugate = function() {
    return ComplexPolar([
        this[0],
        this[1].apply('@-')
    ]);
};
_.differentiate = function(x){
    // d/dx a(x) * e^(ib(x))
    
    //TODO ensure below  f' + if g' part is realimag (f', fg')
    return Global.e
    .apply(
        '^',
        Global.i
        .apply('*',
            this[1]
        )
    )
    .apply('*',
        this[0].differentiate(x)
        .apply('+',
            Global.i
            .apply('*',
                this[0]
            )
            .apply('*',
                this[1].differentiate(x)
            )
        )
    );
};
// _.apply = function(o, x) {
//     if (x.constructor === this.constructor) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', x[0]),
//                     this[1].apply('+', x[1])
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', x[0]),
//                     this[1].apply('-', x[1])
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //(Ae^(ik)) ^ (Be^(ij))
//                 //How slow is this?
//                 //Very fast for real numbers though
//             case '!':
//             default:
            
//         }
//     } else if (x.constructor === Expression.NumericalReal) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', x),
//                     this[1]
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', x),
//                     this[1]
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //Fast:
//                 return Expression.List.ComplexPolar([
//                     this[0],
//                     this[1].apply('*', x)
//                 ]);
//             case '!':
//             default:
            
//         }
//     } else if (x.constructor === Expression.Complex) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', new Expression.NumericalReal(x._real)),
//                     this[1].apply('+', new Expression.NumericalReal(x._imag))
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', new Expression.NumericalReal(x._real)),
//                     this[1].apply('-', new Expression.NumericalReal(x._imag))
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //(Ae^(ik)) ^ (Be^(ij))
//                 //How slow is this?
//                 //Very fast for real numbers though
//             case '!':
//             default:
            
//         }
//     }
    
// };
_.abs = function (){
    return this[0];
};
_.arg = function (){
    return this[1];
};

},{"util":11,"../":25,"../../":7}],35:[function(require,module,exports){
var util = require('util'),
    sup = require('../'),
    Expression = require('../../');

module.exports = SymbolicEFunction;

util.inherits(SymbolicEFunction, sup);

function SymbolicEFunction(expr, vars) {
    this.expr = expr;
    this.symbols = vars;
    
};
var _ = SymbolicEFunction.prototype;
_.default = function (x) {
    if (x.constructor !== Expression.Vector) {
        x = Expression.Vector([x]);
    }
    var expr = this.expr;
    var i, l = this.symbols.length;
    if (l !== x.length) {
        throw ('Invalid domain. Element of F^' + l + ' expected.');
    }
    for(i = 0; i < l; i++) {
        expr = expr.sub(this.symbols[i], x[i])
    }
    return expr;
};
},{"util":11,"../":33,"../../":7}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnkyXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcaW5zZXJ0LW1vZHVsZS1nbG9iYWxzXFxub2RlX21vZHVsZXNcXHByb2Nlc3NcXGJyb3dzZXIuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcaW5kZXguanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEVycm9yXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXGdsb2JhbFxcaW5kZXguanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbm9kZV9tb2R1bGVzXFxncnVudC1icm93c2VyaWZ5Mlxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcmVzb2x2ZVxcYnVpbHRpblxcdXRpbC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnkyXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1yZXNvbHZlXFxidWlsdGluXFxldmVudHMuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcZ3JhbW1hclxccGFyc2VyLmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcTGFuZ3VhZ2VcXGRlZmF1bHQuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxDb250ZXh0XFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXExhbmd1YWdlXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXGdsb2JhbFxcZGVmYXVsdHMuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnkyXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1yZXNvbHZlXFxidWlsdGluXFxmcy5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnkyXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1yZXNvbHZlXFxidWlsdGluXFxwYXRoLmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcTGFuZ3VhZ2VcXENvZGUuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxMYW5ndWFnZVxcc3RyaW5naWZ5LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcQ29uc3RhbnQuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxSYXRpb25hbC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXE51bWVyaWNhbENvbXBsZXguanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxOdW1lcmljYWxSZWFsLmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcSW50ZWdlci5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXExpc3RcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcU3RhdGVtZW50XFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXFN5bWJvbFxcaW5kZXguanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxMYW5ndWFnZVxccGFyc2UuanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxWZWN0b3JcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcTWF0cml4XFxpbmRleC5qcyIsIkM6XFxVc2Vyc1xcQWRhbVxcRG9jdW1lbnRzXFxHaXRIdWJcXGphdmFzY3JpcHQtY2FzXFxsaWJcXEV4cHJlc3Npb25cXEluZmluaXRlc2ltYWxcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcRnVuY3Rpb25cXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcTGlzdFxcUmVhbFxcaW5kZXguanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxTeW1ib2xcXFJlYWxcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcTGlzdFxcQ29tcGxleENhcnRlc2lhblxcaW5kZXguanMiLCJDOlxcVXNlcnNcXEFkYW1cXERvY3VtZW50c1xcR2l0SHViXFxqYXZhc2NyaXB0LWNhc1xcbGliXFxFeHByZXNzaW9uXFxMaXN0XFxDb21wbGV4UG9sYXJcXGluZGV4LmpzIiwiQzpcXFVzZXJzXFxBZGFtXFxEb2N1bWVudHNcXEdpdEh1YlxcamF2YXNjcmlwdC1jYXNcXGxpYlxcRXhwcmVzc2lvblxcRnVuY3Rpb25cXFN5bWJvbGljXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5dEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNodEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpeyd1c2Ugc3RyaWN0JztcblxudmFyIE0gPSByZXF1aXJlKCcuL2xpYicpO1xuaWYgKHByb2Nlc3MuZW52LkpTQ0FTX0NPVkVSQUdFKXtcbiAgdmFyIGRpciA9ICcuL2xpYi1jb3YnO1xuICBNID0gcmVxdWlyZShkaXIpO1xufVxuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgX00gPSB3aW5kb3cuTTtcbiAgICB3aW5kb3cuTSA9IE07XG4gICAgTS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cuTSA9IF9NO1xuICAgICAgICByZXR1cm4gTTtcbiAgICB9O1xufVxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNO1xufVxuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiKGZ1bmN0aW9uKCl7Lypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xuXG4vLyBub3Qgc3VyZSBpZiB0aGlzIGlzIHJlcXVpcmVkOlxuLypqc2hpbnQgc3ViOiB0cnVlICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRXhwcmVzc2lvbiAgPSByZXF1aXJlKCcuL0V4cHJlc3Npb24nKSxcbiAgICBDb250ZXh0ICAgICA9IHJlcXVpcmUoJy4vQ29udGV4dCcpLFxuICAgIE1hdGhFcnJvciAgID0gcmVxdWlyZSgnLi9FcnJvcicpLFxuICAgIGxhbmd1YWdlICAgID0gcmVxdWlyZSgnLi9MYW5ndWFnZS9kZWZhdWx0JyksXG4gICAgQ29kZSAgICAgICAgPSByZXF1aXJlKCcuL0xhbmd1YWdlJykuQ29kZSxcbiAgICBHbG9iYWwgICAgICA9IHJlcXVpcmUoJy4vZ2xvYmFsJyk7XG5cbi8vIERlZmluZSBzaW4sIGNvcywgdGFuLCBldGMuXG52YXIgZGVmYXVsdHMgICAgPSByZXF1aXJlKCcuL2dsb2JhbC9kZWZhdWx0cycpO1xuZGVmYXVsdHMuYXR0YWNoKEdsb2JhbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTTtcblxuZnVuY3Rpb24gTShlLCBjKSB7XG4gICAgcmV0dXJuIGxhbmd1YWdlLnBhcnNlKGUsIGMgfHwgR2xvYmFsKTtcbn1cblxuTS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBbXG4gICAgJ2Z1bmN0aW9uIE0oZXhwcmVzc2lvbiwgY29udGV4dCkgeycsXG4gICAgJyAgICAvKiEnLFxuICAgICcgICAgICogIE1hdGggSmF2YVNjcmlwdCBMaWJyYXJ5IHYzLjkuMScsXG4gICAgJyAgICAgKiAgaHR0cHM6Ly9naXRodWIuY29tL2FhbnR0aG9ueS9qYXZhc2NyaXB0LWNhcycsXG4gICAgJyAgICAgKiAgJyxcbiAgICAnICAgICAqICBDb3B5cmlnaHQgMjAxMCBBbnRob255IEZvc3Rlci4gQWxsIHJpZ2h0cyByZXNlcnZlZC4nLFxuICAgICcgICAgICovJyxcbiAgICAnICAgIFthd2Vzb21lIGNvZGVdJyxcbiAgICAnfSddLmpvaW4oJ1xcbicpO1xufTtcblxuTVsnQ29udGV4dCddICAgID0gQ29udGV4dDtcbk1bJ0V4cHJlc3Npb24nXSA9IEV4cHJlc3Npb247XG5NWydHbG9iYWwnXSAgICAgPSBHbG9iYWw7XG5NWydFcnJvciddICAgICAgPSBNYXRoRXJyb3I7XG5cbkV4cHJlc3Npb24ucHJvdG90eXBlLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgIENvZGUubGFuZ3VhZ2UgPSBsYW5ndWFnZTtcbiAgICBDb2RlLm5ld0NvbnRleHQoKTtcbiAgICByZXR1cm4gdGhpcy5fcyhDb2RlLCBsYW5nKTtcbn07XG5FeHByZXNzaW9uLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpcy5zKCd0ZXh0L2phdmFzY3JpcHQnKS5jb21waWxlKHgpO1xufVxuXG52YXIgZXh0ZW5zaW9ucyA9IHt9O1xuXG5NWydyZWdpc3RlciddID0gZnVuY3Rpb24gKG5hbWUsIGluc3RhbGxlcil7XG4gICAgaWYoRXhwcmVzc2lvbi5wcm90b3R5cGVbbmFtZV0pIHtcbiAgICAgICAgdGhyb3coJ01ldGhvZCAuJyArIG5hbWUgKyAnIGlzIGFscmVhZHkgaW4gdXNlIScpO1xuICAgIH1cbiAgICBleHRlbnNpb25zW25hbWVdID0gaW5zdGFsbGVyO1xufTtcblxuTVsnbG9hZCddID0gZnVuY3Rpb24obmFtZSwgY29uZmlnKSB7XG4gICAgZXh0ZW5zaW9uc1tuYW1lXShNLCBFeHByZXNzaW9uLCBjb25maWcpO1xuICAgIGRlbGV0ZSBleHRlbnNpb25zW25hbWVdO1xufTtcblxufSkoKSIsImZ1bmN0aW9uIE1hdGhFcnJvcihzdHIpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBzdHI7XG59XG5NYXRoRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhFcnJvcjtcbiIsInZhciBjb250ZXh0ID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gY29udGV4dDtcbiIsInZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcblxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbmV4cG9ydHMuaXNEYXRlID0gZnVuY3Rpb24ob2JqKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJ307XG5leHBvcnRzLmlzUmVnRXhwID0gZnVuY3Rpb24ob2JqKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nfTtcblxuXG5leHBvcnRzLnByaW50ID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLnB1dHMgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMuZGVidWcgPSBmdW5jdGlvbigpIHt9O1xuXG5leHBvcnRzLmluc3BlY3QgPSBmdW5jdGlvbihvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMpIHtcbiAgdmFyIHNlZW4gPSBbXTtcblxuICB2YXIgc3R5bGl6ZSA9IGZ1bmN0aW9uKHN0ciwgc3R5bGVUeXBlKSB7XG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG4gICAgdmFyIHN0eWxlcyA9XG4gICAgICAgIHsgJ2JvbGQnIDogWzEsIDIyXSxcbiAgICAgICAgICAnaXRhbGljJyA6IFszLCAyM10sXG4gICAgICAgICAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAgICAgICAgICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICAgICAgICAgJ3doaXRlJyA6IFszNywgMzldLFxuICAgICAgICAgICdncmV5JyA6IFs5MCwgMzldLFxuICAgICAgICAgICdibGFjaycgOiBbMzAsIDM5XSxcbiAgICAgICAgICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgICAgICAgICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgICAgICAgICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICAgICAgICAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICAgICAgICAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgICAgICAgICAneWVsbG93JyA6IFszMywgMzldIH07XG5cbiAgICB2YXIgc3R5bGUgPVxuICAgICAgICB7ICdzcGVjaWFsJzogJ2N5YW4nLFxuICAgICAgICAgICdudW1iZXInOiAnYmx1ZScsXG4gICAgICAgICAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgICAgICAgICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAgICAgICAgICdudWxsJzogJ2JvbGQnLFxuICAgICAgICAgICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAgICAgICAgICdkYXRlJzogJ21hZ2VudGEnLFxuICAgICAgICAgIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICAgICAgICAgJ3JlZ2V4cCc6ICdyZWQnIH1bc3R5bGVUeXBlXTtcblxuICAgIGlmIChzdHlsZSkge1xuICAgICAgcmV0dXJuICdcXDAzM1snICsgc3R5bGVzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICAgJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzFdICsgJ20nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgfTtcbiAgaWYgKCEgY29sb3JzKSB7XG4gICAgc3R5bGl6ZSA9IGZ1bmN0aW9uKHN0ciwgc3R5bGVUeXBlKSB7IHJldHVybiBzdHI7IH07XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXQodmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAgIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlLmluc3BlY3QgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICAgIHZhbHVlICE9PSBleHBvcnRzICYmXG4gICAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMpO1xuICAgIH1cblxuICAgIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG5cbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuXG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG5cbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAgIH1cbiAgICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG4gICAgfVxuXG4gICAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICAgIHZhciB2aXNpYmxlX2tleXMgPSBPYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgdmFyIGtleXMgPSBzaG93SGlkZGVuID8gT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXModmFsdWUpIDogdmlzaWJsZV9rZXlzO1xuXG4gICAgLy8gRnVuY3Rpb25zIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAncmVnZXhwJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0ZXMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZFxuICAgIGlmIChpc0RhdGUodmFsdWUpICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gc3R5bGl6ZSh2YWx1ZS50b1VUQ1N0cmluZygpLCAnZGF0ZScpO1xuICAgIH1cblxuICAgIHZhciBiYXNlLCB0eXBlLCBicmFjZXM7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBvYmplY3QgdHlwZVxuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgdHlwZSA9ICdBcnJheSc7XG4gICAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlID0gJ09iamVjdCc7XG4gICAgICBicmFjZXMgPSBbJ3snLCAnfSddO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICBiYXNlID0gKGlzUmVnRXhwKHZhbHVlKSkgPyAnICcgKyB2YWx1ZSA6ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2UgPSAnJztcbiAgICB9XG5cbiAgICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgYmFzZSA9ICcgJyArIHZhbHVlLnRvVVRDU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAncmVnZXhwJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgICB2YXIgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgbmFtZSwgc3RyO1xuICAgICAgaWYgKHZhbHVlLl9fbG9va3VwR2V0dGVyX18pIHtcbiAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwR2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHZpc2libGVfa2V5cy5pbmRleE9mKGtleSkgPCAwKSB7XG4gICAgICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gICAgICB9XG4gICAgICBpZiAoIXN0cikge1xuICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKHZhbHVlW2tleV0pIDwgMCkge1xuICAgICAgICAgIGlmIChyZWN1cnNlVGltZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0sIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdBcnJheScgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICAgICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG4gICAgfSk7XG5cbiAgICBzZWVuLnBvcCgpO1xuXG4gICAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICAgIG51bUxpbmVzRXN0Kys7XG4gICAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgICByZXR1cm4gcHJldiArIGN1ci5sZW5ndGggKyAxO1xuICAgIH0sIDApO1xuXG4gICAgaWYgKGxlbmd0aCA+IDUwKSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gK1xuICAgICAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBicmFjZXNbMV07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgcmV0dXJuIGZvcm1hdChvYmosICh0eXBlb2YgZGVwdGggPT09ICd1bmRlZmluZWQnID8gMiA6IGRlcHRoKSk7XG59O1xuXG5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIGFyIGluc3RhbmNlb2YgQXJyYXkgfHxcbiAgICAgICAgIEFycmF5LmlzQXJyYXkoYXIpIHx8XG4gICAgICAgICAoYXIgJiYgYXIgIT09IE9iamVjdC5wcm90b3R5cGUgJiYgaXNBcnJheShhci5fX3Byb3RvX18pKTtcbn1cblxuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gcmUgaW5zdGFuY2VvZiBSZWdFeHAgfHxcbiAgICAodHlwZW9mIHJlID09PSAnb2JqZWN0JyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocmUpID09PSAnW29iamVjdCBSZWdFeHBdJyk7XG59XG5cblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgaWYgKGQgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKHR5cGVvZiBkICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICB2YXIgcHJvcGVydGllcyA9IERhdGUucHJvdG90eXBlICYmIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKERhdGUucHJvdG90eXBlKTtcbiAgdmFyIHByb3RvID0gZC5fX3Byb3RvX18gJiYgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMoZC5fX3Byb3RvX18pO1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocHJvdG8pID09PSBKU09OLnN0cmluZ2lmeShwcm9wZXJ0aWVzKTtcbn1cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydHMubG9nID0gZnVuY3Rpb24gKG1zZykge307XG5cbmV4cG9ydHMucHVtcCA9IG51bGw7XG5cbnZhciBPYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgcmVzLnB1c2goa2V5KTtcbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHJlcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICAgIC8vIGZyb20gZXM1LXNoaW1cbiAgICB2YXIgb2JqZWN0O1xuICAgIGlmIChwcm90b3R5cGUgPT09IG51bGwpIHtcbiAgICAgICAgb2JqZWN0ID0geyAnX19wcm90b19fJyA6IG51bGwgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvdG90eXBlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICAndHlwZW9mIHByb3RvdHlwZVsnICsgKHR5cGVvZiBwcm90b3R5cGUpICsgJ10gIT0gXFwnb2JqZWN0XFwnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgVHlwZSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICAgICAgb2JqZWN0ID0gbmV3IFR5cGUoKTtcbiAgICAgICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAndW5kZWZpbmVkJyAmJiBPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhvYmplY3QsIHByb3BlcnRpZXMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuZXhwb3J0cy5pbmhlcml0cyA9IGZ1bmN0aW9uKGN0b3IsIHN1cGVyQ3Rvcikge1xuICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvcjtcbiAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3RfY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbn07XG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICh0eXBlb2YgZiAhPT0gJ3N0cmluZycpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goZXhwb3J0cy5pbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzogcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKXtcbiAgICBpZiAoeCA9PT0gbnVsbCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgZXhwb3J0cy5pbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24ocHJvY2Vzcyl7LyogcGFyc2VyIGdlbmVyYXRlZCBieSBqaXNvbiAwLjQuMTAgKi9cbi8qXG4gIFJldHVybnMgYSBQYXJzZXIgb2JqZWN0IG9mIHRoZSBmb2xsb3dpbmcgc3RydWN0dXJlOlxuXG4gIFBhcnNlcjoge1xuICAgIHl5OiB7fVxuICB9XG5cbiAgUGFyc2VyLnByb3RvdHlwZToge1xuICAgIHl5OiB7fSxcbiAgICB0cmFjZTogZnVuY3Rpb24oKSxcbiAgICBzeW1ib2xzXzoge2Fzc29jaWF0aXZlIGxpc3Q6IG5hbWUgPT0+IG51bWJlcn0sXG4gICAgdGVybWluYWxzXzoge2Fzc29jaWF0aXZlIGxpc3Q6IG51bWJlciA9PT4gbmFtZX0sXG4gICAgcHJvZHVjdGlvbnNfOiBbLi4uXSxcbiAgICBwZXJmb3JtQWN0aW9uOiBmdW5jdGlvbiBhbm9ueW1vdXMoeXl0ZXh0LCB5eWxlbmcsIHl5bGluZW5vLCB5eSwgeXlzdGF0ZSwgJCQsIF8kKSxcbiAgICB0YWJsZTogWy4uLl0sXG4gICAgZGVmYXVsdEFjdGlvbnM6IHsuLi59LFxuICAgIHBhcnNlRXJyb3I6IGZ1bmN0aW9uKHN0ciwgaGFzaCksXG4gICAgcGFyc2U6IGZ1bmN0aW9uKGlucHV0KSxcblxuICAgIGxleGVyOiB7XG4gICAgICAgIEVPRjogMSxcbiAgICAgICAgcGFyc2VFcnJvcjogZnVuY3Rpb24oc3RyLCBoYXNoKSxcbiAgICAgICAgc2V0SW5wdXQ6IGZ1bmN0aW9uKGlucHV0KSxcbiAgICAgICAgaW5wdXQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIHVucHV0OiBmdW5jdGlvbihzdHIpLFxuICAgICAgICBtb3JlOiBmdW5jdGlvbigpLFxuICAgICAgICBsZXNzOiBmdW5jdGlvbihuKSxcbiAgICAgICAgcGFzdElucHV0OiBmdW5jdGlvbigpLFxuICAgICAgICB1cGNvbWluZ0lucHV0OiBmdW5jdGlvbigpLFxuICAgICAgICBzaG93UG9zaXRpb246IGZ1bmN0aW9uKCksXG4gICAgICAgIHRlc3RfbWF0Y2g6IGZ1bmN0aW9uKHJlZ2V4X21hdGNoX2FycmF5LCBydWxlX2luZGV4KSxcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSxcbiAgICAgICAgbGV4OiBmdW5jdGlvbigpLFxuICAgICAgICBiZWdpbjogZnVuY3Rpb24oY29uZGl0aW9uKSxcbiAgICAgICAgcG9wU3RhdGU6IGZ1bmN0aW9uKCksXG4gICAgICAgIF9jdXJyZW50UnVsZXM6IGZ1bmN0aW9uKCksXG4gICAgICAgIHRvcFN0YXRlOiBmdW5jdGlvbigpLFxuICAgICAgICBwdXNoU3RhdGU6IGZ1bmN0aW9uKGNvbmRpdGlvbiksXG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcmFuZ2VzOiBib29sZWFuICAgICAgICAgICAob3B0aW9uYWw6IHRydWUgPT0+IHRva2VuIGxvY2F0aW9uIGluZm8gd2lsbCBpbmNsdWRlIGEgLnJhbmdlW10gbWVtYmVyKVxuICAgICAgICAgICAgZmxleDogYm9vbGVhbiAgICAgICAgICAgICAob3B0aW9uYWw6IHRydWUgPT0+IGZsZXgtbGlrZSBsZXhpbmcgYmVoYXZpb3VyIHdoZXJlIHRoZSBydWxlcyBhcmUgdGVzdGVkIGV4aGF1c3RpdmVseSB0byBmaW5kIHRoZSBsb25nZXN0IG1hdGNoKVxuICAgICAgICAgICAgYmFja3RyYWNrX2xleGVyOiBib29sZWFuICAob3B0aW9uYWw6IHRydWUgPT0+IGxleGVyIHJlZ2V4ZXMgYXJlIHRlc3RlZCBpbiBvcmRlciBhbmQgZm9yIGVhY2ggbWF0Y2hpbmcgcmVnZXggdGhlIGFjdGlvbiBjb2RlIGlzIGludm9rZWQ7IHRoZSBsZXhlciB0ZXJtaW5hdGVzIHRoZSBzY2FuIHdoZW4gYSB0b2tlbiBpcyByZXR1cm5lZCBieSB0aGUgYWN0aW9uIGNvZGUpXG4gICAgICAgIH0sXG5cbiAgICAgICAgcGVyZm9ybUFjdGlvbjogZnVuY3Rpb24oeXksIHl5XywgJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucywgWVlfU1RBUlQpLFxuICAgICAgICBydWxlczogWy4uLl0sXG4gICAgICAgIGNvbmRpdGlvbnM6IHthc3NvY2lhdGl2ZSBsaXN0OiBuYW1lID09PiBzZXR9LFxuICAgIH1cbiAgfVxuXG5cbiAgdG9rZW4gbG9jYXRpb24gaW5mbyAoQCQsIF8kLCBldGMuKToge1xuICAgIGZpcnN0X2xpbmU6IG4sXG4gICAgbGFzdF9saW5lOiBuLFxuICAgIGZpcnN0X2NvbHVtbjogbixcbiAgICBsYXN0X2NvbHVtbjogbixcbiAgICByYW5nZTogW3N0YXJ0X251bWJlciwgZW5kX251bWJlcl0gICAgICAgKHdoZXJlIHRoZSBudW1iZXJzIGFyZSBpbmRleGVzIGludG8gdGhlIGlucHV0IHN0cmluZywgcmVndWxhciB6ZXJvLWJhc2VkKVxuICB9XG5cblxuICB0aGUgcGFyc2VFcnJvciBmdW5jdGlvbiByZWNlaXZlcyBhICdoYXNoJyBvYmplY3Qgd2l0aCB0aGVzZSBtZW1iZXJzIGZvciBsZXhlciBhbmQgcGFyc2VyIGVycm9yczoge1xuICAgIHRleHQ6ICAgICAgICAobWF0Y2hlZCB0ZXh0KVxuICAgIHRva2VuOiAgICAgICAodGhlIHByb2R1Y2VkIHRlcm1pbmFsIHRva2VuLCBpZiBhbnkpXG4gICAgbGluZTogICAgICAgICh5eWxpbmVubylcbiAgfVxuICB3aGlsZSBwYXJzZXIgKGdyYW1tYXIpIGVycm9ycyB3aWxsIGFsc28gcHJvdmlkZSB0aGVzZSBtZW1iZXJzLCBpLmUuIHBhcnNlciBlcnJvcnMgZGVsaXZlciBhIHN1cGVyc2V0IG9mIGF0dHJpYnV0ZXM6IHtcbiAgICBsb2M6ICAgICAgICAgKHl5bGxvYylcbiAgICBleHBlY3RlZDogICAgKHN0cmluZyBkZXNjcmliaW5nIHRoZSBzZXQgb2YgZXhwZWN0ZWQgdG9rZW5zKVxuICAgIHJlY292ZXJhYmxlOiAoYm9vbGVhbjogVFJVRSB3aGVuIHRoZSBwYXJzZXIgaGFzIGEgZXJyb3IgcmVjb3ZlcnkgcnVsZSBhdmFpbGFibGUgZm9yIHRoaXMgcGFydGljdWxhciBlcnJvcilcbiAgfVxuKi9cbnZhciBwYXJzZXIgPSAoZnVuY3Rpb24oKXtcbnZhciBwYXJzZXIgPSB7dHJhY2U6IGZ1bmN0aW9uIHRyYWNlKCkgeyB9LFxueXk6IHt9LFxuc3ltYm9sc186IHtcImVycm9yXCI6MixcImV4cHJlc3Npb25zXCI6MyxcIlNcIjo0LFwiRU9GXCI6NSxcImVcIjo2LFwic3RtdFwiOjcsXCI9XCI6OCxcIiE9XCI6OSxcIjw9XCI6MTAsXCI8XCI6MTEsXCI+XCI6MTIsXCI+PVwiOjEzLFwiY3NsXCI6MTQsXCIsXCI6MTUsXCJ2ZWN0b3JcIjoxNixcIihcIjoxNyxcIilcIjoxOCxcIitcIjoxOSxcIi1cIjoyMCxcIipcIjoyMSxcIiVcIjoyMixcIi9cIjoyMyxcIlBPV0VSe1wiOjI0LFwifVwiOjI1LFwiX3tcIjoyNixcIiFcIjoyNyxcIl9TSU5HTEVcIjoyOCxcIlNRUlR7XCI6MjksXCJGUkFDe1wiOjMwLFwie1wiOjMxLFwiXlNJTkdMRUFcIjozMixcIl5TSU5HTEVQXCI6MzMsXCJpZGVudGlmaWVyXCI6MzQsXCJudW1iZXJcIjozNSxcIklERU5USUZJRVJcIjozNixcIkxPTkdJREVOVElGSUVSXCI6MzcsXCJERUNJTUFMXCI6MzgsXCJJTlRFR0VSXCI6MzksXCIkYWNjZXB0XCI6MCxcIiRlbmRcIjoxfSxcbnRlcm1pbmFsc186IHsyOlwiZXJyb3JcIiw1OlwiRU9GXCIsODpcIj1cIiw5OlwiIT1cIiwxMDpcIjw9XCIsMTE6XCI8XCIsMTI6XCI+XCIsMTM6XCI+PVwiLDE1OlwiLFwiLDE3OlwiKFwiLDE4OlwiKVwiLDE5OlwiK1wiLDIwOlwiLVwiLDIxOlwiKlwiLDIyOlwiJVwiLDIzOlwiL1wiLDI0OlwiUE9XRVJ7XCIsMjU6XCJ9XCIsMjY6XCJfe1wiLDI3OlwiIVwiLDI4OlwiX1NJTkdMRVwiLDI5OlwiU1FSVHtcIiwzMDpcIkZSQUN7XCIsMzE6XCJ7XCIsMzI6XCJeU0lOR0xFQVwiLDMzOlwiXlNJTkdMRVBcIiwzNjpcIklERU5USUZJRVJcIiwzNzpcIkxPTkdJREVOVElGSUVSXCIsMzg6XCJERUNJTUFMXCIsMzk6XCJJTlRFR0VSXCJ9LFxucHJvZHVjdGlvbnNfOiBbMCxbMywyXSxbNCwxXSxbNCwxXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbMTQsM10sWzE0LDNdLFsxNiwzXSxbNiwzXSxbNiwzXSxbNiwzXSxbNiwzXSxbNiwzXSxbNiw0XSxbNiw0XSxbNiwyXSxbNiwyXSxbNiwzXSxbNiw2XSxbNiwyXSxbNiwyXSxbNiwyXSxbNiwyXSxbNiwzXSxbNiwxXSxbNiwxXSxbNiwxXSxbMzQsMV0sWzM0LDFdLFszNSwxXSxbMzUsMV1dLFxucGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5dGV4dCwgeXlsZW5nLCB5eWxpbmVubywgeXksIHl5c3RhdGUgLyogYWN0aW9uWzFdICovLCAkJCAvKiB2c3RhY2sgKi8sIF8kIC8qIGxzdGFjayAqLykge1xuLyogdGhpcyA9PSB5eXZhbCAqL1xuXG52YXIgJDAgPSAkJC5sZW5ndGggLSAxO1xuc3dpdGNoICh5eXN0YXRlKSB7XG5jYXNlIDE6IHJldHVybiAkJFskMC0xXTsgXG5icmVhaztcbmNhc2UgMjp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMzp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgNDp0aGlzLiQgPSBbJz0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA1OnRoaXMuJCA9IFsnIT0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA2OnRoaXMuJCA9IFsnPD0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA3OnRoaXMuJCA9IFsnPCcsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDg6dGhpcy4kID0gWyc+JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgOTp0aGlzLiQgPSBbJz49JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTA6dGhpcy4kID0gWycsLicsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDExOnRoaXMuJCA9IFsnLCcsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDEyOnRoaXMuJCA9ICQkWyQwLTFdO1xuYnJlYWs7XG5jYXNlIDEzOnRoaXMuJCA9IFsnKycsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE0OnRoaXMuJCA9IFsnLScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE1OnRoaXMuJCA9IFsnKicsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE2OnRoaXMuJCA9IFsnJScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE3OnRoaXMuJCA9IFsnLycsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE4OnRoaXMuJCA9IFsnXicsICQkWyQwLTNdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMTk6dGhpcy4kID0gWydfJywgJCRbJDAtM10sICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAyMDp0aGlzLiQgPSBbJyEnLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjE6dGhpcy4kID0gWydfJywgJCRbJDAtMV0sIHt0eXBlOiAnU2luZ2xlJywgcHJpbWl0aXZlOiB5eXRleHQuc3Vic3RyaW5nKDEpfV07XG5icmVhaztcbmNhc2UgMjI6dGhpcy4kID0gWydzcXJ0JywgJCRbJDAtMV1dO1xuYnJlYWs7XG5jYXNlIDIzOnRoaXMuJCA9IFsnZnJhYycsICQkWyQwLTRdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjQ6dGhpcy4kID0gWydeJywgJCRbJDAtMV0sIHl5dGV4dC5zdWJzdHJpbmcoMSldO1xuYnJlYWs7XG5jYXNlIDI1OnRoaXMuJCA9IFsnXicsICQkWyQwLTFdLCB7dHlwZTogJ1NpbmdsZScsIHByaW1pdGl2ZTogeXl0ZXh0LnN1YnN0cmluZygxKX1dO1xuYnJlYWs7XG5jYXNlIDI2OnRoaXMuJCA9IFsnQC0nLCAkJFskMF1dXG5icmVhaztcbmNhc2UgMjc6dGhpcy4kID0gWydkZWZhdWx0JywgJCRbJDAtMV0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMjg6dGhpcy4kID0gJCRbJDAtMV1cbmJyZWFrO1xuY2FzZSAyOTp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMzA6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDMxOnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSAzMjp0aGlzLiQgPSB5eXRleHQ7XG5icmVhaztcbmNhc2UgMzM6dGhpcy4kID0geXl0ZXh0LnN1YnN0cmluZygxKTtcbmJyZWFrO1xuY2FzZSAzNDp0aGlzLiQgPSB7dHlwZTogJ051bWJlcicsIHByaW1pdGl2ZTogeXl0ZXh0fTtcbmJyZWFrO1xuY2FzZSAzNTp0aGlzLiQgPSB7dHlwZTogJ051bWJlcicsIHByaW1pdGl2ZTogeXl0ZXh0fTtcbmJyZWFrO1xufVxufSxcbnRhYmxlOiBbezM6MSw0OjIsNjozLDc6NCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezE6WzNdfSx7NTpbMSwxNl19LHs1OlsyLDJdLDY6MjgsODpbMSwyOV0sOTpbMSwzMF0sMTA6WzEsMzFdLDExOlsxLDMyXSwxMjpbMSwzM10sMTM6WzEsMzRdLDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjU6WzIsMl0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSwyNV0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDNdLDI1OlsyLDNdfSx7NjozNSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezY6MzYsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjM3LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjk6WzEsNV0sMzA6WzEsNl0sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7NjozOCwxNDozOSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsMjldLDg6WzIsMjldLDk6WzIsMjldLDEwOlsyLDI5XSwxMTpbMiwyOV0sMTI6WzIsMjldLDEzOlsyLDI5XSwxNTpbMiwyOV0sMTc6WzIsMjldLDE4OlsyLDI5XSwxOTpbMiwyOV0sMjA6WzIsMjldLDIxOlsyLDI5XSwyMjpbMiwyOV0sMjM6WzIsMjldLDI0OlsyLDI5XSwyNTpbMiwyOV0sMjY6WzIsMjldLDI3OlsyLDI5XSwyODpbMiwyOV0sMjk6WzIsMjldLDMwOlsyLDI5XSwzMjpbMiwyOV0sMzM6WzIsMjldLDM2OlsyLDI5XSwzNzpbMiwyOV0sMzg6WzIsMjldLDM5OlsyLDI5XX0sezU6WzIsMzBdLDg6WzIsMzBdLDk6WzIsMzBdLDEwOlsyLDMwXSwxMTpbMiwzMF0sMTI6WzIsMzBdLDEzOlsyLDMwXSwxNTpbMiwzMF0sMTc6WzIsMzBdLDE4OlsyLDMwXSwxOTpbMiwzMF0sMjA6WzIsMzBdLDIxOlsyLDMwXSwyMjpbMiwzMF0sMjM6WzIsMzBdLDI0OlsyLDMwXSwyNTpbMiwzMF0sMjY6WzIsMzBdLDI3OlsyLDMwXSwyODpbMiwzMF0sMjk6WzIsMzBdLDMwOlsyLDMwXSwzMjpbMiwzMF0sMzM6WzIsMzBdLDM2OlsyLDMwXSwzNzpbMiwzMF0sMzg6WzIsMzBdLDM5OlsyLDMwXX0sezU6WzIsMzFdLDg6WzIsMzFdLDk6WzIsMzFdLDEwOlsyLDMxXSwxMTpbMiwzMV0sMTI6WzIsMzFdLDEzOlsyLDMxXSwxNTpbMiwzMV0sMTc6WzIsMzFdLDE4OlsyLDMxXSwxOTpbMiwzMV0sMjA6WzIsMzFdLDIxOlsyLDMxXSwyMjpbMiwzMV0sMjM6WzIsMzFdLDI0OlsyLDMxXSwyNTpbMiwzMV0sMjY6WzIsMzFdLDI3OlsyLDMxXSwyODpbMiwzMV0sMjk6WzIsMzFdLDMwOlsyLDMxXSwzMjpbMiwzMV0sMzM6WzIsMzFdLDM2OlsyLDMxXSwzNzpbMiwzMV0sMzg6WzIsMzFdLDM5OlsyLDMxXX0sezU6WzIsMzJdLDg6WzIsMzJdLDk6WzIsMzJdLDEwOlsyLDMyXSwxMTpbMiwzMl0sMTI6WzIsMzJdLDEzOlsyLDMyXSwxNTpbMiwzMl0sMTc6WzIsMzJdLDE4OlsyLDMyXSwxOTpbMiwzMl0sMjA6WzIsMzJdLDIxOlsyLDMyXSwyMjpbMiwzMl0sMjM6WzIsMzJdLDI0OlsyLDMyXSwyNTpbMiwzMl0sMjY6WzIsMzJdLDI3OlsyLDMyXSwyODpbMiwzMl0sMjk6WzIsMzJdLDMwOlsyLDMyXSwzMjpbMiwzMl0sMzM6WzIsMzJdLDM2OlsyLDMyXSwzNzpbMiwzMl0sMzg6WzIsMzJdLDM5OlsyLDMyXX0sezU6WzIsMzNdLDg6WzIsMzNdLDk6WzIsMzNdLDEwOlsyLDMzXSwxMTpbMiwzM10sMTI6WzIsMzNdLDEzOlsyLDMzXSwxNTpbMiwzM10sMTc6WzIsMzNdLDE4OlsyLDMzXSwxOTpbMiwzM10sMjA6WzIsMzNdLDIxOlsyLDMzXSwyMjpbMiwzM10sMjM6WzIsMzNdLDI0OlsyLDMzXSwyNTpbMiwzM10sMjY6WzIsMzNdLDI3OlsyLDMzXSwyODpbMiwzM10sMjk6WzIsMzNdLDMwOlsyLDMzXSwzMjpbMiwzM10sMzM6WzIsMzNdLDM2OlsyLDMzXSwzNzpbMiwzM10sMzg6WzIsMzNdLDM5OlsyLDMzXX0sezU6WzIsMzRdLDg6WzIsMzRdLDk6WzIsMzRdLDEwOlsyLDM0XSwxMTpbMiwzNF0sMTI6WzIsMzRdLDEzOlsyLDM0XSwxNTpbMiwzNF0sMTc6WzIsMzRdLDE4OlsyLDM0XSwxOTpbMiwzNF0sMjA6WzIsMzRdLDIxOlsyLDM0XSwyMjpbMiwzNF0sMjM6WzIsMzRdLDI0OlsyLDM0XSwyNTpbMiwzNF0sMjY6WzIsMzRdLDI3OlsyLDM0XSwyODpbMiwzNF0sMjk6WzIsMzRdLDMwOlsyLDM0XSwzMjpbMiwzNF0sMzM6WzIsMzRdLDM2OlsyLDM0XSwzNzpbMiwzNF0sMzg6WzIsMzRdLDM5OlsyLDM0XX0sezU6WzIsMzVdLDg6WzIsMzVdLDk6WzIsMzVdLDEwOlsyLDM1XSwxMTpbMiwzNV0sMTI6WzIsMzVdLDEzOlsyLDM1XSwxNTpbMiwzNV0sMTc6WzIsMzVdLDE4OlsyLDM1XSwxOTpbMiwzNV0sMjA6WzIsMzVdLDIxOlsyLDM1XSwyMjpbMiwzNV0sMjM6WzIsMzVdLDI0OlsyLDM1XSwyNTpbMiwzNV0sMjY6WzIsMzVdLDI3OlsyLDM1XSwyODpbMiwzNV0sMjk6WzIsMzVdLDMwOlsyLDM1XSwzMjpbMiwzNV0sMzM6WzIsMzVdLDM2OlsyLDM1XSwzNzpbMiwzNV0sMzg6WzIsMzVdLDM5OlsyLDM1XX0sezE6WzIsMV19LHs2OjQwLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjk6WzEsNV0sMzA6WzEsNl0sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7Njo0MSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezY6NDIsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjQzLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjk6WzEsNV0sMzA6WzEsNl0sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7Njo0NCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezY6NDUsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs0OjQ2LDY6Myw3OjQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDIwXSw4OlsyLDIwXSw5OlsyLDIwXSwxMDpbMiwyMF0sMTE6WzIsMjBdLDEyOlsyLDIwXSwxMzpbMiwyMF0sMTU6WzIsMjBdLDE3OlsyLDIwXSwxODpbMiwyMF0sMTk6WzIsMjBdLDIwOlsyLDIwXSwyMTpbMiwyMF0sMjI6WzIsMjBdLDIzOlsyLDIwXSwyNDpbMiwyMF0sMjU6WzIsMjBdLDI2OlsyLDIwXSwyNzpbMiwyMF0sMjg6WzIsMjBdLDI5OlsyLDIwXSwzMDpbMiwyMF0sMzI6WzIsMjBdLDMzOlsyLDIwXSwzNjpbMiwyMF0sMzc6WzIsMjBdLDM4OlsyLDIwXSwzOTpbMiwyMF19LHs1OlsyLDIxXSw4OlsyLDIxXSw5OlsyLDIxXSwxMDpbMiwyMV0sMTE6WzIsMjFdLDEyOlsyLDIxXSwxMzpbMiwyMV0sMTU6WzIsMjFdLDE3OlsyLDIxXSwxODpbMiwyMV0sMTk6WzIsMjFdLDIwOlsyLDIxXSwyMTpbMiwyMV0sMjI6WzIsMjFdLDIzOlsyLDIxXSwyNDpbMiwyMV0sMjU6WzIsMjFdLDI2OlsyLDIxXSwyNzpbMiwyMV0sMjg6WzIsMjFdLDI5OlsyLDIxXSwzMDpbMiwyMV0sMzI6WzIsMjFdLDMzOlsyLDIxXSwzNjpbMiwyMV0sMzc6WzIsMjFdLDM4OlsyLDIxXSwzOTpbMiwyMV19LHs1OlsyLDI0XSw4OlsyLDI0XSw5OlsyLDI0XSwxMDpbMiwyNF0sMTE6WzIsMjRdLDEyOlsyLDI0XSwxMzpbMiwyNF0sMTU6WzIsMjRdLDE3OlsyLDI0XSwxODpbMiwyNF0sMTk6WzIsMjRdLDIwOlsyLDI0XSwyMTpbMiwyNF0sMjI6WzIsMjRdLDIzOlsyLDI0XSwyNDpbMiwyNF0sMjU6WzIsMjRdLDI2OlsyLDI0XSwyNzpbMiwyNF0sMjg6WzIsMjRdLDI5OlsyLDI0XSwzMDpbMiwyNF0sMzI6WzIsMjRdLDMzOlsyLDI0XSwzNjpbMiwyNF0sMzc6WzIsMjRdLDM4OlsyLDI0XSwzOTpbMiwyNF19LHs1OlsyLDI1XSw4OlsyLDI1XSw5OlsyLDI1XSwxMDpbMiwyNV0sMTE6WzIsMjVdLDEyOlsyLDI1XSwxMzpbMiwyNV0sMTU6WzIsMjVdLDE3OlsyLDI1XSwxODpbMiwyNV0sMTk6WzIsMjVdLDIwOlsyLDI1XSwyMTpbMiwyNV0sMjI6WzIsMjVdLDIzOlsyLDI1XSwyNDpbMiwyNV0sMjU6WzIsMjVdLDI2OlsyLDI1XSwyNzpbMiwyNV0sMjg6WzIsMjVdLDI5OlsyLDI1XSwzMDpbMiwyNV0sMzI6WzIsMjVdLDMzOlsyLDI1XSwzNjpbMiwyNV0sMzc6WzIsMjVdLDM4OlsyLDI1XSwzOTpbMiwyNV19LHs1OlsyLDI3XSw2OjI4LDg6WzIsMjddLDk6WzIsMjddLDEwOlsyLDI3XSwxMTpbMiwyN10sMTI6WzIsMjddLDEzOlsyLDI3XSwxNTpbMiwyN10sMTY6OSwxNzpbMSw4XSwxODpbMiwyN10sMTk6WzIsMjddLDIwOlsyLDI3XSwyMTpbMiwyN10sMjI6WzIsMjddLDIzOlsyLDI3XSwyNDpbMSwyMl0sMjU6WzIsMjddLDI2OlsyLDI3XSwyNzpbMiwyN10sMjg6WzIsMjddLDI5OlsyLDI3XSwzMDpbMiwyN10sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjQ3LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjk6WzEsNV0sMzA6WzEsNl0sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7Njo0OCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezY6NDksMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjUwLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjk6WzEsNV0sMzA6WzEsNl0sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7Njo1MSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezY6NTIsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjI4LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjU6WzEsNTNdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsMjVdLDI5OlsxLDVdLDMwOlsxLDZdLDMyOlsxLDI2XSwzMzpbMSwyN10sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7NjoyOCwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsMjJdLDI1OlsxLDU0XSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDI1XSwyOTpbMSw1XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsMjZdLDY6MjgsODpbMiwyNl0sOTpbMiwyNl0sMTA6WzIsMjZdLDExOlsyLDI2XSwxMjpbMiwyNl0sMTM6WzIsMjZdLDE1OlsyLDI2XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDI2XSwxOTpbMiwyNl0sMjA6WzIsMjZdLDIxOlsyLDI2XSwyMjpbMSwyMF0sMjM6WzIsMjZdLDI0OlsxLDIyXSwyNTpbMiwyNl0sMjY6WzIsMjZdLDI3OlsxLDI0XSwyODpbMiwyNl0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjI4LDE1OlsxLDU2XSwxNjo5LDE3OlsxLDhdLDE4OlsxLDU1XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDI1XSwyOTpbMSw1XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezE1OlsxLDU4XSwxODpbMSw1N119LHs1OlsyLDEzXSw2OjI4LDg6WzIsMTNdLDk6WzIsMTNdLDEwOlsyLDEzXSwxMTpbMiwxM10sMTI6WzIsMTNdLDEzOlsyLDEzXSwxNTpbMiwxM10sMTY6OSwxNzpbMSw4XSwxODpbMiwxM10sMTk6WzIsMTNdLDIwOlsyLDEzXSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjU6WzIsMTNdLDI2OlsyLDEzXSwyNzpbMSwyNF0sMjg6WzIsMTNdLDI5OlsxLDVdLDMwOlsxLDZdLDMyOlsxLDI2XSwzMzpbMSwyN10sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7NTpbMiwxNF0sNjoyOCw4OlsyLDE0XSw5OlsyLDE0XSwxMDpbMiwxNF0sMTE6WzIsMTRdLDEyOlsyLDE0XSwxMzpbMiwxNF0sMTU6WzIsMTRdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTRdLDE5OlsyLDE0XSwyMDpbMiwxNF0sMjE6WzIsMjZdLDIyOlsxLDIwXSwyMzpbMiwyNl0sMjQ6WzEsMjJdLDI1OlsyLDE0XSwyNjpbMiwxNF0sMjc6WzEsMjRdLDI4OlsyLDE0XSwyOTpbMSw1XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsMTVdLDY6MjgsODpbMiwxNV0sOTpbMiwxNV0sMTA6WzIsMTVdLDExOlsyLDE1XSwxMjpbMiwxNV0sMTM6WzIsMTVdLDE1OlsyLDE1XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDE1XSwxOTpbMiwxNV0sMjA6WzIsMTVdLDIxOlsyLDE1XSwyMjpbMSwyMF0sMjM6WzIsMTVdLDI0OlsxLDIyXSwyNTpbMiwxNV0sMjY6WzIsMTVdLDI3OlsxLDI0XSwyODpbMiwxNV0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDE2XSw2OjI4LDg6WzIsMTZdLDk6WzIsMTZdLDEwOlsyLDE2XSwxMTpbMiwxNl0sMTI6WzIsMTZdLDEzOlsyLDE2XSwxNTpbMiwxNl0sMTY6OSwxNzpbMSw4XSwxODpbMiwxNl0sMTk6WzIsMTZdLDIwOlsyLDE2XSwyMTpbMiwxNl0sMjI6WzEsMjBdLDIzOlsyLDE2XSwyNDpbMSwyMl0sMjU6WzIsMTZdLDI2OlsyLDE2XSwyNzpbMiwxNl0sMjg6WzIsMTZdLDI5OlsyLDE2XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsMTddLDY6MjgsODpbMiwxN10sOTpbMiwxN10sMTA6WzIsMTddLDExOlsyLDE3XSwxMjpbMiwxN10sMTM6WzIsMTddLDE1OlsyLDE3XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDE3XSwxOTpbMiwxN10sMjA6WzIsMTddLDIxOlsyLDE3XSwyMjpbMSwyMF0sMjM6WzIsMTddLDI0OlsxLDIyXSwyNTpbMiwxN10sMjY6WzIsMTddLDI3OlsxLDI0XSwyODpbMiwxN10sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjI4LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjU6WzEsNTldLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsMjVdLDI5OlsxLDVdLDMwOlsxLDZdLDMyOlsxLDI2XSwzMzpbMSwyN10sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7MjU6WzEsNjBdfSx7NTpbMiw0XSw2OjI4LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjU6WzIsNF0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSwyNV0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDVdLDY6MjgsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDIyXSwyNTpbMiw1XSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDI1XSwyOTpbMSw1XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsNl0sNjoyOCwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsMjJdLDI1OlsyLDZdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsMjVdLDI5OlsxLDVdLDMwOlsxLDZdLDMyOlsxLDI2XSwzMzpbMSwyN10sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7NTpbMiw3XSw2OjI4LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjU6WzIsN10sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSwyNV0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDhdLDY6MjgsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDIyXSwyNTpbMiw4XSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDI1XSwyOTpbMSw1XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsOV0sNjoyOCwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsMjJdLDI1OlsyLDldLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsMjVdLDI5OlsxLDVdLDMwOlsxLDZdLDMyOlsxLDI2XSwzMzpbMSwyN10sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7NTpbMiwyMl0sODpbMiwyMl0sOTpbMiwyMl0sMTA6WzIsMjJdLDExOlsyLDIyXSwxMjpbMiwyMl0sMTM6WzIsMjJdLDE1OlsyLDIyXSwxNzpbMiwyMl0sMTg6WzIsMjJdLDE5OlsyLDIyXSwyMDpbMiwyMl0sMjE6WzIsMjJdLDIyOlsyLDIyXSwyMzpbMiwyMl0sMjQ6WzIsMjJdLDI1OlsyLDIyXSwyNjpbMiwyMl0sMjc6WzIsMjJdLDI4OlsyLDIyXSwyOTpbMiwyMl0sMzA6WzIsMjJdLDMyOlsyLDIyXSwzMzpbMiwyMl0sMzY6WzIsMjJdLDM3OlsyLDIyXSwzODpbMiwyMl0sMzk6WzIsMjJdfSx7MzE6WzEsNjFdfSx7NTpbMiwyOF0sODpbMiwyOF0sOTpbMiwyOF0sMTA6WzIsMjhdLDExOlsyLDI4XSwxMjpbMiwyOF0sMTM6WzIsMjhdLDE1OlsyLDI4XSwxNzpbMiwyOF0sMTg6WzIsMjhdLDE5OlsyLDI4XSwyMDpbMiwyOF0sMjE6WzIsMjhdLDIyOlsyLDI4XSwyMzpbMiwyOF0sMjQ6WzIsMjhdLDI1OlsyLDI4XSwyNjpbMiwyOF0sMjc6WzIsMjhdLDI4OlsyLDI4XSwyOTpbMiwyOF0sMzA6WzIsMjhdLDMyOlsyLDI4XSwzMzpbMiwyOF0sMzY6WzIsMjhdLDM3OlsyLDI4XSwzODpbMiwyOF0sMzk6WzIsMjhdfSx7Njo2MiwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI5OlsxLDVdLDMwOlsxLDZdLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezU6WzIsMTJdLDg6WzIsMTJdLDk6WzIsMTJdLDEwOlsyLDEyXSwxMTpbMiwxMl0sMTI6WzIsMTJdLDEzOlsyLDEyXSwxNTpbMiwxMl0sMTc6WzIsMTJdLDE4OlsyLDEyXSwxOTpbMiwxMl0sMjA6WzIsMTJdLDIxOlsyLDEyXSwyMjpbMiwxMl0sMjM6WzIsMTJdLDI0OlsyLDEyXSwyNTpbMiwxMl0sMjY6WzIsMTJdLDI3OlsyLDEyXSwyODpbMiwxMl0sMjk6WzIsMTJdLDMwOlsyLDEyXSwzMjpbMiwxMl0sMzM6WzIsMTJdLDM2OlsyLDEyXSwzNzpbMiwxMl0sMzg6WzIsMTJdLDM5OlsyLDEyXX0sezY6NjMsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyOTpbMSw1XSwzMDpbMSw2XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDE4XSw4OlsyLDE4XSw5OlsyLDE4XSwxMDpbMiwxOF0sMTE6WzIsMThdLDEyOlsyLDE4XSwxMzpbMiwxOF0sMTU6WzIsMThdLDE3OlsyLDE4XSwxODpbMiwxOF0sMTk6WzIsMThdLDIwOlsyLDE4XSwyMTpbMiwxOF0sMjI6WzIsMThdLDIzOlsyLDE4XSwyNDpbMiwxOF0sMjU6WzIsMThdLDI2OlsyLDE4XSwyNzpbMiwxOF0sMjg6WzIsMThdLDI5OlsyLDE4XSwzMDpbMiwxOF0sMzI6WzIsMThdLDMzOlsyLDE4XSwzNjpbMiwxOF0sMzc6WzIsMThdLDM4OlsyLDE4XSwzOTpbMiwxOF19LHs1OlsyLDE5XSw4OlsyLDE5XSw5OlsyLDE5XSwxMDpbMiwxOV0sMTE6WzIsMTldLDEyOlsyLDE5XSwxMzpbMiwxOV0sMTU6WzIsMTldLDE3OlsyLDE5XSwxODpbMiwxOV0sMTk6WzIsMTldLDIwOlsyLDE5XSwyMTpbMiwxOV0sMjI6WzIsMTldLDIzOlsyLDE5XSwyNDpbMiwxOV0sMjU6WzIsMTldLDI2OlsyLDE5XSwyNzpbMiwxOV0sMjg6WzIsMTldLDI5OlsyLDE5XSwzMDpbMiwxOV0sMzI6WzIsMTldLDMzOlsyLDE5XSwzNjpbMiwxOV0sMzc6WzIsMTldLDM4OlsyLDE5XSwzOTpbMiwxOV19LHs2OjY0LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjk6WzEsNV0sMzA6WzEsNl0sMzQ6MTAsMzU6MTEsMzY6WzEsMTJdLDM3OlsxLDEzXSwzODpbMSwxNF0sMzk6WzEsMTVdfSx7NjoyOCwxNTpbMiwxMV0sMTY6OSwxNzpbMSw4XSwxODpbMiwxMV0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSwyNV0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs2OjI4LDE1OlsyLDEwXSwxNjo5LDE3OlsxLDhdLDE4OlsyLDEwXSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDI1XSwyOTpbMSw1XSwzMDpbMSw2XSwzMjpbMSwyNl0sMzM6WzEsMjddLDM0OjEwLDM1OjExLDM2OlsxLDEyXSwzNzpbMSwxM10sMzg6WzEsMTRdLDM5OlsxLDE1XX0sezY6MjgsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDIyXSwyNTpbMSw2NV0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSwyNV0sMjk6WzEsNV0sMzA6WzEsNl0sMzI6WzEsMjZdLDMzOlsxLDI3XSwzNDoxMCwzNToxMSwzNjpbMSwxMl0sMzc6WzEsMTNdLDM4OlsxLDE0XSwzOTpbMSwxNV19LHs1OlsyLDIzXSw4OlsyLDIzXSw5OlsyLDIzXSwxMDpbMiwyM10sMTE6WzIsMjNdLDEyOlsyLDIzXSwxMzpbMiwyM10sMTU6WzIsMjNdLDE3OlsyLDIzXSwxODpbMiwyM10sMTk6WzIsMjNdLDIwOlsyLDIzXSwyMTpbMiwyM10sMjI6WzIsMjNdLDIzOlsyLDIzXSwyNDpbMiwyM10sMjU6WzIsMjNdLDI2OlsyLDIzXSwyNzpbMiwyM10sMjg6WzIsMjNdLDI5OlsyLDIzXSwzMDpbMiwyM10sMzI6WzIsMjNdLDMzOlsyLDIzXSwzNjpbMiwyM10sMzc6WzIsMjNdLDM4OlsyLDIzXSwzOTpbMiwyM119XSxcbmRlZmF1bHRBY3Rpb25zOiB7MTY6WzIsMV19LFxucGFyc2VFcnJvcjogZnVuY3Rpb24gcGFyc2VFcnJvcihzdHIsIGhhc2gpIHtcbiAgICBpZiAoaGFzaC5yZWNvdmVyYWJsZSkge1xuICAgICAgICB0aGlzLnRyYWNlKHN0cik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHN0cik7XG4gICAgfVxufSxcbnBhcnNlOiBmdW5jdGlvbiBwYXJzZShpbnB1dCkge1xuICAgIHZhciBzZWxmID0gdGhpcywgc3RhY2sgPSBbMF0sIHZzdGFjayA9IFtudWxsXSwgbHN0YWNrID0gW10sIHRhYmxlID0gdGhpcy50YWJsZSwgeXl0ZXh0ID0gJycsIHl5bGluZW5vID0gMCwgeXlsZW5nID0gMCwgcmVjb3ZlcmluZyA9IDAsIFRFUlJPUiA9IDIsIEVPRiA9IDE7XG4gICAgdGhpcy5sZXhlci5zZXRJbnB1dChpbnB1dCk7XG4gICAgdGhpcy5sZXhlci55eSA9IHRoaXMueXk7XG4gICAgdGhpcy55eS5sZXhlciA9IHRoaXMubGV4ZXI7XG4gICAgdGhpcy55eS5wYXJzZXIgPSB0aGlzO1xuICAgIGlmICh0eXBlb2YgdGhpcy5sZXhlci55eWxsb2MgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5sZXhlci55eWxsb2MgPSB7fTtcbiAgICB9XG4gICAgdmFyIHl5bG9jID0gdGhpcy5sZXhlci55eWxsb2M7XG4gICAgbHN0YWNrLnB1c2goeXlsb2MpO1xuICAgIHZhciByYW5nZXMgPSB0aGlzLmxleGVyLm9wdGlvbnMgJiYgdGhpcy5sZXhlci5vcHRpb25zLnJhbmdlcztcbiAgICBpZiAodHlwZW9mIHRoaXMueXkucGFyc2VFcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnBhcnNlRXJyb3IgPSB0aGlzLnl5LnBhcnNlRXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wYXJzZUVycm9yID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLnBhcnNlRXJyb3I7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvcFN0YWNrKG4pIHtcbiAgICAgICAgc3RhY2subGVuZ3RoID0gc3RhY2subGVuZ3RoIC0gMiAqIG47XG4gICAgICAgIHZzdGFjay5sZW5ndGggPSB2c3RhY2subGVuZ3RoIC0gbjtcbiAgICAgICAgbHN0YWNrLmxlbmd0aCA9IGxzdGFjay5sZW5ndGggLSBuO1xuICAgIH1cbiAgICBmdW5jdGlvbiBsZXgoKSB7XG4gICAgICAgIHZhciB0b2tlbjtcbiAgICAgICAgdG9rZW4gPSBzZWxmLmxleGVyLmxleCgpIHx8IEVPRjtcbiAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRva2VuID0gc2VsZi5zeW1ib2xzX1t0b2tlbl0gfHwgdG9rZW47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH1cbiAgICB2YXIgc3ltYm9sLCBwcmVFcnJvclN5bWJvbCwgc3RhdGUsIGFjdGlvbiwgYSwgciwgeXl2YWwgPSB7fSwgcCwgbGVuLCBuZXdTdGF0ZSwgZXhwZWN0ZWQ7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgc3RhdGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKHRoaXMuZGVmYXVsdEFjdGlvbnNbc3RhdGVdKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25zW3N0YXRlXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2wgPT09IG51bGwgfHwgdHlwZW9mIHN5bWJvbCA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHN5bWJvbCA9IGxleCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWN0aW9uID0gdGFibGVbc3RhdGVdICYmIHRhYmxlW3N0YXRlXVtzeW1ib2xdO1xuICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0aW9uID09PSAndW5kZWZpbmVkJyB8fCAhYWN0aW9uLmxlbmd0aCB8fCAhYWN0aW9uWzBdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyclN0ciA9ICcnO1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChwIGluIHRhYmxlW3N0YXRlXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50ZXJtaW5hbHNfW3BdICYmIHAgPiBURVJST1IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkLnB1c2goJ1xcJycgKyB0aGlzLnRlcm1pbmFsc19bcF0gKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGV4ZXIuc2hvd1Bvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyclN0ciA9ICdQYXJzZSBlcnJvciBvbiBsaW5lICcgKyAoeXlsaW5lbm8gKyAxKSArICc6XFxuJyArIHRoaXMubGV4ZXIuc2hvd1Bvc2l0aW9uKCkgKyAnXFxuRXhwZWN0aW5nICcgKyBleHBlY3RlZC5qb2luKCcsICcpICsgJywgZ290IFxcJycgKyAodGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sKSArICdcXCcnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVyclN0ciA9ICdQYXJzZSBlcnJvciBvbiBsaW5lICcgKyAoeXlsaW5lbm8gKyAxKSArICc6IFVuZXhwZWN0ZWQgJyArIChzeW1ib2wgPT0gRU9GID8gJ2VuZCBvZiBpbnB1dCcgOiAnXFwnJyArICh0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wpICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlRXJyb3IoZXJyU3RyLCB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMubGV4ZXIubWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIHRva2VuOiB0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMubGV4ZXIueXlsaW5lbm8sXG4gICAgICAgICAgICAgICAgICAgIGxvYzogeXlsb2MsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uWzBdIGluc3RhbmNlb2YgQXJyYXkgJiYgYWN0aW9uLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGFyc2UgRXJyb3I6IG11bHRpcGxlIGFjdGlvbnMgcG9zc2libGUgYXQgc3RhdGU6ICcgKyBzdGF0ZSArICcsIHRva2VuOiAnICsgc3ltYm9sKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGFjdGlvblswXSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBzdGFjay5wdXNoKHN5bWJvbCk7XG4gICAgICAgICAgICB2c3RhY2sucHVzaCh0aGlzLmxleGVyLnl5dGV4dCk7XG4gICAgICAgICAgICBsc3RhY2sucHVzaCh0aGlzLmxleGVyLnl5bGxvYyk7XG4gICAgICAgICAgICBzdGFjay5wdXNoKGFjdGlvblsxXSk7XG4gICAgICAgICAgICBzeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFwcmVFcnJvclN5bWJvbCkge1xuICAgICAgICAgICAgICAgIHl5bGVuZyA9IHRoaXMubGV4ZXIueXlsZW5nO1xuICAgICAgICAgICAgICAgIHl5dGV4dCA9IHRoaXMubGV4ZXIueXl0ZXh0O1xuICAgICAgICAgICAgICAgIHl5bGluZW5vID0gdGhpcy5sZXhlci55eWxpbmVubztcbiAgICAgICAgICAgICAgICB5eWxvYyA9IHRoaXMubGV4ZXIueXlsbG9jO1xuICAgICAgICAgICAgICAgIGlmIChyZWNvdmVyaW5nID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZWNvdmVyaW5nLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzeW1ib2wgPSBwcmVFcnJvclN5bWJvbDtcbiAgICAgICAgICAgICAgICBwcmVFcnJvclN5bWJvbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgbGVuID0gdGhpcy5wcm9kdWN0aW9uc19bYWN0aW9uWzFdXVsxXTtcbiAgICAgICAgICAgIHl5dmFsLiQgPSB2c3RhY2tbdnN0YWNrLmxlbmd0aCAtIGxlbl07XG4gICAgICAgICAgICB5eXZhbC5fJCA9IHtcbiAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLmZpcnN0X2xpbmUsXG4gICAgICAgICAgICAgICAgbGFzdF9saW5lOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIDFdLmxhc3RfbGluZSxcbiAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IGxzdGFja1tsc3RhY2subGVuZ3RoIC0gKGxlbiB8fCAxKV0uZmlyc3RfY29sdW1uLFxuICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIDFdLmxhc3RfY29sdW1uXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHJhbmdlcykge1xuICAgICAgICAgICAgICAgIHl5dmFsLl8kLnJhbmdlID0gW1xuICAgICAgICAgICAgICAgICAgICBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLnJhbmdlWzBdLFxuICAgICAgICAgICAgICAgICAgICBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIDFdLnJhbmdlWzFdXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHIgPSB0aGlzLnBlcmZvcm1BY3Rpb24uY2FsbCh5eXZhbCwgeXl0ZXh0LCB5eWxlbmcsIHl5bGluZW5vLCB0aGlzLnl5LCBhY3Rpb25bMV0sIHZzdGFjaywgbHN0YWNrKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsZW4pIHtcbiAgICAgICAgICAgICAgICBzdGFjayA9IHN0YWNrLnNsaWNlKDAsIC0xICogbGVuICogMik7XG4gICAgICAgICAgICAgICAgdnN0YWNrID0gdnN0YWNrLnNsaWNlKDAsIC0xICogbGVuKTtcbiAgICAgICAgICAgICAgICBsc3RhY2sgPSBsc3RhY2suc2xpY2UoMCwgLTEgKiBsZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhY2sucHVzaCh0aGlzLnByb2R1Y3Rpb25zX1thY3Rpb25bMV1dWzBdKTtcbiAgICAgICAgICAgIHZzdGFjay5wdXNoKHl5dmFsLiQpO1xuICAgICAgICAgICAgbHN0YWNrLnB1c2goeXl2YWwuXyQpO1xuICAgICAgICAgICAgbmV3U3RhdGUgPSB0YWJsZVtzdGFja1tzdGFjay5sZW5ndGggLSAyXV1bc3RhY2tbc3RhY2subGVuZ3RoIC0gMV1dO1xuICAgICAgICAgICAgc3RhY2sucHVzaChuZXdTdGF0ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59fTtcbnVuZGVmaW5lZC8qIGdlbmVyYXRlZCBieSBqaXNvbi1sZXggMC4yLjEgKi9cbnZhciBsZXhlciA9IChmdW5jdGlvbigpe1xudmFyIGxleGVyID0ge1xuXG5FT0Y6MSxcblxucGFyc2VFcnJvcjpmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgICAgICBpZiAodGhpcy55eS5wYXJzZXIpIHtcbiAgICAgICAgICAgIHRoaXMueXkucGFyc2VyLnBhcnNlRXJyb3Ioc3RyLCBoYXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIpO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcmVzZXRzIHRoZSBsZXhlciwgc2V0cyBuZXcgaW5wdXRcbnNldElucHV0OmZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuICAgICAgICB0aGlzLl9tb3JlID0gdGhpcy5fYmFja3RyYWNrID0gdGhpcy5kb25lID0gZmFsc2U7XG4gICAgICAgIHRoaXMueXlsaW5lbm8gPSB0aGlzLnl5bGVuZyA9IDA7XG4gICAgICAgIHRoaXMueXl0ZXh0ID0gdGhpcy5tYXRjaGVkID0gdGhpcy5tYXRjaCA9ICcnO1xuICAgICAgICB0aGlzLmNvbmRpdGlvblN0YWNrID0gWydJTklUSUFMJ107XG4gICAgICAgIHRoaXMueXlsbG9jID0ge1xuICAgICAgICAgICAgZmlyc3RfbGluZTogMSxcbiAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogMCxcbiAgICAgICAgICAgIGxhc3RfbGluZTogMSxcbiAgICAgICAgICAgIGxhc3RfY29sdW1uOiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5yYW5nZSA9IFswLDBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gY29uc3VtZXMgYW5kIHJldHVybnMgb25lIGNoYXIgZnJvbSB0aGUgaW5wdXRcbmlucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoID0gdGhpcy5faW5wdXRbMF07XG4gICAgICAgIHRoaXMueXl0ZXh0ICs9IGNoO1xuICAgICAgICB0aGlzLnl5bGVuZysrO1xuICAgICAgICB0aGlzLm9mZnNldCsrO1xuICAgICAgICB0aGlzLm1hdGNoICs9IGNoO1xuICAgICAgICB0aGlzLm1hdGNoZWQgKz0gY2g7XG4gICAgICAgIHZhciBsaW5lcyA9IGNoLm1hdGNoKC8oPzpcXHJcXG4/fFxcbikuKi9nKTtcbiAgICAgICAgaWYgKGxpbmVzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGluZW5vKys7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2xpbmUrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLmxhc3RfY29sdW1uKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlWzFdKys7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbnB1dCA9IHRoaXMuX2lucHV0LnNsaWNlKDEpO1xuICAgICAgICByZXR1cm4gY2g7XG4gICAgfSxcblxuLy8gdW5zaGlmdHMgb25lIGNoYXIgKG9yIGEgc3RyaW5nKSBpbnRvIHRoZSBpbnB1dFxudW5wdXQ6ZnVuY3Rpb24gKGNoKSB7XG4gICAgICAgIHZhciBsZW4gPSBjaC5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5lcyA9IGNoLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSBjaCArIHRoaXMuX2lucHV0O1xuICAgICAgICB0aGlzLnl5dGV4dCA9IHRoaXMueXl0ZXh0LnN1YnN0cigwLCB0aGlzLnl5dGV4dC5sZW5ndGggLSBsZW4gLSAxKTtcbiAgICAgICAgLy90aGlzLnl5bGVuZyAtPSBsZW47XG4gICAgICAgIHRoaXMub2Zmc2V0IC09IGxlbjtcbiAgICAgICAgdmFyIG9sZExpbmVzID0gdGhpcy5tYXRjaC5zcGxpdCgvKD86XFxyXFxuP3xcXG4pL2cpO1xuICAgICAgICB0aGlzLm1hdGNoID0gdGhpcy5tYXRjaC5zdWJzdHIoMCwgdGhpcy5tYXRjaC5sZW5ndGggLSAxKTtcbiAgICAgICAgdGhpcy5tYXRjaGVkID0gdGhpcy5tYXRjaGVkLnN1YnN0cigwLCB0aGlzLm1hdGNoZWQubGVuZ3RoIC0gMSk7XG5cbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMueXlsaW5lbm8gLT0gbGluZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgciA9IHRoaXMueXlsbG9jLnJhbmdlO1xuXG4gICAgICAgIHRoaXMueXlsbG9jID0ge1xuICAgICAgICAgICAgZmlyc3RfbGluZTogdGhpcy55eWxsb2MuZmlyc3RfbGluZSxcbiAgICAgICAgICAgIGxhc3RfbGluZTogdGhpcy55eWxpbmVubyArIDEsXG4gICAgICAgICAgICBmaXJzdF9jb2x1bW46IHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbixcbiAgICAgICAgICAgIGxhc3RfY29sdW1uOiBsaW5lcyA/XG4gICAgICAgICAgICAgICAgKGxpbmVzLmxlbmd0aCA9PT0gb2xkTGluZXMubGVuZ3RoID8gdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uIDogMClcbiAgICAgICAgICAgICAgICAgKyBvbGRMaW5lc1tvbGRMaW5lcy5sZW5ndGggLSBsaW5lcy5sZW5ndGhdLmxlbmd0aCAtIGxpbmVzWzBdLmxlbmd0aCA6XG4gICAgICAgICAgICAgIHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbiAtIGxlblxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5yYW5nZSA9IFtyWzBdLCByWzBdICsgdGhpcy55eWxlbmcgLSBsZW5dO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueXlsZW5nID0gdGhpcy55eXRleHQubGVuZ3RoO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4vLyBXaGVuIGNhbGxlZCBmcm9tIGFjdGlvbiwgY2FjaGVzIG1hdGNoZWQgdGV4dCBhbmQgYXBwZW5kcyBpdCBvbiBuZXh0IGFjdGlvblxubW9yZTpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX21vcmUgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4vLyBXaGVuIGNhbGxlZCBmcm9tIGFjdGlvbiwgc2lnbmFscyB0aGUgbGV4ZXIgdGhhdCB0aGlzIHJ1bGUgZmFpbHMgdG8gbWF0Y2ggdGhlIGlucHV0LCBzbyB0aGUgbmV4dCBtYXRjaGluZyBydWxlIChyZWdleCkgc2hvdWxkIGJlIHRlc3RlZCBpbnN0ZWFkLlxucmVqZWN0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5iYWNrdHJhY2tfbGV4ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2JhY2t0cmFjayA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUVycm9yKCdMZXhpY2FsIGVycm9yIG9uIGxpbmUgJyArICh0aGlzLnl5bGluZW5vICsgMSkgKyAnLiBZb3UgY2FuIG9ubHkgaW52b2tlIHJlamVjdCgpIGluIHRoZSBsZXhlciB3aGVuIHRoZSBsZXhlciBpcyBvZiB0aGUgYmFja3RyYWNraW5nIHBlcnN1YXNpb24gKG9wdGlvbnMuYmFja3RyYWNrX2xleGVyID0gdHJ1ZSkuXFxuJyArIHRoaXMuc2hvd1Bvc2l0aW9uKCksIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMueXlsaW5lbm9cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gcmV0YWluIGZpcnN0IG4gY2hhcmFjdGVycyBvZiB0aGUgbWF0Y2hcbmxlc3M6ZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgdGhpcy51bnB1dCh0aGlzLm1hdGNoLnNsaWNlKG4pKTtcbiAgICB9LFxuXG4vLyBkaXNwbGF5cyBhbHJlYWR5IG1hdGNoZWQgaW5wdXQsIGkuZS4gZm9yIGVycm9yIG1lc3NhZ2VzXG5wYXN0SW5wdXQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFzdCA9IHRoaXMubWF0Y2hlZC5zdWJzdHIoMCwgdGhpcy5tYXRjaGVkLmxlbmd0aCAtIHRoaXMubWF0Y2gubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIChwYXN0Lmxlbmd0aCA+IDIwID8gJy4uLic6JycpICsgcGFzdC5zdWJzdHIoLTIwKS5yZXBsYWNlKC9cXG4vZywgXCJcIik7XG4gICAgfSxcblxuLy8gZGlzcGxheXMgdXBjb21pbmcgaW5wdXQsIGkuZS4gZm9yIGVycm9yIG1lc3NhZ2VzXG51cGNvbWluZ0lucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5leHQgPSB0aGlzLm1hdGNoO1xuICAgICAgICBpZiAobmV4dC5sZW5ndGggPCAyMCkge1xuICAgICAgICAgICAgbmV4dCArPSB0aGlzLl9pbnB1dC5zdWJzdHIoMCwgMjAtbmV4dC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAobmV4dC5zdWJzdHIoMCwyMCkgKyAobmV4dC5sZW5ndGggPiAyMCA/ICcuLi4nIDogJycpKS5yZXBsYWNlKC9cXG4vZywgXCJcIik7XG4gICAgfSxcblxuLy8gZGlzcGxheXMgdGhlIGNoYXJhY3RlciBwb3NpdGlvbiB3aGVyZSB0aGUgbGV4aW5nIGVycm9yIG9jY3VycmVkLCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xuc2hvd1Bvc2l0aW9uOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHByZSA9IHRoaXMucGFzdElucHV0KCk7XG4gICAgICAgIHZhciBjID0gbmV3IEFycmF5KHByZS5sZW5ndGggKyAxKS5qb2luKFwiLVwiKTtcbiAgICAgICAgcmV0dXJuIHByZSArIHRoaXMudXBjb21pbmdJbnB1dCgpICsgXCJcXG5cIiArIGMgKyBcIl5cIjtcbiAgICB9LFxuXG4vLyB0ZXN0IHRoZSBsZXhlZCB0b2tlbjogcmV0dXJuIEZBTFNFIHdoZW4gbm90IGEgbWF0Y2gsIG90aGVyd2lzZSByZXR1cm4gdG9rZW5cbnRlc3RfbWF0Y2g6ZnVuY3Rpb24gKG1hdGNoLCBpbmRleGVkX3J1bGUpIHtcbiAgICAgICAgdmFyIHRva2VuLFxuICAgICAgICAgICAgbGluZXMsXG4gICAgICAgICAgICBiYWNrdXA7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5iYWNrdHJhY2tfbGV4ZXIpIHtcbiAgICAgICAgICAgIC8vIHNhdmUgY29udGV4dFxuICAgICAgICAgICAgYmFja3VwID0ge1xuICAgICAgICAgICAgICAgIHl5bGluZW5vOiB0aGlzLnl5bGluZW5vLFxuICAgICAgICAgICAgICAgIHl5bGxvYzoge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5maXJzdF9saW5lLFxuICAgICAgICAgICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMubGFzdF9saW5lLFxuICAgICAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbixcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46IHRoaXMueXlsbG9jLmxhc3RfY29sdW1uXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB5eXRleHQ6IHRoaXMueXl0ZXh0LFxuICAgICAgICAgICAgICAgIG1hdGNoOiB0aGlzLm1hdGNoLFxuICAgICAgICAgICAgICAgIG1hdGNoZXM6IHRoaXMubWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBtYXRjaGVkOiB0aGlzLm1hdGNoZWQsXG4gICAgICAgICAgICAgICAgeXlsZW5nOiB0aGlzLnl5bGVuZyxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IHRoaXMub2Zmc2V0LFxuICAgICAgICAgICAgICAgIF9tb3JlOiB0aGlzLl9tb3JlLFxuICAgICAgICAgICAgICAgIF9pbnB1dDogdGhpcy5faW5wdXQsXG4gICAgICAgICAgICAgICAgeXk6IHRoaXMueXksXG4gICAgICAgICAgICAgICAgY29uZGl0aW9uU3RhY2s6IHRoaXMuY29uZGl0aW9uU3RhY2suc2xpY2UoMCksXG4gICAgICAgICAgICAgICAgZG9uZTogdGhpcy5kb25lXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBiYWNrdXAueXlsbG9jLnJhbmdlID0gdGhpcy55eWxsb2MucmFuZ2Uuc2xpY2UoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsaW5lcyA9IG1hdGNoWzBdLm1hdGNoKC8oPzpcXHJcXG4/fFxcbikuKi9nKTtcbiAgICAgICAgaWYgKGxpbmVzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGluZW5vICs9IGxpbmVzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnl5bGxvYyA9IHtcbiAgICAgICAgICAgIGZpcnN0X2xpbmU6IHRoaXMueXlsbG9jLmxhc3RfbGluZSxcbiAgICAgICAgICAgIGxhc3RfbGluZTogdGhpcy55eWxpbmVubyArIDEsXG4gICAgICAgICAgICBmaXJzdF9jb2x1bW46IHRoaXMueXlsbG9jLmxhc3RfY29sdW1uLFxuICAgICAgICAgICAgbGFzdF9jb2x1bW46IGxpbmVzID9cbiAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXS5sZW5ndGggLSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXS5tYXRjaCgvXFxyP1xcbj8vKVswXS5sZW5ndGggOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueXlsbG9jLmxhc3RfY29sdW1uICsgbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMueXl0ZXh0ICs9IG1hdGNoWzBdO1xuICAgICAgICB0aGlzLm1hdGNoICs9IG1hdGNoWzBdO1xuICAgICAgICB0aGlzLm1hdGNoZXMgPSBtYXRjaDtcbiAgICAgICAgdGhpcy55eWxlbmcgPSB0aGlzLnl5dGV4dC5sZW5ndGg7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5yYW5nZSA9IFt0aGlzLm9mZnNldCwgdGhpcy5vZmZzZXQgKz0gdGhpcy55eWxlbmddO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21vcmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fYmFja3RyYWNrID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2lucHV0ID0gdGhpcy5faW5wdXQuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5tYXRjaGVkICs9IG1hdGNoWzBdO1xuICAgICAgICB0b2tlbiA9IHRoaXMucGVyZm9ybUFjdGlvbi5jYWxsKHRoaXMsIHRoaXMueXksIHRoaXMsIGluZGV4ZWRfcnVsZSwgdGhpcy5jb25kaXRpb25TdGFja1t0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgaWYgKHRoaXMuZG9uZSAmJiB0aGlzLl9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5kb25lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYmFja3RyYWNrKSB7XG4gICAgICAgICAgICAvLyByZWNvdmVyIGNvbnRleHRcbiAgICAgICAgICAgIGZvciAodmFyIGsgaW4gYmFja3VwKSB7XG4gICAgICAgICAgICAgICAgdGhpc1trXSA9IGJhY2t1cFtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gcnVsZSBhY3Rpb24gY2FsbGVkIHJlamVjdCgpIGltcGx5aW5nIHRoZSBuZXh0IHJ1bGUgc2hvdWxkIGJlIHRlc3RlZCBpbnN0ZWFkLlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4vLyByZXR1cm4gbmV4dCBtYXRjaCBpbiBpbnB1dFxubmV4dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLkVPRjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRva2VuLFxuICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICB0ZW1wTWF0Y2gsXG4gICAgICAgICAgICBpbmRleDtcbiAgICAgICAgaWYgKCF0aGlzLl9tb3JlKSB7XG4gICAgICAgICAgICB0aGlzLnl5dGV4dCA9ICcnO1xuICAgICAgICAgICAgdGhpcy5tYXRjaCA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHZhciBydWxlcyA9IHRoaXMuX2N1cnJlbnRSdWxlcygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0ZW1wTWF0Y2ggPSB0aGlzLl9pbnB1dC5tYXRjaCh0aGlzLnJ1bGVzW3J1bGVzW2ldXSk7XG4gICAgICAgICAgICBpZiAodGVtcE1hdGNoICYmICghbWF0Y2ggfHwgdGVtcE1hdGNoWzBdLmxlbmd0aCA+IG1hdGNoWzBdLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICBtYXRjaCA9IHRlbXBNYXRjaDtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5iYWNrdHJhY2tfbGV4ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4gPSB0aGlzLnRlc3RfbWF0Y2godGVtcE1hdGNoLCBydWxlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9iYWNrdHJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTsgLy8gcnVsZSBhY3Rpb24gY2FsbGVkIHJlamVjdCgpIGltcGx5aW5nIGEgcnVsZSBNSVNtYXRjaC5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsc2U6IHRoaXMgaXMgYSBsZXhlciBydWxlIHdoaWNoIGNvbnN1bWVzIGlucHV0IHdpdGhvdXQgcHJvZHVjaW5nIGEgdG9rZW4gKGUuZy4gd2hpdGVzcGFjZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMub3B0aW9ucy5mbGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHRva2VuID0gdGhpcy50ZXN0X21hdGNoKG1hdGNoLCBydWxlc1tpbmRleF0pO1xuICAgICAgICAgICAgaWYgKHRva2VuICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGVsc2U6IHRoaXMgaXMgYSBsZXhlciBydWxlIHdoaWNoIGNvbnN1bWVzIGlucHV0IHdpdGhvdXQgcHJvZHVjaW5nIGEgdG9rZW4gKGUuZy4gd2hpdGVzcGFjZSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5faW5wdXQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLkVPRjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXJyb3IoJ0xleGljYWwgZXJyb3Igb24gbGluZSAnICsgKHRoaXMueXlsaW5lbm8gKyAxKSArICcuIFVucmVjb2duaXplZCB0ZXh0LlxcbicgKyB0aGlzLnNob3dQb3NpdGlvbigpLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgICAgICAgICB0b2tlbjogbnVsbCxcbiAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLnl5bGluZW5vXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHJldHVybiBuZXh0IG1hdGNoIHRoYXQgaGFzIGEgdG9rZW5cbmxleDpmdW5jdGlvbiBsZXgoKSB7XG4gICAgICAgIHZhciByID0gdGhpcy5uZXh0KCk7XG4gICAgICAgIGlmIChyKSB7XG4gICAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gYWN0aXZhdGVzIGEgbmV3IGxleGVyIGNvbmRpdGlvbiBzdGF0ZSAocHVzaGVzIHRoZSBuZXcgbGV4ZXIgY29uZGl0aW9uIHN0YXRlIG9udG8gdGhlIGNvbmRpdGlvbiBzdGFjaylcbmJlZ2luOmZ1bmN0aW9uIGJlZ2luKGNvbmRpdGlvbikge1xuICAgICAgICB0aGlzLmNvbmRpdGlvblN0YWNrLnB1c2goY29uZGl0aW9uKTtcbiAgICB9LFxuXG4vLyBwb3AgdGhlIHByZXZpb3VzbHkgYWN0aXZlIGxleGVyIGNvbmRpdGlvbiBzdGF0ZSBvZmYgdGhlIGNvbmRpdGlvbiBzdGFja1xucG9wU3RhdGU6ZnVuY3Rpb24gcG9wU3RhdGUoKSB7XG4gICAgICAgIHZhciBuID0gdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxO1xuICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrLnBvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2tbMF07XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyBwcm9kdWNlIHRoZSBsZXhlciBydWxlIHNldCB3aGljaCBpcyBhY3RpdmUgZm9yIHRoZSBjdXJyZW50bHkgYWN0aXZlIGxleGVyIGNvbmRpdGlvbiBzdGF0ZVxuX2N1cnJlbnRSdWxlczpmdW5jdGlvbiBfY3VycmVudFJ1bGVzKCkge1xuICAgICAgICBpZiAodGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggJiYgdGhpcy5jb25kaXRpb25TdGFja1t0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDFdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25zW3RoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXV0ucnVsZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25zW1wiSU5JVElBTFwiXS5ydWxlcztcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHJldHVybiB0aGUgY3VycmVudGx5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGU7IHdoZW4gYW4gaW5kZXggYXJndW1lbnQgaXMgcHJvdmlkZWQgaXQgcHJvZHVjZXMgdGhlIE4tdGggcHJldmlvdXMgY29uZGl0aW9uIHN0YXRlLCBpZiBhdmFpbGFibGVcbnRvcFN0YXRlOmZ1bmN0aW9uIHRvcFN0YXRlKG4pIHtcbiAgICAgICAgbiA9IHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMSAtIE1hdGguYWJzKG4gfHwgMCk7XG4gICAgICAgIGlmIChuID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrW25dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiSU5JVElBTFwiO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gYWxpYXMgZm9yIGJlZ2luKGNvbmRpdGlvbilcbnB1c2hTdGF0ZTpmdW5jdGlvbiBwdXNoU3RhdGUoY29uZGl0aW9uKSB7XG4gICAgICAgIHRoaXMuYmVnaW4oY29uZGl0aW9uKTtcbiAgICB9LFxuXG4vLyByZXR1cm4gdGhlIG51bWJlciBvZiBzdGF0ZXMgY3VycmVudGx5IG9uIHRoZSBzdGFja1xuc3RhdGVTdGFja1NpemU6ZnVuY3Rpb24gc3RhdGVTdGFja1NpemUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aDtcbiAgICB9LFxub3B0aW9uczoge30sXG5wZXJmb3JtQWN0aW9uOiBmdW5jdGlvbiBhbm9ueW1vdXMoeXkseXlfLCRhdm9pZGluZ19uYW1lX2NvbGxpc2lvbnMsWVlfU1RBUlQpIHtcblxudmFyIFlZU1RBVEU9WVlfU1RBUlQ7XG5zd2l0Y2goJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucykge1xuY2FzZSAwOi8qIHNraXAgd2hpdGVzcGFjZSAqL1xuYnJlYWs7XG5jYXNlIDE6cmV0dXJuICdURVhUJ1xuYnJlYWs7XG5jYXNlIDI6cmV0dXJuIDE3XG5icmVhaztcbmNhc2UgMzpyZXR1cm4gMThcbmJyZWFrO1xuY2FzZSA0OnJldHVybiAzMFxuYnJlYWs7XG5jYXNlIDU6cmV0dXJuIDI5XG5icmVhaztcbmNhc2UgNjpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSA3OnJldHVybiAxMFxuYnJlYWs7XG5jYXNlIDg6cmV0dXJuIDEzXG5icmVhaztcbmNhc2UgOTpyZXR1cm4gJ05FJ1xuYnJlYWs7XG5jYXNlIDEwOnJldHVybiAzN1xuYnJlYWs7XG5jYXNlIDExOnJldHVybiAzNlxuYnJlYWs7XG5jYXNlIDEyOnJldHVybiAzOFxuYnJlYWs7XG5jYXNlIDEzOnJldHVybiAzOVxuYnJlYWs7XG5jYXNlIDE0OnJldHVybiA4XG5icmVhaztcbmNhc2UgMTU6cmV0dXJuIDIxXG5icmVhaztcbmNhc2UgMTY6cmV0dXJuIDIxXG5icmVhaztcbmNhc2UgMTc6cmV0dXJuIDIzXG5icmVhaztcbmNhc2UgMTg6cmV0dXJuIDIwXG5icmVhaztcbmNhc2UgMTk6cmV0dXJuIDE5XG5icmVhaztcbmNhc2UgMjA6cmV0dXJuIDEwXG5icmVhaztcbmNhc2UgMjE6cmV0dXJuIDEzXG5icmVhaztcbmNhc2UgMjI6cmV0dXJuIDExXG5icmVhaztcbmNhc2UgMjM6cmV0dXJuIDEyXG5icmVhaztcbmNhc2UgMjQ6cmV0dXJuIDlcbmJyZWFrO1xuY2FzZSAyNTpyZXR1cm4gJyYmJ1xuYnJlYWs7XG5jYXNlIDI2OnJldHVybiAyOFxuYnJlYWs7XG5jYXNlIDI3OnJldHVybiAzM1xuYnJlYWs7XG5jYXNlIDI4OnJldHVybiAzMlxuYnJlYWs7XG5jYXNlIDI5OnJldHVybiAyNlxuYnJlYWs7XG5jYXNlIDMwOnJldHVybiAyNFxuYnJlYWs7XG5jYXNlIDMxOnJldHVybiAyN1xuYnJlYWs7XG5jYXNlIDMyOnJldHVybiAyMlxuYnJlYWs7XG5jYXNlIDMzOnJldHVybiAyMlxuYnJlYWs7XG5jYXNlIDM0OnJldHVybiAxNVxuYnJlYWs7XG5jYXNlIDM1OnJldHVybiAnPydcbmJyZWFrO1xuY2FzZSAzNjpyZXR1cm4gJzonXG5icmVhaztcbmNhc2UgMzc6cmV0dXJuIDE3XG5icmVhaztcbmNhc2UgMzg6cmV0dXJuIDE4XG5icmVhaztcbmNhc2UgMzk6cmV0dXJuIDMxXG5icmVhaztcbmNhc2UgNDA6cmV0dXJuIDI1XG5icmVhaztcbmNhc2UgNDE6cmV0dXJuICdbJ1xuYnJlYWs7XG5jYXNlIDQyOnJldHVybiAnXSdcbmJyZWFrO1xuY2FzZSA0MzpyZXR1cm4gNVxuYnJlYWs7XG59XG59LFxucnVsZXM6IFsvXig/OlxccyspLywvXig/OlxcJFteXFwkXSpcXCQpLywvXig/OlxcXFxsZWZ0XFwoKS8sL14oPzpcXFxccmlnaHRcXCkpLywvXig/OlxcXFxmcmFjXFx7KS8sL14oPzpcXFxcc3FydFxceykvLC9eKD86XFxcXGNkb1t0XSkvLC9eKD86XFxcXGxbZV0pLywvXig/OlxcXFxnW2VdKS8sL14oPzpcXFxcbltlXSkvLC9eKD86XFxcXFthLXpBLVpdKykvLC9eKD86W2EtekEtWl0pLywvXig/OlswLTldK1xcLlswLTldKikvLC9eKD86WzAtOV0rKS8sL14oPzo9KS8sL14oPzpcXCopLywvXig/OlxcLikvLC9eKD86XFwvKS8sL14oPzotKS8sL14oPzpcXCspLywvXig/Ojw9KS8sL14oPzo+PSkvLC9eKD86PCkvLC9eKD86PikvLC9eKD86IT0pLywvXig/OiYmKS8sL14oPzpfW15cXChcXHtdKS8sL14oPzpcXF5bMC05XSkvLC9eKD86XFxeW15cXChcXHswLTldKS8sL14oPzpfXFx7KS8sL14oPzpcXF5cXHspLywvXig/OiEpLywvXig/OiUpLywvXig/OlxcXFwlKS8sL14oPzosKS8sL14oPzpcXD8pLywvXig/OjopLywvXig/OlxcKCkvLC9eKD86XFwpKS8sL14oPzpcXHspLywvXig/OlxcfSkvLC9eKD86XFxbKS8sL14oPzpcXF0pLywvXig/OiQpL10sXG5jb25kaXRpb25zOiB7XCJJTklUSUFMXCI6e1wicnVsZXNcIjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNSwzNiwzNywzOCwzOSw0MCw0MSw0Miw0M10sXCJpbmNsdXNpdmVcIjp0cnVlfX1cbn07XG5yZXR1cm4gbGV4ZXI7XG59KSgpO1xucGFyc2VyLmxleGVyID0gbGV4ZXI7XG5mdW5jdGlvbiBQYXJzZXIgKCkge1xuICB0aGlzLnl5ID0ge307XG59XG5QYXJzZXIucHJvdG90eXBlID0gcGFyc2VyO3BhcnNlci5QYXJzZXIgPSBQYXJzZXI7XG5yZXR1cm4gbmV3IFBhcnNlcjtcbn0pKCk7XG5cblxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbmV4cG9ydHMucGFyc2VyID0gcGFyc2VyO1xuZXhwb3J0cy5QYXJzZXIgPSBwYXJzZXIuUGFyc2VyO1xuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcnNlci5wYXJzZS5hcHBseShwYXJzZXIsIGFyZ3VtZW50cyk7IH07XG5leHBvcnRzLm1haW4gPSBmdW5jdGlvbiBjb21tb25qc01haW4oYXJncykge1xuICAgIGlmICghYXJnc1sxXSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVXNhZ2U6ICcrYXJnc1swXSsnIEZJTEUnKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgICB2YXIgc291cmNlID0gcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMocmVxdWlyZSgncGF0aCcpLm5vcm1hbGl6ZShhcmdzWzFdKSwgXCJ1dGY4XCIpO1xuICAgIHJldHVybiBleHBvcnRzLnBhcnNlci5wYXJzZShzb3VyY2UpO1xufTtcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiByZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBleHBvcnRzLm1haW4ocHJvY2Vzcy5hcmd2LnNsaWNlKDEpKTtcbn1cbn1cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXt2YXIgTGFuZ3VhZ2UgPSByZXF1aXJlKCcuLycpO1xuXG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKSxcbiAgICBHbG9iYWwgICAgID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbnZhciBjcm9zc1Byb2R1Y3QgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDIxNSk7IC8vICZ0aW1lczsgY2hhcmFjdGVyXG5cbi8vIEJ1aWx0IGJ5IEppc29uOlxudmFyIHBhcnNlciA9IHJlcXVpcmUoJy4uLy4uL2dyYW1tYXIvcGFyc2VyLmpzJyk7XG5cbnBhcnNlci5wYXJzZUVycm9yID0gZnVuY3Rpb24gKHN0ciwgaGFzaCkge1xuICAgIC8vIHtcbiAgICAvLyAgICAgdGV4dDogdGhpcy5sZXhlci5tYXRjaCxcbiAgICAvLyAgICAgdG9rZW46IHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCxcbiAgICAvLyAgICAgbGluZTogdGhpcy5sZXhlci55eWxpbmVubyxcbiAgICAvLyAgICAgbG9jOiB5eWxvYyxcbiAgICAvLyAgICAgZXhwZWN0ZWQ6XG4gICAgLy8gICAgIGV4cGVjdGVkXG4gICAgLy8gfVxuICAgIHZhciBlciA9IG5ldyBTeW50YXhFcnJvcihzdHIpO1xuICAgIGVyLmxpbmUgPSBoYXNoLmxpbmU7XG4gICAgdGhyb3cgZXI7XG59O1xuXG5cbnZhciBsZWZ0ID0gLTEsIHJpZ2h0ID0gKzE7XG52YXIgTCA9IGxlZnQ7XG52YXIgUiA9IHJpZ2h0O1xuXG5cblxudmFyIGxhbmd1YWdlID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgTGFuZ3VhZ2UocGFyc2VyLCB7XG4gICAgICAgIE51bWJlcjogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgaWYgKHN0ciA9PT0gJzEnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0ciA9PT0gJzAnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIoTnVtYmVyKHN0cikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9eW1xcZF0qXFwuW1xcZF0rJC8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlY2ltYWxQbGFjZSA9IHN0ci5pbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgLy8gMTIuMzQ1IC0+IDEyMzQ1IC8gMTAwMFxuICAgICAgICAgICAgICAgIC8vIDAwLjUgLT4gNS8xMFxuICAgICAgICAgICAgICAgIHZhciBkZW5vbV9wID0gc3RyLmxlbmd0aCAtIGRlY2ltYWxQbGFjZSAtIDE7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBNYXRoLnBvdygxMCwgZGVub21fcCk7XG4gICAgICAgICAgICAgICAgdmFyIG4gPSBOdW1iZXIoc3RyLnJlcGxhY2UoJy4nLCAnJykpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5SYXRpb25hbChuLCBkKS5yZWR1Y2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE51bWJlcihzdHIpKTtcbiAgICAgICAgfSxcbiAgICAgICAgU3RyaW5nOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9LFxuICAgICAgICBTaW5nbGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIC8vIFNpbmdsZSBsYXRleCBjaGFycyBmb3IgeF4zLCB4XnkgZXRjIChOT1QgeF57YWJjfSlcbiAgICAgICAgICAgIGlmICghaXNOYU4oc3RyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKE51bWJlcihzdHIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKHN0cik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFtcbiAgICBbJzsnXSwgICAgICAgICAgLypMIC8gUiBtYWtlcyBubyBkaWZmZXJlbmNlPz8/IT8/IT8gKi9cbiAgICBbJywnXSxcbiAgICBbWyc9JywgJys9JywgJy09JywgJyo9JywgJy89JywgJyU9JywgJyY9JywgJ149JywgJ3w9J10sUl0sXG4gICAgW1snPycsJzonXSxSLDJdLFxuICAgIFtbJ+KIqCddXSxcbiAgICBbWycmJiddXSxcbiAgICBbWyd8J11dLFxuICAgIFtbJz8/Pz8/PyddXSwvL1hPUlxuICAgIFtbJyYnXV0sXG4gICAgW1snPT0nLCAn4omgJywgJyE9PScsICc9PT0nXV0sXG4gICAgW1snPCcsICc8PScsICc+JywgJz49J10sTF0sXG4gICAgW1snPj4nLCAnPDwnXV0sXG4gICAgWyfCsScsIFIsIDJdLFxuICAgIFtbJysnXSwgdHJ1ZV0sXG4gICAgW1snLSddLCBMXSxcbiAgICBbWyfiiKsnLCAn4oiRJ10sIFIsIDFdLFxuICAgIFtbJyUnXV0sXG4gICAgW1snKiddXSxcbiAgICBbY3Jvc3NQcm9kdWN0LCBSXSxcbiAgICBbWydAKycsICdALScsICdAwrEnXSwgUiwgMV0sIC8vdW5hcnkgcGx1cy9taW51c1xuICAgIFtbJ8KsJ10sIEwsIDFdLFxuICAgIFsnZGVmYXVsdCcsIDAsIDJdLCAvL0kgY2hhbmdlZCB0aGlzIHRvIFIgZm9yIDVzaW4odClcbiAgICBbJ+KImCcsIDAsIDJdLFxuICAgIFtbJy8nXV0sXG4gICAgW1snXiddXSwvL2UqKnhcbiAgICBbJyEnLCBMLCAxXSxcbiAgICBbWyd+J10sIFIsIDFdLCAvL2JpdHdpc2UgbmVnYXRpb25cbiAgICBbWycrKycsICcrKycsICcuJywgJy0+J10sTCwxXSxcbiAgICBbWyc6OiddXSxcbiAgICBbWydfJ10sIEwsIDJdLFxuICAgIFsndmFyJywgUiwgMV0sXG4gICAgWydicmVhaycsIFIsIDBdLFxuICAgIFsndGhyb3cnLCBSLCAxXSxcbiAgICBbJ1xcJycsIEwsIDFdLFxuICAgIFsnXFx1MjIxQScsIFIsIDFdLCAvLyBTcXJ0XG4gICAgWycjJywgUiwgMV0gLyphbm9ueW1vdXMgZnVuY3Rpb24qL1xuXSk7XG5cbi8qXG4gTGFuZ3VhZ2Ugc3BlYyBjb2x1bW5zIGluIG9yZGVyIG9mIF9pbmNyZWFzaW5nIHByZWNlZGVuY2VfOlxuICogb3BlcmF0b3Igc3RyaW5nIHJlcHJlc2VudGF0aW9uKHMpLiBUaGVzZSBhcmUgZGlmZmVyZW50IG9wZXJhdG9ycywgYnV0IHNoYXJlIGFsbCBwcm9wZXJ0aWVzLlxuICogQXNzb2NpYXRpdml0eVxuICogT3BlcmFuZCBjb3VudCAoTXVzdCBiZSBhIGZpeGVkIG51bWJlcikgXG4gKiAoVE9ETz8/KSBjb21tdXRlIGdyb3VwPyAtIG9yIHNob3VsZCB0aGlzIGJlIGRlcml2ZWQ/XG4gKiAoVE9ETz8pIGFzc29jaWF0aXZlPyBjb21tdXRhdGl2ZT8gIC0gU2hvdWxkIGJlIGNhbGN1bGF0ZWQ/XG4gKiAoVE9ETz8pIElkZW50aXR5P1xuKi9cblxuLy8gdmFyIG1hdGhlbWF0aWNhID0gbmV3IExhbmd1YWdlKFtcbi8vICAgICBbJzsnXSxcbi8vICAgICBbJywnXSxcbi8vICAgICBbWyc9JywgJys9J11dXG4vLyBdKTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsICAgID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIEdsb2JhbCAgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xuXG51dGlsLmluaGVyaXRzKENvbnRleHQsIHtwcm90b3R5cGU6IEdsb2JhbH0pO1xuXG5mdW5jdGlvbiBDb250ZXh0KCkge1xuXG59XG5cbkNvbnRleHQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3BsaWNlKDApO1xufTtcblxufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5mdW5jdGlvbiBMYW5ndWFnZShwYXJzZXIsIENvbnN0cnVjdCwgbGFuZ3VhZ2UpIHtcbiAgICB0aGlzLmNmZyA9IHBhcnNlcjtcbiAgICB0aGlzLkNvbnN0cnVjdCA9IENvbnN0cnVjdDtcbiAgICB2YXIgb3BlcmF0b3JzID0gdGhpcy5vcGVyYXRvcnMgPSB7fSxcbiAgICAgICAgb3BQcmVjZWRlbmNlID0gMDtcbiAgICBmdW5jdGlvbiBvcCh2LCBhc3NvY2lhdGl2aXR5LCBhcml0eSkge1xuXG4gICAgfVxuICAgIGxhbmd1YWdlLmZvckVhY2goZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgZnVuY3Rpb24gZGVmb3Aoc3RyLCBvKSB7XG4gICAgICAgICAgICB2YXIgYXNzb2NpYXRpdml0eSA9IG9bMV0gfHwgMDtcbiAgICAgICAgICAgIHZhciBhcml0eSA9IChvWzJdID09PSB1bmRlZmluZWQpID8gMiA6IG9bMl07XG5cbiAgICAgICAgICAgIG9wZXJhdG9yc1tzdHJdID0gIHtcbiAgICAgICAgICAgICAgICBhc3NvY2lhdGl2aXR5OiBhc3NvY2lhdGl2aXR5LFxuICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IG9wUHJlY2VkZW5jZSsrLFxuICAgICAgICAgICAgICAgIGFyaXR5OiBhcml0eVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyID0gb1swXTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBkZWZvcChzdHIsIG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgICAgICAgICBkZWZvcChzLCBvKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkxhbmd1YWdlLkNvZGUgPSByZXF1aXJlKCcuL0NvZGUnKTtcblxudmFyIF8gICAgICAgID0gTGFuZ3VhZ2UucHJvdG90eXBlO1xuXG5fLnBhcnNlICAgICAgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG5fLnN0cmluZ2lmeSAgPSByZXF1aXJlKCcuL3N0cmluZ2lmeScpO1xuXG5fLnBvc3RmaXggPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgdmFyIG9wZXJhdG9yID0gdGhpcy5vcGVyYXRvcnNbc3RyXTtcbiAgICByZXR1cm4gIG9wZXJhdG9yLmFzc29jaWF0aXZpdHkgPT09IDAgJiYgXG4gICAgICAgICAgICBvcGVyYXRvci5hcml0eSA9PT0gMTtcbn07XG5cbl8udW5hcnkgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgdmFyIHVuYXJ5X3NlY29uZGFyeXMgPSBbJysnLCAnLScsICfCsSddO1xuICAgIHJldHVybiAodW5hcnlfc2Vjb25kYXJ5cy5pbmRleE9mKG8pICE9PSAtMSkgPyAoJ0AnICsgbykgOiBmYWxzZTtcbn07XG5cbl8uYXNzb2NpYXRpdmUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0b3JzW3N0cl0uYXNzb2NpYXRpdml0eSA9PT0gMDtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IExhbmd1YWdlO1xuIiwiKGZ1bmN0aW9uKCl7dmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMuYXR0YWNoID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuXG5cbiAgICBmdW5jdGlvbiBEZXJpdmF0aXZlKHdydCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC5kaWZmZXJlbnRpYXRlKHdydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgICAgICBcblxuICAgIGdsb2JhbFsnSW5maW5pdHknXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoSW5maW5pdHksIDApO1xuICAgIGdsb2JhbFsnSW5maW5pdHknXS50aXRsZSA9ICdJbmZpbml0eSc7XG4gICAgZ2xvYmFsWydJbmZpbml0eSddLmRlc2NyaXB0aW9uID0gJyc7XG4gICAgZ2xvYmFsWydpbmZ0eSddID0gZ2xvYmFsLkluZmluaXR5O1xuXG5cbiAgICBnbG9iYWxbJ1plcm8nXSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoMCk7XG4gICAgZ2xvYmFsWydaZXJvJ10udGl0bGUgPSAnWmVybyc7XG4gICAgZ2xvYmFsWydaZXJvJ10uZGVzY3JpcHRpb24gPSAnQWRkaXRpdmUgSWRlbnRpdHknO1xuICAgIGdsb2JhbFsnWmVybyddWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLlplcm87XG4gICAgfTtcbiAgICBnbG9iYWxbJ1plcm8nXVsnKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfTtcbiAgICBnbG9iYWxbJ1plcm8nXVsnQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBnbG9iYWxbJ1plcm8nXVsnLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHhbJ0AtJ10oKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydPbmUnXSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoMSk7XG4gICAgZ2xvYmFsWydPbmUnXS50aXRsZSA9ICdPbmUnO1xuICAgIGdsb2JhbFsnT25lJ10uZGVzY3JpcHRpb24gPSAnTXVsdGlwbGljYXRpdmUgSWRlbnRpdHknO1xuICAgIGdsb2JhbFsnT25lJ11bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnYW1tbG4oeHgpIHtcbiAgICAgICAgdmFyIGo7XG4gICAgICAgIHZhciB4LCB0bXAsIHksIHNlcjtcbiAgICAgICAgdmFyIGNvZiA9IFtcbiAgICAgICAgICAgICA1Ny4xNTYyMzU2NjU4NjI5MjM1LFxuICAgICAgICAgICAgLTU5LjU5Nzk2MDM1NTQ3NTQ5MTIsXG4gICAgICAgICAgICAgMTQuMTM2MDk3OTc0NzQxNzQ3MSxcbiAgICAgICAgICAgIC0wLjQ5MTkxMzgxNjA5NzYyMDE5OSxcbiAgICAgICAgICAgICAwLjMzOTk0NjQ5OTg0ODExODg4N2UtNCxcbiAgICAgICAgICAgICAwLjQ2NTIzNjI4OTI3MDQ4NTc1NmUtNCxcbiAgICAgICAgICAgIC0wLjk4Mzc0NDc1MzA0ODc5NTY0NmUtNCxcbiAgICAgICAgICAgICAwLjE1ODA4ODcwMzIyNDkxMjQ5NGUtMyxcbiAgICAgICAgICAgIC0wLjIxMDI2NDQ0MTcyNDEwNDg4M2UtMyxcbiAgICAgICAgICAgICAwLjIxNzQzOTYxODExNTIxMjY0M2UtMyxcbiAgICAgICAgICAgIC0wLjE2NDMxODEwNjUzNjc2Mzg5MGUtMyxcbiAgICAgICAgICAgICAwLjg0NDE4MjIzOTgzODUyNzQzM2UtNCxcbiAgICAgICAgICAgIC0wLjI2MTkwODM4NDAxNTgxNDA4N2UtNCxcbiAgICAgICAgICAgICAwLjM2ODk5MTgyNjU5NTMxNjIzNGUtNVxuICAgICAgICBdO1xuICAgICAgICBpZiAoeHggPD0gMCl7XG4gICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ2JhZCBhcmcgaW4gZ2FtbWxuJykpO1xuICAgICAgICB9XG4gICAgICAgIHkgPSB4ID0geHg7XG4gICAgICAgIHRtcCA9IHggKyA1LjI0MjE4NzUwMDAwMDAwMDAwO1xuICAgICAgICB0bXAgPSAoeCArIDAuNSkgKiBNYXRoLmxvZyh0bXApIC0gdG1wO1xuICAgICAgICBzZXIgPSAwLjk5OTk5OTk5OTk5OTk5NzA5MjtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDE0OyBqKyspe1xuICAgICAgICAgICAgc2VyICs9IGNvZltqXSAvICsreTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG1wICsgTWF0aC5sb2coMi41MDY2MjgyNzQ2MzEwMDA1ICogc2VyIC8geCk7XG4gICAgfVxuXG5cbiAgICB2YXIgQ2FydFNpbmUgPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsXG4gICAgICAgICAgICAgICAgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsXG4gICAgICAgICAgICAgICAgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE0uRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW2dsb2JhbC5zaW4uZGVmYXVsdCh4KSwgZ2xvYmFsLlplcm9dKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cobmV3IEVycm9yKCdDb21wbGV4IFNpbmUgQ2FydGVzaWFuIGZvcm0gbm90IGltcGxlbWVudGVkIHlldC4nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsb2JhbFsnc2luJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnNpbih4LnZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5zaW4sIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zaW4sIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luKGErYmkpID0gc2luKGEpY29zaChiKSArIGkgY29zKGEpc2luaChiKVxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwX2IgPSBNYXRoLmV4cCh4Ll9pbWFnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvc2hfYiA9IChleHBfYiArIDEgLyBleHBfYikgLyAyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2luaF9iID0gKGV4cF9iIC0gMSAvIGV4cF9iKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4TnVtZXJpY2FsKE1hdGguc2luKHguX3JlYWwpICogY29zaF9iLCBNYXRoLmNvcyh4Ll9yZWFsKSAqIHNpbmhfYik7XG4gICAgICAgICAgICAqL1xuICAgICAgICB9LFxuICAgICAgICByZWFsaW1hZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIENhcnRTaW5lO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcc2luJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLnNpbicsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ3NpbicsXG4gICAgICAgIHRpdGxlOiAnU2luZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVHJpZ29ub21ldHJpY19mdW5jdGlvbnMjU2luZS4yQ19jb3NpbmUuMkNfYW5kX3RhbmdlbnQnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcc2luIChcXFxccGkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnY29zJywgJ3RhbiddXG4gICAgfSk7XG4gICAgZ2xvYmFsWydjb3MnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguY29zKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmNvcywgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmNvcywgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIGRlcml2YXRpdmU6IGdsb2JhbC5zaW5bJ0AtJ10oKSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGNvcycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5jb3MnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdjb3MnLFxuICAgICAgICB0aXRsZTogJ0Nvc2luZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29zaW5lIEZ1bmN0aW9uIGRlc2MnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcY29zIChcXFxccGkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnc2luJywgJ3RhbiddXG4gICAgfSk7XG5cbiAgICBnbG9iYWwuc2luLmRlcml2YXRpdmUgPSBnbG9iYWwuY29zO1xuXG4gICAgZ2xvYmFsWydzZWMnXSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoKTtcbiAgICAgICAgdmFyIHkgPSBnbG9iYWxbJ09uZSddWycvJ10oZ2xvYmFsWydjb3MnXS5kZWZhdWx0KHMpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljKHksIFtzXSk7XG4gICAgfSgpKTtcblxuICAgIGdsb2JhbFsndGFuJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnRhbih4LnZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC50YW4sIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC50YW4sIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBkZXJpdmF0aXZlOiBnbG9iYWwuc2VjWydeJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSksXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFx0YW4nLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGgudGFuJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAndGFuJyxcbiAgICAgICAgdGl0bGU6ICdUYW5nZW50IEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUYW5nZW50IEZ1bmN0aW9uIGRlc2MnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcdGFuKFxcXFxwaS8zKScsICdcXFxcdGFuIChcXFxccGkvMiknXSxcbiAgICAgICAgcmVsYXRlZDogWydzaW4nLCAnY29zJ11cbiAgICB9KTtcblxuICAgIGdsb2JhbFsnY3NjJ10gPSBnbG9iYWxbJ2Nvc2VjJ10gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcyA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCk7XG4gICAgICAgIHZhciB5ID0gZ2xvYmFsWydPbmUnXVsnLyddKGdsb2JhbFsnc2luJ10uZGVmYXVsdChzKSk7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbi5TeW1ib2xpYyh5LCBbc10pO1xuICAgIH0oKSk7XG5cbiAgICBnbG9iYWxbJ2xvZyddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCwgYXNzdW1wdGlvbnMpIHtcblxuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB4LmEgPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLlplcm87XG4gICAgICAgICAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB4LmEgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkluZmluaXR5WydALSddKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZih2ID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgubG9nKHYpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGFzc3VtcHRpb25zICYmIGFzc3VtcHRpb25zLnBvc2l0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwubG9nLCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5sb2csIHhdKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVhbGltYWc6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gQ2FydExvZztcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGxvZycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5sb2cnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdsb2cnLFxuICAgICAgICB0aXRsZTogJ05hdHVyYWwgTG9nYXJpdGhtJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdCYXNlIGUuIFNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL05hdHVyYWxfbG9nYXJpdGhtJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGxvZyAoeWVeKDJ4KSknXSxcbiAgICAgICAgcmVsYXRlZDogWydleHAnLCAnTG9nJ11cbiAgICB9KTtcbiAgICB2YXIgSGFsZiA9IG5ldyBFeHByZXNzaW9uLlJhdGlvbmFsKDEsIDIpO1xuICAgIHZhciBDYXJ0TG9nID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICAgICAgZ2xvYmFsLmxvZy5kZWZhdWx0KHguYWJzKCkpLFxuICAgICAgICAgICAgICAgIHguYXJnKClcbiAgICAgICAgICAgIF0pWycqJ10oSGFsZik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBDYXJ0TG9nLl9fcHJvdG9fXyA9IGdsb2JhbC5sb2c7XG4gICAgZ2xvYmFsWydhdGFuMiddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICBpZighICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgKCdhdGFuIG9ubHkgdGFrZXMgdmVjdG9yIGFyZ3VtZW50cycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeFswXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIGlmKHhbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5hdGFuMih4WzBdLnZhbHVlLCB4WzFdLnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuYXRhbjIsIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmF0YW4yLCB4XSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgLy9UT0RPOiBEQU5HRVIhIEFzc3VtaW5nIHJlYWwgbnVtYmVycywgYnV0IGl0IHNob3VsZCBoYXZlIHNvbWUgZmFzdCB3YXkgdG8gZG8gdGhpcy5cbiAgICAgICAgICAgIHJldHVybiBbRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuYXRhbjIsIHhdKSwgTS5nbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFx0YW5eey0xfScsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hdGFuMicsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2F0YW4nLFxuICAgICAgICB0b1R5cGVkU3RyaW5nOiBmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzOiB0aGlzW2xhbmd1YWdlXSxcbiAgICAgICAgICAgICAgICB0OmphdmFzY3JpcHQuRnVuY3Rpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGl0bGU6ICdUd28gYXJndW1lbnQgYXJjdGFuZ2VudCBmdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJjdGFuKHksIHgpLiBXaWxsIGVxdWFsIGFyY3Rhbih5IC8geCkgZXhjZXB0IHdoZW4geCBhbmQgeSBhcmUgYm90aCBuZWdhdGl2ZS4gU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQXRhbjInXG4gICAgfSk7XG5cbiAgICBnbG9iYWxbJ2ZhY3RvcmlhbCddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5HYW1tYS5kZWZhdWx0KHhbJysnXShnbG9iYWwuT25lKSk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxmYWN0b3JpYWwnXG4gICAgfSk7XG5cbiAgICBnbG9iYWxbJ2F0YW4nXSA9IGdsb2JhbC5hdGFuMjtcblxuICAgIGdsb2JhbFsnR2FtbWEnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC5hO1xuICAgICAgICAgICAgICAgIGlmKHYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuQ29tcGxleEluZmluaXR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZih2IDwgMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSAxO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvcihpID0gMTsgaSA8IHY7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcCAqPSBpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5HYW1tYSwgeF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuSW5maW5pdHk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKHYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKC1NYXRoLlBJIC8gKHYgKiBNYXRoLnNpbihNYXRoLlBJICogdikgKiBNYXRoLmV4cChnYW1tbG4oLXYpKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmV4cChnYW1tbG4odikpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuR2FtbWEsIHhdKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXEdhbW1hJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6IGdhbW1sbixcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgfSxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiAnR2FtbWEgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0dhbW1hX2Z1bmN0aW9uJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXEdhbW1hICh4KScsICd4ISddLFxuICAgICAgICByZWxhdGVkOiBbJ0xvZycsICdMb2dHYW1tYSddXG4gICAgfSk7XG5cbiAgICBnbG9iYWxbJ1JlJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4LnJlYWwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICByZXR1cm4gW3gucmVhbCgpLCBnbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxSZSdcbiAgICB9KTtcblxuICAgIGdsb2JhbFsnSW0nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgcmV0dXJuIHguaW1hZygpO1xuICAgICAgICB9LFxuICAgICAgICBkaXN0cmlidXRlZF91bmRlcl9kaWZmZXJlbnRpYXRpb246IHRydWUsXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgcmV0dXJuIFt4LmltYWcoKSwgZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcSW0nXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBGaW5pdGVTZXQoZWxlbWVudHMpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50cyA9IGVsZW1lbnRzIHx8IFtdO1xuICAgIH1cbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLmludGVyc2VjdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh4LmVsZW1lbnRzLmluZGV4T2YodGhpcy5lbGVtZW50c1tpXSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2godGhpcy5lbGVtZW50c1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBGaW5pdGVTZXQocmVzKTtcbiAgICB9O1xuICAgIEZpbml0ZVNldC5wcm90b3R5cGUuZW51bWVyYXRlID0gZnVuY3Rpb24gKG4sIGZuKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50c1tpXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgICB0aGlzLm1hcChmbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpbml0ZVNldC5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDAsIGwgPSB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50c1tpXSA9IG5ldyBmbih0aGlzLmVsZW1lbnRzW2ldLCBpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEZpbml0ZVNldC5wcm90b3R5cGUuc3Vic2V0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgZm9yKHZhciBpID0gMCwgbCA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoeC5lbGVtZW50cy5pbmRleE9mKHRoaXMuZWxlbWVudHNbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLnBzdWJzZXQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuZWxlbWVudHMubGVuZ3RoIDwgeC5lbGVtZW50cy5sZW5ndGgpICYmIHRoaXMuc3Vic2V0KHgpO1xuICAgIH07XG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5zdXBzZXQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geC5zdWJzZXQodGhpcyk7XG4gICAgfTtcblxuICAgIEZpbml0ZVNldC5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnRzLmxlbmd0aCAhPT0geC5lbGVtZW50cy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBmb3IodmFyIGkgPSAwLCBsID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRzW2ldICE9PSB4LmVsZW1lbnRzW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB1dGlsLmluaGVyaXRzKE1vZHVsb0dyb3VwLCBGaW5pdGVTZXQpO1xuICAgIGZ1bmN0aW9uIE1vZHVsb0dyb3VwKG4sIG9wZXJhdG9yKSB7XG4gICAgICAgIEZpbml0ZVNldC5jYWxsKHRoaXMpO1xuXG4gICAgICAgIG9wZXJhdG9yID0gb3BlcmF0b3IgfHwgJ2RlZmF1bHQnO1xuXG4gICAgICAgIGZ1bmN0aW9uIEVsZW1lbnQoXywgbikge1xuICAgICAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgfVxuXG4gICAgICAgIEVsZW1lbnQucHJvdG90eXBlW29wZXJhdG9yXVxuICAgICAgICA9IEVsZW1lbnQucHJvdG90eXBlLmRlZmF1bHRcbiAgICAgICAgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50KCh0aGlzLm4gKyB4Lm4pICUgbik7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVudW1lcmF0ZShuLCBFbGVtZW50KTtcblxuICAgICAgICB0aGlzLnByb3RvdHlwZSA9IEVsZW1lbnQucHJvdG90eXBlO1xuXG4gICAgfTtcblxuICAgIHV0aWwuaW5oZXJpdHMoTXVsdGlWYWx1ZSwgRmluaXRlU2V0KTtcblxuICAgIGZ1bmN0aW9uIE11bHRpVmFsdWUoZWxlbWVudHMpIHtcbiAgICAgICAgRmluaXRlU2V0LmNhbGwodGhpcywgZWxlbWVudHMpO1xuICAgIH1cblxuXG4gICAgTXVsdGlWYWx1ZS5wcm90b3R5cGUuZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHRoaXMub3BlcmF0b3IoJ2RlZmF1bHQnLCB4KTtcbiAgICB9O1xuXG4gICAgTXVsdGlWYWx1ZS5wcm90b3R5cGVbJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHRoaXMub3BlcmF0b3IoJysnLCB4KTtcbiAgICB9O1xuXG4gICAgTXVsdGlWYWx1ZS5wcm90b3R5cGVbJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHRoaXMub3BlcmF0b3IoJyonLCB4KTtcbiAgICB9O1xuXG4gICAgTXVsdGlWYWx1ZS5wcm90b3R5cGUub3BlcmF0b3IgPSBmdW5jdGlvbiAob3BlcmF0b3IsIHgpIHtcblxuICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIE11bHRpVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHguZWxlbWVudHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSB0aGlzLmVsZW1lbnRzW2ldW29wZXJhdG9yXShqKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2gobik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IE11bHRpVmFsdWUocmVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhW29wZXJhdG9yXSh4KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gcXVhZHJhbnQoeCkge1xuICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHgudmFsdWUgPiAwID8gJysnIDogJy0nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuICcrLSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICAgICAgaWYgKHgub3BlcmF0b3IgPT09ICdeJykge1xuICAgICAgICAgICAgICAgIHZhciBxMCA9IHF1YWRyYW50KHhbMF0pO1xuICAgICAgICAgICAgICAgIHZhciBuID0geFsxXS52YWx1ZTtcblxuICAgICAgICAgICAgICAgIGlmIChxMCA9PT0gJysnKSByZXR1cm4gJysnO1xuICAgICAgICAgICAgICAgIGlmIChxMCA9PT0gJy0nIHx8IHEwID09PSAnKy0nKSByZXR1cm4gbiAlIDIgPT09IDAgPyAnKycgOiAnLSc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJystJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBxID0gW10ubWFwLmNhbGwoeCwgcXVhZHJhbnQpO1xuXG4gICAgICAgICAgICBpZiAocVswXSA9PT0gJystJyB8fCBxWzFdID09PSAnKy0nKSByZXR1cm4gJystJztcblxuICAgICAgICAgICAgc3dpdGNoICh4Lm9wZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChxWzFdID09PSAnLScpIHFbMV0gPSAnKyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChxWzFdID09PSAnKycpIHFbMV0gPSAnLSc7XG5cbiAgICAgICAgICAgICAgICBjYXNlICcrJzogcmV0dXJuIHFbMF0gPT09IHFbMV0gPyBxWzBdIDogJystJztcblxuXG4gICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnKic6IHJldHVybiBxWzBdID09PSBxWzFdID8gJysnIDogJy0nO1xuXG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUG9zaXRpdmUoeCkge1xuICAgICAgICB2YXIgcyA9IHF1YWRyYW50KHgpO1xuICAgICAgICByZXR1cm4gcyA9PT0gJysnO1xuICAgIH1cblxuICAgIGdsb2JhbFsnc3FydCddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuXG4gICAgICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC52YWx1ZTtcbiAgICAgICAgICAgICAgICB2YXIgc3FydE1hZ1ggPSBNYXRoLnNxcnQodilcbiAgICAgICAgICAgICAgICBpZih2IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbC5aZXJvLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHNxcnRNYWdYKVxuICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoc3FydE1hZ1gpO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgICAgICAgICAgICAgeFswXSxcbiAgICAgICAgICAgICAgICAgICAgeFsxXVsnLyddKG5ldyBFeHByZXNzaW9uLkludGVnZXIoMikpXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9zID0gaXNQb3NpdGl2ZSh4KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgaWYgKHBvcyA9PT0gJysnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG5cbiAgICAgICAgICAgIHRocm93KCdTUVJUOiA/Pz8nKTtcbiAgICAgICAgICAgIHN3aXRjaCAoeC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5Db21wbGV4OlxuICAgICAgICAgICAgICAgICAgICAvL2h0dHA6Ly93d3cubWF0aHByb3ByZXNzLmNvbS9zdGFuL2JpYmxpb2dyYXBoeS9jb21wbGV4U3F1YXJlUm9vdC5wZGZcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNnbl9iO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeC5faW1hZyA9PT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChNYXRoLnNxcnQoeC5fcmVhbCksIDApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoeC5faW1hZz4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZ25fYiA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNnbl9iID0gLTEuMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc19hMl9iMiA9IE1hdGguc3FydCh4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBvbmVfb25fcnQyICogTWF0aC5zcXJ0KHNfYTJfYjIgKyB4Ll9yZWFsKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBzZ25fYiAqIG9uZV9vbl9ydDIgKiBNYXRoLnNxcnQoc19hMl9iMiAtIHguX3JlYWwpO1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uUmVhbE51bWVyaWNhbChNYXRoLnNxcnQoeCkpO1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LlJlYWw6XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnXicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuYWJzLmFwcGx5KHVuZGVmaW5lZCwgeFswXS5hcHBseSgnXicsIHhbMV0uYXBwbHkoJy8nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDIsMCkpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIC8vVE9ETzogREFOR0VSISBBc3N1bWluZyByZWFsIG51bWJlcnMsIGJ1dCBpdCBzaG91bGQgaGF2ZSBzb21lIGZhc3Qgd2F5IHRvIGRvIHRoaXMuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vVXNlcyBleHAsIGF0YW4yIGFuZCBsb2cgZnVuY3Rpb25zLiBBIHJlYWxseSBiYWQgaWRlYS4gKHNxdWFyZSByb290aW5nLCB0aGVuIHNxdWFyaW5nLCB0aGVuIGF0YW4sIGFsc28gW2V4cChsb2cpXSlcbiAgICAgICAgICAgIHJldHVybiB4WydeJ10obmV3IEV4cHJlc3Npb24uUmF0aW9uYWwoMSwgMikpLnJlYWxpbWFnKCk7XG4gICAgICAgICAgICAvL3ZhciByaSA9IHgucmVhbGltYWcoKTtcbiAgICAgICAgICAgIC8vcmV0dXJuIFtFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSksIE0uZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcc3FydCcsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5zcXJ0JyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnc3FydCcsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ1NxcnQgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NxdWFyZV9Sb290JyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXHNxcnQgKHheNCknXSxcbiAgICAgICAgcmVsYXRlZDogWydwb3cnLCAnYWJzJywgJ21vZCddXG4gICAgfSk7XG4gICAgZ2xvYmFsWydhYnMnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIC8vVXNpbmcgYWJzIGlzIGJldHRlciAoSSB0aGluaykgYmVjYXVzZSBpdCBmaW5kcyB0aGUgbWV0aG9kIHRocm91Z2ggdGhlIHByb3RvdHlwZSBjaGFpbixcbiAgICAgICAgICAgIC8vd2hpY2ggaXMgZ29pbmcgdG8gYmUgZmFzdGVyIHRoYW4gZG9pbmcgYW4gaWYgbGlzdCAvIHN3aXRjaCBjYXNlIGxpc3QuXG4gICAgICAgICAgICByZXR1cm4geC5hYnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGFicycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hYnMnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdhYnMnLFxuICAgICAgICB0aXRpZTogJ0Fic29sdXRlIFZhbHVlIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBYnMnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcYWJzICgtMyknLCAnXFxcXGFicyAoaSszKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2FyZycsICd0YW4nXVxuICAgIH0pO1xuXG4gICAgLy8gSXQgaXMgc2VsZi1yZWZlcmVudGlhbFxuICAgIGdsb2JhbC5hYnMuZGVyaXZhdGl2ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcyA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCk7XG4gICAgICAgICAgICB2YXIgeSA9IHNbJy8nXShzLmFicygpKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbi5TeW1ib2xpYyh5LCBbc10pO1xuICAgIH0oKSk7XG4gICAgZ2xvYmFsWydhcmcnXSA9IHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQVJHIElTIEZPUiBVU0VSIElOUFVUIE9OTFkuIFVTRSAuYXJnKCknKTtcbiAgICAgICAgICAgIC8vVXNpbmcgYWJzIGlzIGJldHRlciAoSSB0aGluaykgYmVjYXVzZSBpdCBmaW5kcyB0aGUgbWV0aG9kIHRocm91Z2ggdGhlIHByb3RvdHlwZSBjaGFpbixcbiAgICAgICAgICAgIC8vd2hpY2ggaXMgZ29pbmcgdG8gYmUgZmFzdGVyIHRoYW4gZG9pbmcgYW4gaWYgbGlzdCAvIHN3aXRjaCBjYXNlIGxpc3QuIFRPRE86IENoZWNrIHRoZSB0cnV0aGZ1bGxuZXMgb2YgdGhpcyFcbiAgICAgICAgICAgIHJldHVybiB4LmFyZygpO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcYXJnJywgLy90ZW1wXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hcmdfcmVhbCcsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRpZTogJ0FyZyBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJnJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGFyZyAoLTMpJywgJ1xcXFxhcmcgKDMpJywgJ1xcXFxhcmcoMysyaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydhYnMnXVxuICAgIH1cblxuXG5cbiAgICBnbG9iYWxbJ2UnXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5FLCAwKTtcbiAgICBnbG9iYWxbJ2UnXS50aXRsZSA9ICdlJztcbiAgICBnbG9iYWxbJ2UnXS5kZXNjcmlwdGlvbiA9ICdUaGUgdHJhbnNjZW5kZW50YWwgbnVtYmVyIHRoYXQgaXMgdGhlIGJhc2Ugb2YgdGhlIG5hdHVyYWwgbG9nYXJpdGhtLCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRvIDIuNzE4MjguJztcbiAgICBnbG9iYWwuZS5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnTWF0aC5FJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYobGFuZyA9PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnZScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSgnMi43MTgyODE4Mjg0NTkwNDUnKTtcbiAgICB9O1xuXG5cbiAgICBnbG9iYWxbJ3BpJ10gPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguUEksIDApO1xuICAgIGdsb2JhbFsncGknXS50aXRsZSA9ICdQaSc7XG4gICAgZ2xvYmFsWydwaSddLmRlc2NyaXB0aW9uID0gJyc7XG4gICAgZ2xvYmFsLnBpLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgICAgICBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdNYXRoLlBJJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ1xcXFxwaScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSgnMy4xNDE1OTI2NTM1ODk3OTMnKTtcbiAgICB9O1xuICAgIC8vIFRoZSByZWFsIGNpcmNsZSBjb25zdGFudDpcbiAgICBnbG9iYWwudGF1ID0gZ2xvYmFsWydwaSddWycqJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSk7XG5cblxuICAgIGdsb2JhbC5sb2cuZGVyaXZhdGl2ZSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljKGdsb2JhbC5PbmVbJy8nXShuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCgpKSk7XG5cbiAgICBnbG9iYWxbJ2knXSA9IG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbZ2xvYmFsWydaZXJvJ10sIGdsb2JhbFsnT25lJ11dKTtcbiAgICBnbG9iYWxbJ2knXS50aXRsZSA9ICdJbWFnaW5hcnkgVW5pdCc7XG4gICAgZ2xvYmFsWydpJ10uZGVzY3JpcHRpb24gPSAnQSBudW1iZXIgd2hpY2ggc2F0aXNmaWVzIHRoZSBwcm9wZXJ0eSA8bT5pXjIgPSAtMTwvbT4uJztcbiAgICBnbG9iYWxbJ2knXS5yZWFsaW1hZyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICBnbG9iYWwuWmVybyxcbiAgICAgICAgICAgIGdsb2JhbC5PbmVcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBnbG9iYWxbJ2knXVsnKltUT0RPXSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgXG4gICAgfTtcblxuICAgIGdsb2JhbFsnZCddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCh4KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsLmRbJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkluZmluaXRlc2ltYWwpIHtcbiAgICAgICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIERlcml2YXRpdmUgb3BlcmF0b3JcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERlcml2YXRpdmUoeC54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uVmVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh4LngsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGVyaXZhdGl2ZSh4KTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZ1c2luZyBpbmZpdGVzaW1hbCBvcGVyYXRvciBkaXZpc2lvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3coJ0RpdmlkaW5nIGQgYnkgc29tZSBsYXJnZSBudW1iZXIuJyk7XG4gICAgICAgIFxuICAgIH07XG4gICAgZ2xvYmFsWyd1bmRlZmluZWQnXSA9IHtcbiAgICAgICAgczogZnVuY3Rpb24gKGxhbmcpe1xuICAgICAgICAgICAgaWYgKGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCd1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCcoMS4wLzAuMCknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZGlmZmVyZW50aWF0ZTogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJyonOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnKyc6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICctJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICcvJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICdeJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICdALSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBnbG9iYWxbJ3N1bSddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgdGhyb3coJ1N1bSBub3QgcHJvcGVybHkgY29uc3RydWN0ZWQgeWV0LicpO1xuICAgICAgICAgICAgcmV0dXJuIDM7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBnbG9iYWxbJ3N1bSddWydfJ10gPSBmdW5jdGlvbiAoZXEpIHtcbiAgICAgICAgLy8gc3RhcnQ6IFxuICAgICAgICB2YXIgdCA9IGVxWzBdO1xuICAgICAgICB2YXIgdiA9IGVxWzFdO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uU3VtLlJlYWwodCwgdik7XG4gICAgfVxuICAgIFxufTtcbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbmZ1bmN0aW9uIEV4cHJlc3Npb24oKSB7XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRXhwcmVzc2lvbjtcblxuRXhwcmVzc2lvbi5MaXN0ICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9MaXN0Jyk7XG5FeHByZXNzaW9uLkxpc3QuUmVhbCAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0xpc3QvUmVhbCcpO1xuRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4gID0gcmVxdWlyZSgnLi9MaXN0L0NvbXBsZXhDYXJ0ZXNpYW4nKTtcbkV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIgICAgICA9IHJlcXVpcmUoJy4vTGlzdC9Db21wbGV4UG9sYXInKTtcbkV4cHJlc3Npb24uQ29uc3RhbnQgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vQ29uc3RhbnQnKTtcbkV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCAgICAgICA9IHJlcXVpcmUoJy4vTnVtZXJpY2FsQ29tcGxleCcpO1xuRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsICAgICAgICAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxSZWFsJyk7XG5FeHByZXNzaW9uLlJhdGlvbmFsICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1JhdGlvbmFsJyk7XG5FeHByZXNzaW9uLkludGVnZXIgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0ludGVnZXInKTtcbkV4cHJlc3Npb24uU3ltYm9sICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3ltYm9sJyk7XG5FeHByZXNzaW9uLlN5bWJvbC5SZWFsICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N5bWJvbC9SZWFsJyk7XG5FeHByZXNzaW9uLlN0YXRlbWVudCAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N0YXRlbWVudCcpO1xuRXhwcmVzc2lvbi5WZWN0b3IgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9WZWN0b3InKTtcbkV4cHJlc3Npb24uTWF0cml4ICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTWF0cml4Jyk7XG5FeHByZXNzaW9uLkZ1bmN0aW9uICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0Z1bmN0aW9uJyk7XG5FeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljICAgICAgPSByZXF1aXJlKCcuL0Z1bmN0aW9uL1N5bWJvbGljJyk7XG5FeHByZXNzaW9uLkluZmluaXRlc2ltYWwgICAgICAgICAgPSByZXF1aXJlKCcuL0luZmluaXRlc2ltYWwnKTtcblxudmFyIF8gPSBFeHByZXNzaW9uLnByb3RvdHlwZTtcblxuXy50b1N0cmluZyA9IG51bGw7XG5fLnZhbHVlT2YgPSBudWxsO1xuXG5fLmltYWdlVVJMID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnaHR0cDovL2xhdGV4LmNvZGVjb2dzLmNvbS9naWYubGF0ZXg/JyArXG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnMoJ3RleHQvbGF0ZXgnKS5zKTtcbn07XG5cbl8ucmVuZGVyTGFUZVggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uuc3JjID0gdGhpcy5pbWFnZVVSTCgpO1xuICAgIHJldHVybiBpbWFnZTtcbn07XG5cbi8vIHN1YnN0dXRpb24gZGVmYXVsdDpcbl8uc3ViID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gbGltaXQgZGVmYXVsdFxuXy5saW0gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiB0aGlzLnN1Yih4LCB5KTtcbn07XG5cbl9bJywnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3RhdGVtZW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db25kaXRpb25hbCh4LCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG59O1xuXG5cblsnPScsICchPScsICc+JywgJz49JywgJzwnLCAnPD0nXS5mb3JFYWNoKGZ1bmN0aW9uIChvcGVyYXRvcikge1xuICAgIF9bb3BlcmF0b3JdID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlN0YXRlbWVudCh0aGlzLCB4LCBvcGVyYXRvcik7XG4gICAgfTtcbn0pO1xuXG5cblxuLy8gY3Jvc3NQcm9kdWN0IGlzIHRoZSAnJnRpbWVzOycgY2hhcmFjdGVyXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpO1xuXG5fW2Nyb3NzUHJvZHVjdF0gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG5cbi8vIFRoZSBkZWZhdWx0IG9wZXJhdG9yIG9jY3VycyB3aGVuIHR3byBleHByZXNzaW9ucyBhcmUgYWRqYWNlbnQgdG8gZWFjaG90aGVyOiBTIC0+IGUgZS5cbi8vIERlcGVuZGluZyBvbiB0aGUgdHlwZSwgaXQgdXN1YWxseSByZXByZXNlbnRzIGFzc29jaWF0aXZlIG11bHRpcGxpY2F0aW9uLlxuLy8gU2VlIGJlbG93IGZvciB0aGUgZGVmYXVsdCAnKicgb3BlcmF0b3IgaW1wbGVtZW50YXRpb24uXG5fLmRlZmF1bHQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG5bJy8nLCAnKycsICctJywgJ0AtJywgJ14nLCAnJSddLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XG4gICAgX1tvcGVyYXRvcl0gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbiAgICB9O1xufSk7XG5cblxuXG5cbi8vIFRoaXMgbWF5IGxvb2sgbGlrZSB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB4IGlzIGEgbnVtYmVyLFxuLy8gYnV0IHJlYWxseSB0aGUgaW1wb3J0YW50IGFzc3VtcHRpb24gaXMgc2ltcGx5XG4vLyB0aGF0IGl0IGlzIGZpbml0ZS5cbi8vIFRodXMgaW5maW5pdGllcyBhbmQgaW5kZXRlcm1pbmF0ZXMgc2hvdWxkIEFMV0FZU1xuLy8gb3ZlcnJpZGUgdGhpcyBvcGVyYXRvclxuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcqJyk7XG59O1xuXG5cblxuXG5cblxuXG5cblxuXG5cbn0pKCkiLCIvLyBub3RoaW5nIHRvIHNlZSBoZXJlLi4uIG5vIGZpbGUgbWV0aG9kcyBmb3IgdGhlIGJyb3dzZXJcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtmdW5jdGlvbiBmaWx0ZXIgKHhzLCBmbikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmbih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGg7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFJlZ2V4IHRvIHNwbGl0IGEgZmlsZW5hbWUgaW50byBbKiwgZGlyLCBiYXNlbmFtZSwgZXh0XVxuLy8gcG9zaXggdmVyc2lvblxudmFyIHNwbGl0UGF0aFJlID0gL14oLitcXC8oPyEkKXxcXC8pPygoPzouKz8pPyhcXC5bXi5dKik/KSQvO1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbnZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbmZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgdmFyIHBhdGggPSAoaSA+PSAwKVxuICAgICAgPyBhcmd1bWVudHNbaV1cbiAgICAgIDogcHJvY2Vzcy5jd2QoKTtcblxuICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJyB8fCAhcGF0aCkge1xuICAgIGNvbnRpbnVlO1xuICB9XG5cbiAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG59XG5cbi8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbi8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4vLyBOb3JtYWxpemUgdGhlIHBhdGhcbnJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbnZhciBpc0Fic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJyxcbiAgICB0cmFpbGluZ1NsYXNoID0gcGF0aC5zbGljZSgtMSkgPT09ICcvJztcblxuLy8gTm9ybWFsaXplIHRoZSBwYXRoXG5wYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG4gIFxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICByZXR1cm4gcCAmJiB0eXBlb2YgcCA9PT0gJ3N0cmluZyc7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGRpciA9IHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbMV0gfHwgJyc7XG4gIHZhciBpc1dpbmRvd3MgPSBmYWxzZTtcbiAgaWYgKCFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lXG4gICAgcmV0dXJuICcuJztcbiAgfSBlbHNlIGlmIChkaXIubGVuZ3RoID09PSAxIHx8XG4gICAgICAoaXNXaW5kb3dzICYmIGRpci5sZW5ndGggPD0gMyAmJiBkaXIuY2hhckF0KDEpID09PSAnOicpKSB7XG4gICAgLy8gSXQgaXMganVzdCBhIHNsYXNoIG9yIGEgZHJpdmUgbGV0dGVyIHdpdGggYSBzbGFzaFxuICAgIHJldHVybiBkaXI7XG4gIH0gZWxzZSB7XG4gICAgLy8gSXQgaXMgYSBmdWxsIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgcmV0dXJuIGRpci5zdWJzdHJpbmcoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzJdIHx8ICcnO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbM10gfHwgJyc7XG59O1xuXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiKGZ1bmN0aW9uKCl7Ly8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgRnVuY3Rpb24gKHdoaWNoIGl0IGNhbGxzIGV2YWwpXG4vKmpzaGludCAtVzA2MSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvZGU7XG5cbmZ1bmN0aW9uIENvZGUocywgcHJlKXtcbiAgICB0aGlzLnByZSA9IFtdIHx8IHByZTtcbiAgICB0aGlzLnMgPSAnJyB8fCBzO1xuICAgIHRoaXMudmFycyA9IDA7XG4gICAgdGhpcy5wID0gSW5maW5pdHk7XG59XG5cbnZhciBfID0gQ29kZS5wcm90b3R5cGU7XG5cbi8qXG4gICAgVGhpcyB1c2VzIGEgZ2xvYmFsIHN0YXRlLlxuXG4gICAgUGVyaGFwcyB0aGVyZSBpcyBhIG5pY2VyIHdheSwgYnV0IHRoaXMgd2lsbCB3b3JrLlxuKi9cbkNvZGUubmV3Q29udGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBDb2RlLmNvbnRleHRWYXJpYWJsZUNvdW50ID0gMDtcbn07XG5cbkNvZGUubmV3Q29udGV4dCgpO1xuXG4vLyBGb3IgZmFzdGVyIGV2YWx1YXRpb24gbXVsdGlwbGUgc3RhdG1lbnRzLiBGb3IgZXhhbXBsZSAoeCszKV4yIHdpbGwgZmlyc3QgY2FsY3VsYXRlIHgrMywgYW5kIHNvIG9uLlxuXy52YXJpYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ3QnICsgKENvZGUuY29udGV4dFZhcmlhYmxlQ291bnQrKykudG9TdHJpbmcoMzYpO1xufTtcblxuXy5tZXJnZSA9IGZ1bmN0aW9uIChvLCBzdHIsIHAsIHByZSkge1xuICAgIHRoaXMucyA9IHN0cjtcbiAgICBpZiAocHJlKSB7XG4gICAgICAgIHRoaXMucHJlLnB1c2gocHJlKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdGhpcy5wcmUucHVzaC5hcHBseSh0aGlzLnByZSwgby5wcmUpO1xuICAgIHRoaXMudmFycyArPSBvLnZhcnM7XG4gICAgdGhpcy5wID0gcDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbl8udXBkYXRlID0gZnVuY3Rpb24gKHN0ciwgcCwgcHJlKSB7XG4gICAgdGhpcy5wID0gcDtcbiAgICBpZihwcmUpIHtcbiAgICAgICAgdGhpcy5wcmUucHVzaChwcmUpO1xuICAgIH1cbiAgICB0aGlzLnMgPSBzdHI7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBKYXZhc2NyaXB0IGNvbXBsaWF0aW9uXG5fLmNvbXBpbGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBGdW5jdGlvbih4LCB0aGlzLnByZS5qb2luKCdcXG4nKSArICdyZXR1cm4gJyArIHRoaXMucyk7XG59O1xuXG5fLmdsc2xGdW5jdGlvbiA9IGZ1bmN0aW9uICh0eXBlLCBuYW1lLCBwYXJhbWV0ZXJzKSB7XG4gICAgcmV0dXJuIHR5cGUgKyAnICcgKyBuYW1lICsgJygnICsgcGFyYW1ldGVycyArICcpe1xcbicgKyB0aGlzLnByZS5qb2luKCdcXG4nKSArICdyZXR1cm4gJyArIHRoaXMucyArICc7XFxufVxcbic7XG59O1xuXG5cbn0pKCkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ2lmeShleHByLCBsYW5nKSB7XG4gICAgcmV0dXJuIGV4cHIucyhsYW5nKTtcbn07XG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi8nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb25zdGFudDtcblxudXRpbC5pbmhlcml0cyhDb25zdGFudCwgc3VwKTtcblxuZnVuY3Rpb24gQ29uc3RhbnQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHByZXNzaW9uLkNvbnN0YW50IGNyZWF0ZWQgZGlyZWN0bHknKTtcbn1cblxudmFyIF8gPSBDb25zdGFudC5wcm90b3R5cGU7XG5cbl8uc2ltcGxpZnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBHbG9iYWwuWmVybztcbn07XG5cbl8uYXBwbHkgPSBmdW5jdGlvbiAoeCl7XG4gICAgcmV0dXJuIHRoaXNbJyonXSh4KTtcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxSZWFsJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmF0aW9uYWw7XG5cbnV0aWwuaW5oZXJpdHMoUmF0aW9uYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIFJhdGlvbmFsKGEsIGIpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMuYiA9IGI7XG59XG5cbnZhciBfID0gUmF0aW9uYWwucHJvdG90eXBlO1xuXG5cbl8uX19kZWZpbmVHZXR0ZXJfXyhcInZhbHVlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hIC8gdGhpcy5iO1xufSk7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICAvKlxuICAgICAgICAgICAgYSAgIGMgICAgIGFkICAgY2IgICAgYWQgKyBiY1xuICAgICAgICAgICAgLSArIC0gID0gIC0tICsgLS0gPSAgLS0tLS0tLVxuICAgICAgICAgICAgYiAgIGQgICAgIGJkICAgYmQgICAgICBiIGRcbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIgKyB0aGlzLmIgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy52YWx1ZSArIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU3dhcHBlZCBvcGVyYXRvciBvcmRlciBmb3IgKyB3aXRoIFJhdGlvbmFsJyk7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICAgICAgLy8gdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIFJhdGlvbmFsICsnKTtcbiAgICB9XG4gICAgXG4gICAgXG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICAvKlxuICAgICAgICAgICAgYSAgIGMgICAgIGFkICAgY2IgICAgYWQgKyBiY1xuICAgICAgICAgICAgLSArIC0gID0gIC0tICsgLS0gPSAgLS0tLS0tLVxuICAgICAgICAgICAgYiAgIGQgICAgIGJkICAgYmQgICAgICBiIGRcbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIgLSB0aGlzLmIgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy52YWx1ZSAtIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1N3YXBwZWQgb3BlcmF0b3Igb3JkZXIgZm9yIC0gd2l0aCBSYXRpb25hbCcpO1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgICAgIC8vIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBSYXRpb25hbCArJyk7XG4gICAgfVxufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5hLCB0aGlzLmIgKiB4LmIpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnKiddLmNhbGwodGhpcywgeCk7XG59O1xuXG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICBpZiAoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnRGl2aXNpb24gQnkgWmVybyBpcyBub3QgZGVmaW5lZCBmb3IgUmF0aW9uYWwgbnVtYmVycyEnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYiwgdGhpcy5iICogeC5hKS5yZWR1Y2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJy8nXS5jYWxsKHRoaXMsIHgpO1xufTtcblxuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4ID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCA9PT0gR2xvYmFsLk9uZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYodGhpcy5hID09PSB0aGlzLmIpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbChcbiAgICAgICAgICAgIE1hdGgucG93KHRoaXMuYSwgeC5hKSxcbiAgICAgICAgICAgIE1hdGgucG93KHRoaXMuYiwgeC5hKVxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIFJhdGlvbmFsKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgucG93KE1hdGgucG93KHRoaXMuYSwgZi5hKSwgMSAvIGYuYikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIHhcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgXG59O1xuXG5fLnJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBtdXRhYmxlLlxuICAgIGZ1bmN0aW9uIGdjZChhLCBiKSB7XG4gICAgICAgIGlmKGIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnY2QoYiwgYSAlIGIpO1xuICAgIH1cbiAgICB2YXIgZyA9IGdjZCh0aGlzLmIsIHRoaXMuYSk7XG4gICAgdGhpcy5hIC89IGc7XG4gICAgdGhpcy5iIC89IGc7XG4gICAgaWYodGhpcy5iID09PSAxKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHRoaXMuYSk7XG4gICAgfVxuICAgIGlmKHRoaXMuYiA8IDApIHtcbiAgICAgICAgdGhpcy5hID0gLXRoaXMuYTtcbiAgICAgICAgdGhpcy5iID0gLXRoaXMuYjtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vQ29uc3RhbnQnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1lcmljYWxDb21wbGV4O1xuXG51dGlsLmluaGVyaXRzKE51bWVyaWNhbENvbXBsZXgsIHN1cCk7XG5cbmZ1bmN0aW9uIE51bWVyaWNhbENvbXBsZXgocmVhbCwgaW1hZykge1xuICAgIHRoaXMuX3JlYWwgPSByZWFsO1xuICAgIHRoaXMuX2ltYWcgPSBpbWFnO1xufVxuXG52YXIgXyA9IE51bWVyaWNhbENvbXBsZXgucHJvdG90eXBlO1xuXG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9yZWFsKTtcbn07XG5cbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX2ltYWcpO1xufTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5fcmVhbCksXG4gICAgICAgIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5faW1hZylcbiAgICBdKTtcbn07XG5cbl8uY29uanVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCwgLXRoaXMuX2ltYWcpO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpe1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC5fcmVhbCwgdGhpcy5faW1hZyArIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC52YWx1ZSwgdGhpcy5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4ICsnKTtcbiAgICB9XG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KXtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHguX3JlYWwsIHRoaXMuX2ltYWcgLSB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC52YWx1ZSwgdGhpcy5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCAtJyk7XG4gICAgfVxufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9pbWFnID09PSAwKSB7XG4gICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLl9yZWFsID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKXtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHguX3JlYWwgLSB0aGlzLl9pbWFnICogeC5faW1hZywgdGhpcy5fcmVhbCAqIHguX2ltYWcgKyB0aGlzLl9pbWFnICogeC5fcmVhbCk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHgudmFsdWUsIHRoaXMuX2ltYWcgKiB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggKicpO1xuICAgIH1cbn07XG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5faW1hZyA9PT0gMCAmJiB0aGlzLl9yZWFsID09PSAwKSB7XG4gICAgICAgIC8vIFRPRE86IFByb3ZpZGVkIHggIT0gMFxuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIFxuICAgIGlmKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3Ipe1xuICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCgodGhpcy5fcmVhbCAqIHguX3JlYWwgKyB0aGlzLl9pbWFnICogeC5faW1hZykvY2NfZGQsICh0aGlzLl9pbWFnICogeC5fcmVhbCAtIHRoaXMuX3JlYWwgKiB4Ll9pbWFnKSAvIGNjX2RkKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC8geC52YWx1ZSwgdGhpcy5faW1hZyAvIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWycvJ10oeCk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiB0aGlzLnBvbGFyKClbJy8nXSh4KTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCAvJyk7XG4gICAgfVxufTtcblxuX1snISddID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh0aGlzKTtcbn07XG5cbi8vIChmdW5jdGlvbigpe1xuLy8gICAgIHJldHVybjtcbi8vICAgICB2YXIgb25lX29uX3J0MiA9IDEvTWF0aC5zcXJ0KDIpO1xuLy8gICAgIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihvcGVyYXRvciwgeCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKXtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vIENvbnRyYWRpY3RzIHheMCA9IDFcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4geC5hcHBseSgnQC0nKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDEgJiYgdGhpcy5faW1hZyA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICAvL05vdGU6IFRoZXJlIGlzIG5vdCBtZWFudCB0byBiZSBhIGJyZWFrIGhlcmUuXG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vQ29udHJhZGljcyB4LzAgPSBJbmZpbml0eVxuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuLy8gICAgICAgICBpZiAob3BlcmF0b3IgPT09ICcsJykge1xuLy8gICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoeCA9PT0gdW5kZWZpbmVkKSB7XG4vLyAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnQCsnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICAgICAgICAgICAgICBjYXNlICdALSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KC10aGlzLl9yZWFsLCAtdGhpcy5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnXFx1MjIxQSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KCdPTEQgU1FSVC4gTmV3IG9uZSBpcyBhIGZ1bmN0aW9uLCBub3Qgb3BlcmF0b3IuJylcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgocCwgcSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKysnOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0tJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcignUG9zdGZpeCAnICtvcGVyYXRvciArICcgb3BlcmF0b3IgYXBwbGllZCB0byB2YWx1ZSB0aGF0IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKz0nOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy09Jzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICcqPSc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLz0nOlxuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgUmVmZXJlbmNlRXJyb3IoJ0xlZnQgc2lkZSBvZiBhc3NpZ25tZW50IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodW5kZWZpbmVkLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyAxLCB0aGlzLl9pbWFnKSk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4vLyAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4LnZhbHVlLCB0aGlzLl9pbWFnICogeC52YWx1ZSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC8geC52YWx1ZSwgdGhpcy5faW1hZyAvIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMuX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5faW1hZztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB4LnZhbHVlO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEgKyBiKmIpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKGIsIGEpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IHRoZXRhICogYztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMpO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4vLyAgICAgICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4vLyAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIChhK2JpKShjK2RpKSA9IChhYy1iZCkgKyAoYWQrYmMpaSBcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHguX3JlYWwgLSB0aGlzLl9pbWFnICogeC5faW1hZywgdGhpcy5fcmVhbCAqIHguX2ltYWcgKyB0aGlzLl9pbWFnICogeC5fcmVhbCk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4Ll9yZWFsLCB0aGlzLl9pbWFnICsgeC5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4Ll9yZWFsLCB0aGlzLl9pbWFnIC0geC5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vICAoYStiaSkvKGMrZGkpIFxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gWyhhK2JpKShjLWRpKV0vWyhjK2RpKShjLWRpKV1cbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFsoYStiaSkoYy1kaSldL1tjYyArIGRkXVxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gW2FjIC1kYWkgK2JjaSArIGJkXS9bY2MrZGRdXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbYWMgKyBiZCArIChiYyAtIGRhKV0vW2NjK2RkXVxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCgodGhpcy5fcmVhbCAqIHguX3JlYWwgKyB0aGlzLl9pbWFnICogeC5faW1hZykvY2NfZGQsICh0aGlzLl9pbWFnICogeC5fcmVhbCAtIHRoaXMuX3JlYWwqeC5faW1hZykvY2NfZGQpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMuX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5faW1hZztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB4Ll9yZWFsO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgZCA9IHguX2ltYWc7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSArIGIqYik7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIoYiwgYSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gaGxtICogZCArIHRoZXRhICogYztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMgLSB0aGV0YSAqIGQpO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4vLyAgICAgICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvbGFyKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgY29uc29sZS5lcnJvcignY21wbHggLiAnICsgb3BlcmF0b3IgKyAnID0+IEUuTGlzdD8nKTtcbi8vICAgICAgICAgLypcbi8vICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMC4wICYmIHRoaXMuX2ltYWcgPT09IDAuMCl7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICAgICAgfVxuLy8gICAgICAgICAqL1xuICAgICAgICBcbiAgICAgICAgXG4vLyAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgIH1cbiAgICBcbi8vIH0oKSk7XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxDb21wbGV4Jyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4vJyk7XG5tb2R1bGUuZXhwb3J0cyA9IE51bWVyaWNhbFJlYWw7XG5cbnV0aWwuaW5oZXJpdHMoTnVtZXJpY2FsUmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gTnVtZXJpY2FsUmVhbChlKSB7XG4gICAgdGhpcy52YWx1ZSA9IGU7XG59XG5cbnZhciBfID0gTnVtZXJpY2FsUmVhbC5wcm90b3R5cGU7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShfLCBcIl9yZWFsXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxufSk7XG5fLl9pbWFnID0gMDtcblxuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzLFxuICAgICAgICBHbG9iYWwuWmVyb1xuICAgIF0pO1xufTtcbl8uY29uanVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKyB4LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCgtdGhpcy52YWx1ZSk7XG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC0geC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB4WydALSddKClbJysnXSh0aGlzKTtcbn07XG5cblxuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgbm9ucmVhbCA9ICdUaGUgbW9kdWxhciBhcml0aG1ldGljIG9wZXJhdG9yIFxcJyVcXCcgaXMgbm90IGRlZmluZWQgZm9yIG5vbi1yZWFsIG51bWJlcnMuJztcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAlIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICB0aHJvdygnTm90IHN1cmUgYWJvdXQgdGhpcy4uLicpO1xuICAgICAgICAvLyBOb3Qgc3VyZSBhYm91dCB0aGlzXG4gICAgICAgIC8vIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcihub25yZWFsKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKG5vbnJlYWwpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgICAgXG4gICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3Iobm9ucmVhbCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxSZWFsICUnKTtcbiAgICB9XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICogeC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICBpZih4LnZhbHVlID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnRGl2aXNpb24gYnkgemVybyBub3QgYWxsb3dlZCEnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAvIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KCh0aGlzLnZhbHVlICogeC5fcmVhbCkvY2NfZGQsICgtdGhpcy52YWx1ZSAqIHguX2ltYWcpIC8gY2NfZGQpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gYS8oeCt5aSkgPSBhLyh4K3lpKSAoeC15aSkvKHgteWkpID0gYSh4LXlpKSAvICh4XjIgKyB5XjIpXG4gICAgICAgIHZhciB4X2NvbmogPSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB4WzBdLFxuICAgICAgICAgICAgeFsxXVsnQC0nXSgpXG4gICAgICAgIF0pO1xuICAgICAgICB2YXIgdHdvID0gTnVtZXJpY2FsUmVhbCgyKTtcbiAgICAgICAgcmV0dXJuIHhfY29ualsnKiddKHRoaXMpWycvJ10oXG4gICAgICAgICAgICAoeFswXVsnXiddKSh0d28pXG4gICAgICAgICAgICBbJysnXSAoXG4gICAgICAgICAgICAgICAgKHhbMV1bJ14nXSkodHdvKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIC8vIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuICAgICAgICBcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIC8vIFRPRE86IGdpdmVuIHggIT0gMFxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAvLyBUT0RPOiBnaXZlbiB4ICE9IDBcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdCkgeyAgIFxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnVW5rbm93biB0eXBlOiAnLCB0aGlzLCB4KTtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbFJlYWwgLycpO1xuICAgIH1cbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsdWUgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoTWF0aC5wb3codGhpcy52YWx1ZSwgeC5hKSk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbChNYXRoLnBvdyh0aGlzLnZhbHVlLCB4LnZhbHVlKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogVGhpcyB3aWxsIHByb2R1Y2UgdWdseSBkZWNpbWFscy4gTWF5YmUgd2Ugc2hvdWxkIGV4cHJlc3MgaXQgaW4gcG9sYXIgZm9ybT8hXG4gICAgICAgIC8vICAgICAgPC0gSSB0aGluayBubywgYmVjYXVzZSB3aHkgZWxzZSBzdGFydCB3aXRoIGEgbnVtZXJpY2FsLiBJbXBsZW1lbnQgYSByYXRpb25hbC9pbnRlZ2VyIHR5cGVcbiAgICAgICAgdmFyIHIgPSBNYXRoLnBvdygtdGhpcy52YWx1ZSwgeC52YWx1ZSk7XG4gICAgICAgIHZhciB0aGV0YSA9IE1hdGguUEkgKiB4LnZhbHVlO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgICAgICAgICAgbmV3IE51bWVyaWNhbFJlYWwociksXG4gICAgICAgICAgICBuZXcgTnVtZXJpY2FsUmVhbCh0aGV0YSlcbiAgICAgICAgXSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLnZhbHVlO1xuICAgICAgICB2YXIgYyA9IHguX3JlYWw7XG4gICAgICAgIHZhciBkID0geC5faW1hZztcbiAgICAgICAgY29uc29sZS5lcnJvcignQmFkIGltcGxlbWVudGF0aW9uICggbnVtIF4gY29tcGxleCknKTtcbiAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSk7XG4gICAgICAgIHZhciBobWxkX3RjID0gaGxtICogZDtcbiAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMpO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChcbiAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4gICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgY29uc29sZS5lcnJvciAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsUmVhbCBeJywgeCwgeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpO1xuICAgIH1cbn07XG5fWyc+J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA+IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPiddLmNhbGwodGhpcywgeCk7XG59O1xuX1snPCddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPCB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJzwnXS5jYWxsKHRoaXMsIHgpO1xufTtcbl9bJzw9J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA8PSB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJzw9J10uY2FsbCh0aGlzLCB4KTtcbn07XG5fWyc+PSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPj0geC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc+PSddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24gKENvZGUsIGxhbmcpIHtcbiAgICBpZihsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgdmFyIG51bSA9IHRoaXMudmFsdWUudG9FeHBvbmVudGlhbCgpO1xuICAgICAgICBpZihudW0uaW5kZXhPZignLicpID09PSAtMSl7XG4gICAgICAgICAgICBudW0gPSBudW0ucmVwbGFjZSgnZScsJy5lJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKG51bSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLnZhbHVlLnRvU3RyaW5nKCkpO1xufTtcbi8vIF8uYXBwbHlPbGQgPSBmdW5jdGlvbihvcGVyYXRvciwgeCkge1xuLy8gICAgIHN3aXRjaCAob3BlcmF0b3Ipe1xuLy8gICAgICAgICBjYXNlICcsJzpcbi8vICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgeF0pO1xuLy8gICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vIENvbnRyYWRpY3RzIHheMCA9IDFcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4geC5hcHBseSgnQC0nKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAxKXtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIC8vTm90ZTogVGhlcmUgaXMgbm90IG1lYW50IHRvIGJlIGEgYnJlYWsgaGVyZS5cbi8vICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vQ29udHJhZGljcyB4LzAgPSBJbmZpbml0eVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgIH1cbi8vICAgICBpZih4ID09PSB1bmRlZmluZWQpe1xuLy8gICAgICAgICAvL1VuYXJ5XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJ0ArJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICAgICAgICAgIGNhc2UgJ0AtJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoLXRoaXMudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLS0nOlxuLy8gICAgICAgICAgICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3IoJ1Bvc3RmaXggJyArb3BlcmF0b3IgKyAnIG9wZXJhdG9yIGFwcGxpZWQgdG8gdmFsdWUgdGhhdCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKz0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLT0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnKj0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLz0nOlxuLy8gICAgICAgICAgICAgICAgIHRocm93KG5ldyBSZWZlcmVuY2VFcnJvcignTGVmdCBzaWRlIG9mIGFzc2lnbm1lbnQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodW5kZWZpbmVkLCBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICsgMSkpO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3Ipe1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICogeC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSArIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLSB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC8geC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoTWF0aC5wb3codGhpcy52YWx1ZSwgeC52YWx1ZSkpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFRoaXMgd2lsbCBwcm9kdWNlIHVnbHkgZGVjaW1hbHMuIE1heWJlIHdlIHNob3VsZCBleHByZXNzIGl0IGluIHBvbGFyIGZvcm0/IVxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgciA9IE1hdGgucG93KC10aGlzLnZhbHVlLCB4LnZhbHVlKVxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBNYXRoLlBJICogeC52YWx1ZTtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgocipNYXRoLmNvcyh0aGV0YSksIHIqTWF0aC5zaW4odGhldGEpKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uQ29tcGxleCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKiB4Ll9yZWFsLCB0aGlzLnZhbHVlICogeC5faW1hZyk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlICsgeC5fcmVhbCwgeC5faW1hZyk7XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlIC0geC5fcmVhbCwgLXguX2ltYWcpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCgodGhpcy52YWx1ZSAqIHguX3JlYWwpL2NjX2RkLCAoLXRoaXMudmFsdWUqeC5faW1hZykvY2NfZGQpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLnZhbHVlO1xuLy8gICAgICAgICAgICAgICAgIHZhciBjID0geC5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICB2YXIgZCA9IHguX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQmFkIGltcGxlbWVudGF0aW9uICggbnVtIF4gY29tcGxleCknKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbSAqIGQ7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMpO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KFxuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4vLyAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdpbmVmZmVjaWVudDogTlIgXiBDTCcpO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy8oYStiaSkrQWVeKGlrKVxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICAgICAgLy8gb3IgPyByZXR1cm4gdGhpcy5hcHBseShvcGVyYXRvciwgeC5yZWFsaW1hZygpKTsgLy9KdW1wIHVwIHRvIGFib3ZlICstXG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbi8vICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdygnTigwKSBeIHgnKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWwoLXRoaXMudmFsdWUpKS5hcHBseSgnXicsIHgpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFsLnBpLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3coJ04oMCkgXiB4Jyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbKG5ldyBOdW1lcmljYWxSZWFsKC10aGlzLnZhbHVlKSksIHhdLCAnXicpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFsLnBpLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIHRocm93KCc/PyAtIHJlYWwnKTtcbi8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gfTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCA9IHJlcXVpcmUoJy4vUmF0aW9uYWwnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlZ2VyO1xuXG51dGlsLmluaGVyaXRzKEludGVnZXIsIHN1cCk7XG5cbmZ1bmN0aW9uIEludGVnZXIoeCkge1xuICAgIHRoaXMuYSA9IHg7XG59XG5cbnZhciBfID0gSW50ZWdlci5wcm90b3R5cGU7XG5cbl8uYiA9IDE7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgKyB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAtIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyctJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgaWYodGhpcy5hICUgeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hIC8geC5hKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IHN1cCh0aGlzLmEsIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWycvJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBJbnRlZ2VyKC10aGlzLmEpO1xufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAqIHguYSk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIoTWF0aC5wb3codGhpcy5hLCB4LmEpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgucG93KE1hdGgucG93KHRoaXMuYSwgZi5hKSwgMSAvIGYuYikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZih0aGlzLmEgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW1xuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgXSwgJ14nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHhcbiAgICApO1xuICAgIFxufTtcblxuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hICUgeC5hKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICByZXR1cm4gbmV3IHN1cCgpOy8vIEB0b2RvOiAhXG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcyAlIHgudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfVxufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLmEudG9TdHJpbmcoKSArICcuMCcpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy5hLnRvU3RyaW5nKCkpO1xufTtcbn0pKCkiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3Q7XG5cbnV0aWwuaW5oZXJpdHMoTGlzdCwgc3VwKTtcblxuLypcbiAgICBFeHByZXNzaW9uLkxpc3Qgc2hvdWxkIGJlIGF2b2lkZWQgd2hlbmV2ZXIgRXhwcmVzc2lvbi5MaXN0LlJlYWwgY2FuXG4gICAgYmUgdXNlZC4gSG93ZXZlciwga25vd2luZyB3aGVuIHRvIHVzZSBSZWFsIGlzIGFuIGltcG9zc2libGUgKD8pIHRhc2ssXG4gICAgc28gc29tZXRpbWVzIHRoaXMgd2lsbCBoYXZlIHRvIGRvIGFzIGEgZmFsbGJhY2suXG4qL1xuZnVuY3Rpb24gTGlzdChlLCBvcGVyYXRvcikge1xuICAgIGUuX19wcm90b19fID0gRXhwcmVzc2lvbi5MaXN0LnByb3RvdHlwZTtcbiAgICBlLm9wZXJhdG9yID0gb3BlcmF0b3I7XG4gICAgcmV0dXJuIGU7XG59XG5cbkxpc3QucHJvdG90eXBlLl9zID0gZnVuY3Rpb24gKENvZGUsIGxhbmcpIHtcbiAgICBpZiAobGFuZyA9PT0gJ3RleHQvbGF0ZXgnIHx8IGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbC5wcm90b3R5cGUuX3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdVc2UgcmVhbCgpLCBpbWFnKCksIG9yIGFicygpLCBvciBhcmcoKSBmaXJzdC4nKSk7XHJcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyhuZXcgRXJyb3IoJ1VzZSByZWFsKCksIGltYWcoKSwgb3IgYWJzKCksIG9yIGFyZygpIGZpcnN0LicpKTtcbn07XG5cbkxpc3QucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdmFyIGEgPSB0aGlzWzBdLnN1Yih4LCB5KTtcbiAgICB2YXIgYiA9IHRoaXNbMV0gJiYgdGhpc1sxXS5zdWIoeCwgeSk7XG5cbiAgICByZXR1cm4gYVt0aGlzLm9wZXJhdG9yIHx8ICdkZWZhdWx0J10oYik7XG59O1xuXG5MaXN0LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoZikge1xuICAgIHZhciBlbGVtZW50cyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmKTtcbiAgICByZXR1cm4gZWxlbWVudHNbMF1bdGhpcy5vcGVyYXRvciB8fCAnZGVmYXVsdCddLmFwcGx5KHRoaXMsIGVsZW1lbnRzLnNsaWNlKDEpKTtcbn07IiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5mdW5jdGlvbiBUcnV0aFZhbHVlKHYpIHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlbWVudDtcblxudXRpbC5pbmhlcml0cyhUcnV0aFZhbHVlLCBzdXApO1xudXRpbC5pbmhlcml0cyhTdGF0ZW1lbnQsIHN1cCk7XG5cbnZhciBfID0gVHJ1dGhWYWx1ZS5wcm90b3R5cGU7XG5cbnZhciBUcnVlID0gVHJ1dGhWYWx1ZS5UcnVlID0gbmV3IFRydXRoVmFsdWUoKTtcbnZhciBGYWxzZSA9IFRydXRoVmFsdWUuRmFsc2UgPSBuZXcgVHJ1dGhWYWx1ZSgpO1xuXG4vL09ubHkgZGlmZmVyZW5jZTogTk9UIG9wZXJhdG9yXG5GYWxzZVsnfiddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBUcnVlO1xufTtcblxuLy8gbmVnYXRpb24gb3BlcmF0b3Jcbl9bJ34nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gRmFsc2U7XG59O1xuXG4vLyBkaXNqdW5jdGlvblxuXy5WID0gZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gZSA9PT0gVHJ1ZSA/IGUgOiB0aGlzO1xufTtcblxuLy8gY29uanVuY3Rpb25cbl9bJ14nXSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGUgPT09IFRydWUgPyB0aGlzIDogZTtcbn07XG5cblxuZnVuY3Rpb24gU3RhdGVtZW50KHgsIHksIG9wZXJhdG9yKSB7XG4gICAgdGhpcy5hID0geDtcbiAgICB0aGlzLmIgPSB5O1xuXG4gICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xufVxuXG52YXIgXyA9IFN0YXRlbWVudC5wcm90b3R5cGU7XG5fWyc9J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgXG59O1xuX1snPCddID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGEgPCBiIDwgY1xuICAgIC8vIChhIDwgYikgPSBiXG4gICAgLy8gYiA8IGNcbiAgICBcbiAgICAvLyBhIDwgKGIgPCBjKVxuICAgIC8vIGEgPCBiIC4uIChiIDwgYykgPSBiXG4gICAgLy8gKGEgPCBiKSA9IGEuXG59O1xuXy5zb2x2ZSA9IGZ1bmN0aW9uICh2YXJzKSB7XG4gICAgLy8gYSA9IGJcbiAgICAvLyBJZiBiIGhhcyBhbiBhZGRpdGl2ZSBpbnZlcnNlP1xuICAgIFxuICAgIC8vIGEgLSBiID0gMFxuICAgIHZhciBhX2IgPSAodGhpcy5hKVsnLSddKHRoaXMuYik7XG4gICAgLypcbiAgICBFeGFtcGxlczpcbiAgICAoMSwyLDMpIC0gKHgseSx6KSA9IDAgKHNvbHZlIGZvciB4LHkseilcbiAgICAoMSwyLDMpIC0geCA9IDAgKHNvbHZlIGZvciB4KVxuICAgICovXG4gICAgcmV0dXJuIGFfYi5yb290cyh2YXJzKTtcbn07XG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbDtcblxudXRpbC5pbmhlcml0cyhTeW1ib2wsIHN1cCk7XG5cbmZ1bmN0aW9uIFN5bWJvbChzdHIpIHtcbiAgICB0aGlzLnN5bWJvbCA9IHN0cjtcbn1cblxudmFyIF8gPSBTeW1ib2wucHJvdG90eXBlO1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzID09PSB4ID8gR2xvYmFsLk9uZSA6IEdsb2JhbC5aZXJvO1xufTtcbl8uaW50ZWdyYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcyA9PT0geCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgwLjUsIDApIFsnKiddICh4IFsnXiddIChuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDIsMCkpKTtcbiAgICB9XG4gICAgcmV0dXJuICh0aGlzKSBbJyonXSAoeCk7XG59O1xuXy5zdWIgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIC8vIFRPRE86IEVuc3VyZSBpdCBpcyByZWFsIChmb3IgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbClcbiAgICByZXR1cm4gdGhpcyA9PT0geCA/IHkgOiB0aGlzO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCB4KSB7XG4gICAgcmV0dXJuIG5ldyBDb2RlKHRoaXMuc3ltYm9sIHx8ICd4X3tmcmVlfScpO1xufTtcbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocywgYmFzZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAocyA9PT0gJycgfHwgcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcyA9IHMucmVwbGFjZSgvIC9nLCAnJyk7XG4gICAgXG4gICAgdmFyIHJvb3QgPSBPYmplY3QuY3JlYXRlKHt9KTtcbiAgICB2YXIgY29udGV4dCA9IHJvb3Q7XG4gICAgXG4gICAgdmFyIGZyZWUgPSB7fTtcbiAgICB2YXIgYm91bmQgPSB7fTtcbiAgICBcbiAgICBmdW5jdGlvbiBkb3duKHZhcnMpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGNvbnRleHQ7XG4gICAgICAgIGNvbnRleHQgPSBPYmplY3QuY3JlYXRlKGNvbnRleHQpO1xuICAgICAgICBjb250ZXh0LiRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgaW4gdmFycykge1xuICAgICAgICAgICAgaWYgKHZhcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0W2ldID0gdmFyc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiB1cChlbnRpdHkpIHtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQuJHBhcmVudDtcbiAgICAgICAgcmV0dXJuIGVudGl0eTtcbiAgICB9XG4gICAgLypcbiAgICAgICAgRXZhbHVhdGUgQVNUIHRyZWUgKHRvcC1kb3duKVxuICAgICAgICBcbiAgICAgICAgRXhhbXBsZXM6XG4gICAgICAgICAgICAqIHk9eF4yXG4gICAgICAgICAgICAgICAgWyc9JywgeSwgWydeJywgeCwgMl1dXG4gICAgXG4gICAgKi9cbiAgICB2YXIgbG9vc2UgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBldmFsdWF0ZShhc3QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YXIgc3ltYm9sO1xuICAgICAgICAgICAgaWYgKChzeW1ib2wgPSBjb250ZXh0W2FzdF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKHN5bWJvbCA9IGJhc2VbYXN0XSkpIHtcbiAgICAgICAgICAgICAgICBib3VuZFthc3RdID0gc3ltYm9sO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcmVlW2FzdF0gPSBzeW1ib2wgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChhc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm9vdFthc3RdID0gc3ltYm9sO1xuICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcbiAgICAgICAgfSBlbHNlIGlmIChhc3QucHJpbWl0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5Db25zdHJ1Y3RbYXN0LnR5cGVdKGFzdC5wcmltaXRpdmUpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhc3QgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBhc3QxID0gZXZhbHVhdGUoYXN0WzFdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGFzdFswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmcmFjJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzdFswXSA9ICcvJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdfJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGJpbmQgdW5kZXJuZWF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFzdFsxXSA9PT0gJ3N1bScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSBhc3RbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbWl0WzBdID09PSAnPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZHVtbXkgdmFyaWFibGU6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKGxpbWl0WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvd2VyIGxpbWl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gZXZhbHVhdGUobGltaXRbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VtbWluYXRvciA9IG5ldyBFeHByZXNzaW9uLlN1bS5SZWFsKHgsIGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1taW5hdG9yLnZhcnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWluYXRvci52YXJzW3guc3ltYm9sXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdW1taW5hdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXN0WzBdID09PSAnZGVmYXVsdCcgJiYgYXN0MS52YXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvd24oYXN0MS52YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBhc3QxW2FzdFswXV0oZXZhbHVhdGUoYXN0WzJdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVzdWx0LnZhcnM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1cChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXN0MVthc3RbMF1dKGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGFzdFswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzcXJ0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuc3FydC5kZWZhdWx0KGV2YWx1YXRlKGFzdFsxXSkpO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICchJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuZmFjdG9yaWFsLmRlZmF1bHQoZXZhbHVhdGUoYXN0WzFdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBldmFsdWF0ZShhc3RbMV0pW2FzdFswXV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGFzdFsxXSlbYXN0WzBdXShldmFsdWF0ZShhc3RbMV0pLCBldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN0O1xuICAgIH1cbiAgICBcbiAgICBcbiAgICAvLyBQYXJzZSB1c2luZyBjb250ZXh0IGZyZWUgZ3JhbW1hciAoW2dyYXBoXS9ncmFtbWFyL2NhbGN1bGF0b3Iuamlzb24pXG4gICAgdmFyIGFzdCA9IHRoaXMuY2ZnLnBhcnNlKHMpO1xuICAgIHZhciByZXN1bHQgPSBldmFsdWF0ZShhc3QpO1xuICAgIHJlc3VsdC5fYXN0ID0gYXN0O1xuICAgIGlmIChyb290ICE9PSBjb250ZXh0KSB7XG4gICAgICAgIHRocm93KCdDb250ZXh0IHN0aWxsIG9wZW4nKTtcbiAgICB9XG4gICAgXG4gICAgcmVzdWx0LnVuYm91bmQgPSBmcmVlO1xuICAgIHJlc3VsdC5ib3VuZCA9IGJvdW5kO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5cblxufSkoKSIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yO1xuXG5mdW5jdGlvbiBWZWN0b3IoZSkge1xuICAgIGUuX19wcm90b19fID0gVmVjdG9yLnByb3RvdHlwZTtcbiAgICByZXR1cm4gZTtcbn1cblxudXRpbC5pbmhlcml0cyhWZWN0b3IsIHN1cCk7XG5cbnZhciBfID0gVmVjdG9yLnByb3RvdHlwZTtcblxuX1snLC4nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUuY29uY2F0LmNhbGwodGhpcywgW3hdKSk7XG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBjLmRpZmZlcmVudGlhdGUoeCk7XG4gICAgfSkpO1xufTtcbl8uY3Jvc3MgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmxlbmd0aCAhPT0gMyB8fCB4Lmxlbmd0aCAhPT0gMykge1xuICAgICAgICB0aHJvdygnQ3Jvc3MgcHJvZHVjdCBvbmx5IGRlZmluZWQgZm9yIDNEIHZlY3RvcnMuJyk7XG4gICAgfVxuICAgIC8qXG4gICAgaSAgIGogICAga1xuICAgIHggICB5ICAgIHpcbiAgICBhICAgYiAgICBjXG4gICAgXG4gICAgPSAoeWMgLSB6YiwgemEgLSB4YywgeGIgLSB5YSlcbiAgICAqL1xuICAgIFxuICAgIHJldHVybiBuZXcgVmVjdG9yKFtcbiAgICAgICAgdGhpc1sxXS5kZWZhdWx0KHhbMl0pWyctJ10odGhpc1syXS5kZWZhdWx0KHhbMV0pKSxcbiAgICAgICAgdGhpc1syXS5kZWZhdWx0KHhbMF0pWyctJ10odGhpc1swXS5kZWZhdWx0KHhbMl0pKSxcbiAgICAgICAgdGhpc1swXS5kZWZhdWx0KHhbMV0pWyctJ10odGhpc1sxXS5kZWZhdWx0KHhbMF0pKVxuICAgIF0pO1xufTtcblxuLy8gY3Jvc3NQcm9kdWN0IGlzIHRoZSAnJnRpbWVzOycgY2hhcmFjdGVyXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpO1xuXG5fW2Nyb3NzUHJvZHVjdF0gPSBfLmNyb3NzO1xuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIGlmICh4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgICAgIC8vIERvdCBwcm9kdWN0XG4gICAgICAgIGlmKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdygnVmVjdG9yIERpbWVuc2lvbiBtaXNtYXRjaC4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHN1bSA9IEdsb2JhbC5aZXJvO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBzdW0gPSBzdW1bJysnXShcbiAgICAgICAgICAgICAgICAodGhpc1tpXSkuZGVmYXVsdCh4W2ldKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNjYWxhciBtdWx0aXBsaWNhdGlvbjpcbiAgICAgICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpcywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmRlZmF1bHQoeCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG59O1xuX1snKiddID0gXy5kZWZhdWx0O1xuX1snKyddID0gZnVuY3Rpb24gKHgsIG9wKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICBpZihsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyhuZXcgTWF0aEVycm9yKCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdmFyIG4gPSBuZXcgQXJyYXkobCk7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuW2ldID0gdGhpc1tpXVtvcCB8fCAnKyddKHhbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKG4pO1xufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJysnXSh4LCAnLScpO1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICAgICAgdGhyb3coJ1ZlY3RvciBkaXZpc2lvbiBub3QgZGVmaW5lZCcpO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gY1snLyddKHgpO1xuICAgIH0pKTtcbiAgICBcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnUmFpc2VkIHRvIHplcm8gcG93ZXInKTtcbiAgICAgICAgfVxuICAgICAgICBpZih4LmEgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4LmEgPT09IDIpIHtcbiAgICAgICAgICAgIHZhciBTID0gR2xvYmFsLlplcm87XG4gICAgICAgICAgICB2YXIgaSwgbCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIFMgPSBTWycrJ10odGhpc1tpXVsnXiddKHgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBTO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ14nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHguYSAtIDEpKVsnKiddKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKXtcbiAgICAgICAgcmV0dXJuIHRoaXNbJ14nXSh4LmEpWydeJ10oR2xvYmFsLk9uZVsnLyddKHguYikpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gY29tbXV0ZVxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgVmVjdG9yIF4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVmYXVsdCh0aGlzWydeJ10oeFsnLSddKEdsb2JhbC5PbmUpKSk7XG59O1xuXG5fLm9sZF9hcHBseV9vcGVyYXRvciA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBlKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB2YXIgaTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJywnOlxuICAgICAgICAgICAgLy9BcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICAgICAgLy9GYXN0ZXI6XG4gICAgICAgICAgICAvL01PRElGSUVTISEhISEhISEhXG4gICAgICAgICAgICB0aGlzW2xdID0gZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSAnKic6XG4gICAgICAgICAgICBpZihsICE9PSBlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93KCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN1bSA9IE0uR2xvYmFsLlplcm87XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtLmFwcGx5KCcrJywgdGhpc1tpXS5hcHBseSgnKicsIGVbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdW07XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgIGlmKGwgIT09IGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbiA9IG5ldyBBcnJheShsKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuW2ldID0gdGhpc1tpXS5hcHBseShvcGVyYXRvciwgZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVmVjdG9yKG4pO1xuICAgICAgICBjYXNlICcvJzpcbiAgICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93KCdWZWN0b3Igb3BlcmF0aW9uIG5vdCBhbGxvd2VkLicpO1xuICAgIH1cbn07XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIF94ID0gbmV3IEFycmF5KGwpO1xuICAgIHZhciBfeSA9IG5ldyBBcnJheShsKTtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHJpID0gdGhpc1tpXS5yZWFsaW1hZygpO1xuICAgICAgICBfeFtpXSA9IHJpWzBdO1xuICAgICAgICBfeVtpXSA9IHJpWzFdO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICBWZWN0b3IoX3gpLFxuICAgICAgICBWZWN0b3IoX3kpXG4gICAgXSk7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24oQ29kZSwgbGFuZykge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIG9wZW4gPSAnWyc7XG4gICAgdmFyIGNsb3NlID0gJ10nO1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICBvcGVuID0gJ3ZlYycgKyB0aGlzLmxlbmd0aCArICcoJztcbiAgICAgICAgY2xvc2UgPSAnKSc7XG4gICAgfVxuICAgIHZhciBjID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICB2YXIgaTtcbiAgICB2YXIgdF9zID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgY19pID0gdGhpc1tpXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgdF9zLnB1c2goY19pLnMpO1xuICAgICAgICBjID0gYy5tZXJnZShjX2kpO1xuICAgIH1cbiAgICByZXR1cm4gYy51cGRhdGUob3BlbiArIHRfcy5qb2luKCcsJykgKyBjbG9zZSwgSW5maW5pdHkpO1xufTtcbn0pKCkiLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7XG5cbmZ1bmN0aW9uIE1hdHJpeChlLCByLCBjKSB7XG4gICAgZS5fX3Byb3RvX18gPSBNYXRyaXgucHJvdG90eXBlO1xuXG4gICAgZS5yb3dzID0gcjtcbiAgICBlLmNvbHMgPSBjO1xuXG4gICAgaWYgKHIgIT0gYykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01hdHJpeCBzaXplIG1pc21hdGNoJylcbiAgICB9XG5cbiAgICByZXR1cm4gZTtcbn1cblxudXRpbC5pbmhlcml0cyhNYXRyaXgsIHN1cCk7XG5cbnZhciBfID0gTWF0cml4LnByb3RvdHlwZTtcblxuXy5kZWZhdWx0ID0gX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk1hdHJpeCkge1xuICAgICAgICAvLyBCcm9rZW5cbiAgICAgICAgLy8gTyhuXjMpXG4gICAgICAgIGlmICh4LnJvd3MgIT09IHRoaXMuY29scykge1xuICAgICAgICAgICAgdGhyb3cgKCdNYXRyaXggZGltZW5zaW9ucyBkbyBub3QgbWF0Y2guJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAvLyByZXN1bHRbeC5yb3dzICogeC5jb2xzIC0gMSBdID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgaSwgaiwgaywgciA9IDA7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnJvd3M7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHguY29sczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1bSA9IEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgICAgIGZvcihrID0gMDsgayA8IHgucm93czsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSA9IHN1bVsnKyddKHhbayAqIHguY29scyArIGpdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0W3IrK10gPSBzdW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTWF0cml4KHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIHR5cGUnKTtcbiAgICB9XG59O1xuXG5fLnJlZHVjZSA9IGZ1bmN0aW9uIChhcHApIHtcbiAgICB2YXIgeCwgeTtcbiAgICBmb3IoeSA9IDA7IHkgPCB0aGlzLnJvd3M7IHkrKykge1xuICAgICAgICBmb3IoeCA9IDA7IHggPCB5OyB4KyspIHtcbiAgICAgICAgICAgIC8vIE1ha2UgdGhpc1t4LHldID0gMFxuICAgICAgICAgICAgdmFyIG1hID0gdGhpc1t4ICogdGhpcy5jb2xzICsgeF07XG4gICAgICAgICAgICAvLyAwID0gdGhpcyAtICh0aGlzL21hKSAqIG1hXG4gICAgICAgICAgICBpZihtYSA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAoJ1JvdyBzd2FwIScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtYSA9IHRoaXNbeSAqIHRoaXMuY29scyArIHhdWycvJ10obWEpO1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSB4ICsgMTsgaSA8IHRoaXMuY29sczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpc1t5ICogdGhpcy5jb2xzICsgaV0gPSB0aGlzW3kgKiB0aGlzLmNvbHMgKyBpXVsnLSddKHRtYVsnKiddKHRoaXNbeCAqIHRoaXMuY29scyArIGldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCAgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9nbG9iYWwnKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5maW5pdGVzaW1hbDtcbnV0aWwuaW5oZXJpdHMoSW5maW5pdGVzaW1hbCwgc3VwKTtcbmZ1bmN0aW9uIEluZmluaXRlc2ltYWwoeCkge1xuICAgIHRoaXMueCA9IHg7XG59XG52YXIgXyA9IEluZmluaXRlc2ltYWwucHJvdG90eXBlO1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGVzaW1hbCBhZGRpdGlvbicpO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54LmRpZmZlcmVudGlhdGUoeC54KTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZ1c2luZyBpbmZpdGVzaW1hbCBkaXZpc2lvbicpO1xuICAgIH1cbiAgICB0aGlzLnggPSB0aGlzLnhbJy8nXSh4KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIC8vIGReMiA9IDBcbiAgICBpZih4IGluc3RhbmNlb2YgSW5maW5pdGVzaW1hbCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIHRoaXMueCA9IHRoaXMueFsnKiddKHgpO1xufTtcbl8ucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgaWYobGFuZyAhPT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGVzaW1hbCBudW1iZXJzIGNhbm5vdCBiZSBleHBvcnRlZCB0byBwcm9ncmFtbWluZyBsYW5ndWFnZXMnKTtcbiAgICB9XG4gICAgdmFyIGMgPSB0aGlzLngucyhsYW5nKTtcbiAgICB2YXIgcCA9IGxhbmd1YWdlLnByZWNlZGVuY2UoJ2RlZmF1bHQnKVxuICAgIGlmKHAgPiBjLnApIHtcbiAgICAgICAgYy5zID0gJ1xcXFxsZWZ0KCcgKyBjLnMgKyAnXFxcXHJpZ2h0KSc7XG4gICAgfVxuICAgIHJldHVybiBjLnVwZGF0ZSgnZCcgKyBjLnMsIHApO1xufTtcblxufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRUZ1bmN0aW9uO1xuXG51dGlsLmluaGVyaXRzKEVGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gRUZ1bmN0aW9uIChwKSB7XG4gICAgdGhpcy5kZWZhdWx0ID0gcC5kZWZhdWx0O1xuICAgIHRoaXNbJ3RleHQvbGF0ZXgnXSA9IChwWyd0ZXh0L2xhdGV4J10pO1xuICAgIHRoaXNbJ3gtc2hhZGVyL3gtZnJhZ21lbnQnXSA9IChwWyd4LXNoYWRlci94LWZyYWdtZW50J10pO1xuICAgIHRoaXNbJ3RleHQvamF2YXNjcmlwdCddID0gKHBbJ3RleHQvamF2YXNjcmlwdCddKTtcbiAgICB0aGlzLmRlcml2YXRpdmUgPSBwLmRlcml2YXRpdmU7XG4gICAgdGhpcy5yZWFsaW1hZyA9IHAucmVhbGltYWc7XG59O1xuXG52YXIgXyA9IEVGdW5jdGlvbi5wcm90b3R5cGU7XG5cbi8vIEBhYnN0cmFjdFxuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuO1xufTtcblxuLy8gQGFic3RyYWN0XG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuZGVyaXZhdGl2ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXJpdmF0aXZlO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VGdW5jdGlvbiBoYXMgbm8gZGVyaXZhdGl2ZSBkZWZpbmVkLicpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYgKHRoaXNbbGFuZ10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKHRoaXNbbGFuZ10pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjb21waWxlIGZ1bmN0aW9uIGludG8gJyArIGxhbmcpO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgYSA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbCgpO1xuICAgIHJldHVybiBuZXcgRUZ1bmN0aW9uLlN5bWJvbGljKHRoaXMuZGVmYXVsdChhKVsnKyddKHgpLCBbYV0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGEgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2woKTtcbiAgICByZXR1cm4gbmV3IEVGdW5jdGlvbi5TeW1ib2xpYyh0aGlzLmRlZmF1bHQoYSlbJ0AtJ10oKSwgW2FdKTtcbn07XG5cbiIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi8uLi9nbG9iYWwnKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdFJlYWw7XG5cbnV0aWwuaW5oZXJpdHMoTGlzdFJlYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIExpc3RSZWFsKHgsIG9wZXJhdG9yKSB7XG4gICAgeC5fX3Byb3RvX18gPSBMaXN0UmVhbC5wcm90b3R5cGU7XG4gICAgaWYob3BlcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB4Lm9wZXJhdG9yID0gb3BlcmF0b3I7XG4gICAgfVxuICAgIHJldHVybiB4O1xufVxuXG52YXIgXyA9IExpc3RSZWFsLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXMsXG4gICAgICAgIEdsb2JhbC5aZXJvXG4gICAgXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcbl8ucG9sYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHN1cC5Db21wbGV4UG9sYXIoW1xuICAgICAgICBzdXAuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLFxuICAgICAgICBzdXAuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXG4gICAgXSk7XG59O1xuXy5hYnMgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gc3VwLlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pO1xufTtcbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcyA9PT0geCkge1xuICAgICAgICByZXR1cm4geFsnKiddKG5ldyBFeHByZXNzaW9uLkludGVnZXIoMikpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJysnICYmIHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXSwgdGhpc1sxXVsnKyddKHgpXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJy0nICYmIHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXSwgeFsnLSddKHRoaXNbMV0pXSwgJysnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgXG4gICAgaWYoeCBpbnN0YW5jZW9mIHN1cC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIHJldHVybiB4WycrJ10odGhpcyk7XG4gICAgXG59O1xuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmICh4ID09PSB0aGlzKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBzdXAuUmVhbCkge1xuICAgICAgICBpZiAoeC5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4WzBdXSwgJysnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWyctJ10oeCk7XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicgfHwgdGhpcy5vcGVyYXRvciA9PT0gJy8nICYmIHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXVsnKiddKHgpLCB0aGlzWzFdXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt4LCB0aGlzXSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIHN1cC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIGlmICh0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5GdW5jdGlvbikge1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbiAgICBcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYoeCA9PT0gdGhpcykge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXVsnLyddKHgpLCB0aGlzWzFdXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9XG5cbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKVsnLyddKHgpO1xufTtcbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbn07XG5fWydALSddID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICdALScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbMF07XG4gICAgfVxuICAgIHJldHVybiBzdXAuUmVhbChbdGhpc10sICdALScpO1xufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicgfHwgdGhpcy5vcGVyYXRvciA9PT0gJy8nICYmIHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXVsnXiddKHgpLCB0aGlzWzFdWydeJ10oeCldLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKHRoaXMsIHgpO1xuICAgIFxufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmICh0aGlzLm9wZXJhdG9yID09PSAnKycgfHxcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9PT0gJy0nIHx8XG4gICAgICAgIHRoaXMub3BlcmF0b3IgPT09ICdALScpIHtcblxuICAgICAgICByZXR1cm4gdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpW3RoaXMub3BlcmF0b3JdKHRoaXNbMV0gJiYgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpKTtcbiAgICBcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICBpZih0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5GdW5jdGlvbikge1xuXG4gICAgICAgICAgICB2YXIgZGEgPSB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeCk7XG4gICAgICAgICAgICBpZihkYSA9PT0gR2xvYmFsLlplcm8pIHJldHVybiBkYTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSgpLmRlZmF1bHQodGhpc1sxXSlbJyonXShkYSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpc1swXVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApWycrJ10odGhpc1sxXVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gJy8nKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXNbMV1bJyonXShcbiAgICAgICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApWyctJ10oXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oXG4gICAgICAgICAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICAgICApXG4gICAgICAgIClbdGhpcy5vcGVyYXRvcl0oXG4gICAgICAgICAgICB0aGlzWzFdWycqJ10odGhpc1sxXSlcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICdeJykge1xuXG4gICAgICAgIHZhciBkZiA9IHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KTtcbiAgICAgICAgdmFyIGRnID0gdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpO1xuXG4gICAgICAgIGlmIChkZiA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgICAgIGlmIChkZyA9PT0gR2xvYmFsLlplcm8pIHJldHVybiBkZztcblxuICAgICAgICAgICAgcmV0dXJuIGRnLmRlZmF1bHQoXG4gICAgICAgICAgICAgICAgR2xvYmFsLmxvZy5kZWZhdWx0KHRoaXNbMF0pXG4gICAgICAgICAgICApLmRlZmF1bHQodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmEgPSB0aGlzWzBdWydeJ10oXG4gICAgICAgICAgICB0aGlzWzFdWyctJ10oR2xvYmFsLk9uZSlcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gZmEuZGVmYXVsdChcbiAgICAgICAgICAgIGRmLmRlZmF1bHQodGhpc1sxXSlbJysnXShcbiAgICAgICAgICAgICAgICB0aGlzWzBdWycqJ10oXG4gICAgICAgICAgICAgICAgICAgIEdsb2JhbC5sb2cuZGVmYXVsdCh0aGlzWzBdKVxuICAgICAgICAgICAgICAgIClbJyonXShcbiAgICAgICAgICAgICAgICAgICAgZGdcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfVxufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG5cbiAgICB2YXIgbGFuZ3VhZ2UgPSBDb2RlLmxhbmd1YWdlO1xuICAgIGZ1bmN0aW9uIHBhcmVuKHgpIHtcbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcXFxsZWZ0KCcgKyB4ICsgJ1xcXFxyaWdodCknOyBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJygnICsgeCArICcpJztcbiAgICB9XG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IEdsb2JhbC5hYnMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICAgICAgICAgICAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnXFxcXGxlZnR8JyArIGMxLnMgKyAnXFxcXHJpZ2h0fCcsIEluZmluaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKGMwLnMgKyAnKCcgKyBjMS5zICsgJyknLCBJbmZpbml0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgaWYgKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlZlY3Rvcikge1xuICAgICAgICAgICAgICAgIHZhciBjMXMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpc1sxXSwgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgdmFyIHRfcyA9IGMxcy5tYXAoZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS5zO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IEdsb2JhbC5hdGFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRfcyA9IHRfcy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjMF9zID0gYzAucztcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYzFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGMwLm1lcmdlKGMxc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoYzBfcyArIHBhcmVuKHRfcyksIGxhbmd1YWdlLm9wZXJhdG9ycy5kZWZhdWx0LnByZWNlZGVuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgYzAucyArIHBhcmVuKGMxLnMpLCBsYW5ndWFnZS5vcGVyYXRvcnMuZGVmYXVsdC5wcmVjZWRlbmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub3BlcmF0b3IgPSAnKic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHAgPSBsYW5ndWFnZS5vcGVyYXRvcnNbdGhpcy5vcGVyYXRvcl0ucHJlY2VkZW5jZTtcbiAgICB2YXIgYXNzb2MgPSBsYW5ndWFnZS5vcGVyYXRvcnNbdGhpcy5vcGVyYXRvcl0gPT09IDA7XG4gICAgZnVuY3Rpb24gXyh4KSB7XG4gICAgICAgIGlmKHAgPiB4LnAgfHwgIWFzc29jKXtcbiAgICAgICAgICAgIHJldHVybiBwYXJlbih4LnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4LnM7XG4gICAgfVxuXG4gICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJ14nKSB7XG5cbiAgICAgICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSBHbG9iYWwuZSkge1xuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnZXhwKCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgdGhpc1sxXS5hIDwgNSAmJiB0aGlzWzFdLmEgPiAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgdmFyIGogPSBsYW5ndWFnZS5vcGVyYXRvcnNbJyonXS5wcmVjZWRlbmNlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBwcmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGNzO1xuICAgICAgICAgICAgICAgIGlmKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICAgICAgICAgICAgICBjcyA9IGMwLnM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNzID0gYzAudmFyaWFibGUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHByZSA9ICdmbG9hdCAnICsgY3MgKyAnID0gJyArIGMwLnMgKyAnOyc7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzID0gY3M7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAxOyBpIDwgdGhpc1sxXS5hOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcys9ICcqJyArIGNzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYzAudXBkYXRlKCcoJyArIHMgKyAnKScsIEluZmluaXR5LCBwcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB0aGlzWzFdLmEgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIC8vIHRvZG86IHByZWNlZGVuY2Ugbm90IG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoJygxLjAvKCcgKyBjMC5zICsgJykpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgICAgIC8vIGFeMiwgMywgNCwgNSwgNiBcbiAgICAgICAgICAgICAgICAvLyB1bnN1cmUgaXQgaXMgZ2NkXG4gICAgICAgICAgICAgICAgdGhpc1sxXSA9IHRoaXNbMV0ucmVkdWNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW4gPSB0aGlzWzFdLmEgJSAyID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgICAgIGlmKGV2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ3BvdygnICsgYzAucyArICcsJyArIGMxLnMgICsgJyknKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHheKGEpID0gKHgpICogeF4oYS0xKVxuICAgICAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdWyctJ10oR2xvYmFsLk9uZSkuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICcoKCcgKyBjMC5zICsgJykgKiBwb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJykpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcblxuICAgICAgICAgICAgICAgIC8vIE5lZyBvciBwb3MuXG4gICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXVsnLSddKEdsb2JhbC5PbmUpLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnKCgnICsgYzAucyArICcpICogcG93KCcgKyBjMC5zICsgJywnK2MxLnMrJykpJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdWyctJ10oR2xvYmFsLk9uZSkuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gTmVlZHMgYSBuZXcgZnVuY3Rpb24sIGRlcGVuZGVudCBvbiBwb3dlci5cbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJygoJyArIGMwLnMgKyAnKSAqIHBvdygnICsgYzAucyArICcsJytjMS5zKycpKScpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gR2xvYmFsLmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ01hdGguZXhwKCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gYV4yLCAzLCA0LCA1LCA2IFxuICAgICAgICAgICAgICAgIHZhciBldmVuID0gdGhpc1sxXS5hICUgMiA/IGZhbHNlIDogdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmKGV2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnTWF0aC5wb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdNYXRoLnBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gTmVlZHMgYSBuZXcgZnVuY3Rpb24sIGRlcGVuZGVudCBvbiBwb3dlci5cbiAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdNYXRoLnBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSBpZiAobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKXtcbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBfKGMwKSArICdeJyArICd7JyArIGMxLnMgKyAnfScpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuXG4gICAgaWYodGhpcy5vcGVyYXRvclswXSA9PT0gJ0AnKSB7XG4gICAgICAgIHJldHVybiBjMC51cGRhdGUodGhpcy5vcGVyYXRvclsxXSArIF8oYzApLCBwKTtcbiAgICB9XG5cbiAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgIFxuICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnLycpIHtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ1xcXFxmcmFjeycgKyBjMC5zICsgJ317JyArIGMxLnMgKyAnfScpXG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonKSB7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsIF8oYzApICsgXyhjMSksIHApO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyUnKSB7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdtb2QoJyArIF8oYzApICsgJywnICsgXyhjMSkgKyAnKScsIHApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBfKGMwKSArIHRoaXMub3BlcmF0b3IgKyBfKGMxKSwgcCk7XG59O1xuXG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vLi4vZ2xvYmFsJyk7XG5cbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sX1JlYWw7XG5cbnV0aWwuaW5oZXJpdHMoU3ltYm9sX1JlYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIFN5bWJvbF9SZWFsKHN0cikge1xuICAgIHRoaXMuc3ltYm9sID0gc3RyO1xufVxuXG52YXIgXyA9IFN5bWJvbF9SZWFsLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbdGhpcywgR2xvYmFsLlplcm9dKTtcbn07XG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXy5wb2xhciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKSxcbiAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKVxuICAgIF0pO1xufTtcbl8uYWJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSk7XG59O1xuXy5hcmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKTtcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcyA9PT0geCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgaWYgKHgub3BlcmF0b3IgPT09ICdALScpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhbMF1dLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4geFsnQC0nXSgpWycrJ10odGhpcyk7XG59O1xuXG5fWydAKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXNdLCAnQCsnKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpc10sICdALScpO1xufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiB4WycqJ10odGhpcyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbeCwgdGhpc10sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xufTtcbl8uYXBwbHkgPSBfWycqJ107XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ0RpdmlzaW9uIGJ5IHplcm8nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLycpO1xufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgdmFyIGYgPSB4LnJlZHVjZSgpO1xuICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xufTtcbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbn07XG5fLmFwcGx5T2xkID0gZnVuY3Rpb24ob3BlcmF0b3IsIGUpIHtcbiAgICB0aHJvdyhcIlJlYWwuYXBwbHlcIik7XG4gICAgLy8gaWYgKG9wZXJhdG9yID09PSAnLCcpIHtcbiAgICAvLyAgICAgLy9NYXliZSB0aGlzIHNob3VsZCBiZSBhIG5ldyBvYmplY3QgdHlwZT8/PyBWZWN0b3I/XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCdBUFBMWTogJywgdGhpcy5jb25zdHJ1Y3RvciwgdGhpcywgZSk7XG4gICAgLy8gICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgZV0pO1xuICAgIC8vIH0gZWxzZSBpZiAob3BlcmF0b3IgPT09ICc9Jykge1xuICAgIC8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5FcXVhdGlvbihbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyB9XG4gICAgLy8gaWYgKGUgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vICAgICAvL1VuYXJ5OlxuICAgIC8vICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgLy8gICAgICAgICBjYXNlICchJzpcbiAgICAvLyAgICAgICAgICAgICAvL1RPRE86IENhbid0IHNpbXBsaWZ5LCBzbyB3aHkgYm90aGVyISAocmV0dXJuIGEgbGlzdCwgc2luY2UgZ2FtbWEgbWFwcyBhbGwgcmVhbHMgdG8gcmVhbHM/KVxuICAgIC8vICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodW5kZWZpbmVkLCB0aGlzLmFwcGx5KCcrJywgR2xvYmFsLk9uZSkpO1xuICAgIC8vICAgICAgICAgY2FzZSAnQC0nOlxuICAgIC8vICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpc10sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgIGRlZmF1bHQ6XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgdGhyb3coJ1JlYWwgU3ltYm9sKCcrdGhpcy5zeW1ib2wrJykgY291bGQgbm90IGhhbmRsZSBvcGVyYXRvciAnKyBvcGVyYXRvcik7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgICAgLy8gU2ltcGxpZmljYXRpb246XG4gICAgLy8gICAgIHN3aXRjaCAoZS5jb25zdHJ1Y3Rvcil7XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uU3ltYm9sLlJlYWw6XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5SZWFsOlxuICAgIC8vICAgICAgICAgICAgIC8qaWYodGhpcy5wb3NpdGl2ZSAmJiBlLnBvc2l0aXZlKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICB9Ki9cbiAgICAvLyAgICAgICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAvL1RPRE86IEJhZCBpZGVhPyBUaGlzIHdpbGwgc3RheSBpbiB0aGlzIGZvcm0gdW50aWwgcmVhbGltYWcoKSBpcyBjYWxsZWQgYnkgdXNlciwgYW5kIHVzZXIgb25seS5cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKSwgZV0sJ14nKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbZSwgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKV0sJyonKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgJyonKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbDpcbiAgICAvLyAgICAgICAgICAgICBzd2l0Y2gob3BlcmF0b3Ipe1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAxKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCAnKicpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJyUnOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgJyUnKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAxKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGZhbHNlICYmIG9wZW5nbF9UT0RPX2hhY2soKSAmJiBlLnZhbHVlID09PSB+fmUudmFsdWUpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKSwgZV0sJ14nKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbZSwgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKV0sJyonKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDEpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuSW5maW5pdHk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uQ29tcGxleDpcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCBlKTsgLy8gR08gdG8gYWJvdmUgKHdpbGwgYXBwbHkgcmVhbHMpXG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuOlxuICAgIC8vICAgICAgICAgICAgIC8vTWF5YmUgdGhlcmUgaXMgYSB3YXkgdG8gc3dhcCB0aGUgb3JkZXI/IChlLmcuIGEgLnJlYWwgPSB0cnVlIHByb3BlcnR5IGZvciBvdGhlciB0aGluZ3MgdG8gY2hlY2spXG4gICAgLy8gICAgICAgICAgICAgLy9vciBpbnN0YW5jZSBvZiBFeHByZXNzaW9uLlJlYWwgP1xuICAgIC8vICAgICAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkob3BlcmF0b3IsIGVbMF0pLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGVbMV1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseShvcGVyYXRvciwgZVswXSksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseShvcGVyYXRvciwgZVsxXSlcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IGVbMF0uYXBwbHkoJyonLGVbMF0pLmFwcGx5KCcrJyxlWzFdLmFwcGx5KCcqJyxlWzFdKSk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLmFwcGx5KCcqJyxlWzBdKSkuYXBwbHkoJy8nLCBjY19kZCksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseSgnKicsZVsxXSkuYXBwbHkoJy8nLCBjY19kZCkuYXBwbHkoJ0AtJylcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcjpcbiAgICAvLyAgICAgICAgICAgICAvL01heWJlIHRoZXJlIGlzIGEgd2F5IHRvIHN3YXAgdGhlIG9yZGVyP1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvbGFyKCkuYXBwbHkob3BlcmF0b3IsIGUpO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHRocm93KCdMSVNUIEZST00gUkVBTCBTWU1CT0whICcrIG9wZXJhdG9yLCBlLmNvbnN0cnVjdG9yKTtcbiAgICAvLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyB9XG59O1xuXG5cbn0pKCkiLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxuLypcbiAgICBUaGlzIHR5cGUgaXMgYW4gYXR0ZW1wdCB0byBhdm9pZCBoYXZpbmcgdG8gY2FsbCAucmVhbGltYWcoKSBkb3duIHRoZSB0cmVlIGFsbCB0aGUgdGltZS5cbiAgICBcbiAgICBNYXliZSB0aGlzIGlzIGEgYmFkIGlkZWEsIGJlY2F1c2UgaXQgd2lsbCBlbmQgdXAgaGF2aW5nOlxuICAgIFxuICAgIGYoeCkgPSA+XG4gICAgW1xuICAgICAgICBSZV9mKHgpLFxuICAgICAgICBJbV9mKHgpXG4gICAgICAgIFxuICAgIF1cbiAgICB3aGljaCByZXF1aXJlcyB0d28gZXZhbHVhdGlvbnMgb2YgZih4KS5cblxuKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV4Q2FydGVzaWFuO1xuXG51dGlsLmluaGVyaXRzKENvbXBsZXhDYXJ0ZXNpYW4sIHN1cCk7XG5cbmZ1bmN0aW9uIENvbXBsZXhDYXJ0ZXNpYW4oeCkge1xuICAgIHguX19wcm90b19fID0gQ29tcGxleENhcnRlc2lhbi5wcm90b3R5cGU7XG4gICAgcmV0dXJuIHg7XG59XG5cbnZhciBfID0gQ29tcGxleENhcnRlc2lhbi5wcm90b3R5cGU7XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzWzBdO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpc1sxXTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF0sXG4gICAgICAgIHRoaXNbMV0uYXBwbHkoJ0AtJylcbiAgICBdKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF1bJ0AtJ10oKSxcbiAgICAgICAgdGhpc1sxXVsnQC0nXSgpXG4gICAgXSk7XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIENvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gKGErYmkpICogKGMrZGkpID0gYWMgKyBhZGkgKyBiY2kgLSBiZFxuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVsnKiddKHhbMF0pWyctJ10odGhpc1sxXVsnKiddKHhbMV0pKSxcbiAgICAgICAgICAgIHRoaXNbMF1bJyonXSh4WzFdKVsnKyddKHRoaXNbMV1bJyonXSh4WzBdKSlcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVsnKiddKHgpLFxuICAgICAgICAgICAgdGhpc1sxXVsnKiddKHgpXG4gICAgICAgIF0pO1xuICAgIH1cbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcblxuICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQmlub21pYWwgZXhwYW5zaW9uXG4gICAgICAgIC8vIChhK2IpXk5cbiAgICAgICAgdmFyIG4gID0geC5hO1xuICAgICAgICB2YXIgaztcbiAgICAgICAgdmFyIGEgPSB0aGlzWzBdO1xuICAgICAgICB2YXIgYiA9IHRoaXNbMV07XG4gICAgICAgIHZhciBuZWdvbmUgPSBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKC0xKTtcbiAgICAgICAgdmFyIGltYWdfcGFydCA9IEdsb2JhbC5aZXJvO1xuICAgICAgICBcbiAgICAgICAgdmFyIHJlYWxfcGFydCA9IGFbJ14nXShcbiAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIobilcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjaSA9IDE7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGsgPSAxOzsgaysrKSB7XG4gICAgICAgICAgICB2YXIgZXhwcjtcbiAgICAgICAgICAgIGlmKGsgPT09IG4pIHtcbiAgICAgICAgICAgICAgICBleHByID0gKFxuICAgICAgICAgICAgICAgICAgICBiWydeJ10oXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKGspXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChjaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICAgICAgY2kgPSAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cHIgPSBhWydeJ10oXG4gICAgICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihuIC0gaylcbiAgICAgICAgICAgIClbJyonXShcbiAgICAgICAgICAgICAgICBiWydeJ10oXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIoaylcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGNpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAxKSB7XG4gICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAyKSB7XG4gICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAzKSB7XG4gICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgY2kgPSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2krKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgcmVhbF9wYXJ0LFxuICAgICAgICAgICAgaW1hZ19wYXJ0XG4gICAgICAgIF0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG59O1xuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIENvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHRoaXNbMF1cbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVsnKyddKHgpLFxuICAgICAgICAgICAgdGhpc1sxXVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgXG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpLFxuICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICBdKTtcbn07XG5cblxuLy8gXy5hcHBseU9sZCA9IGZ1bmN0aW9uKG8sIHgpIHtcbi8vICAgICAvL1RPRE86IGVuc3VyZSB0aGlzIGhhcyBhbiBpbWFnaW5hcnkgcGFydC4gSWYgaXQgZG9lc24ndCBpdCBpcyBhIGh1Z2Ugd2FzdGUgb2YgY29tcHV0YXRpb25cbi8vICAgICBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICBzd2l0Y2gobykge1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkobywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkobywgeFsxXSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIC8vRnVuY3Rpb24gZXZhbHVhdGlvbj8gTk8uIFRoaXMgaXMgbm90IGEgZnVuY3Rpb24uIEkgdGhpbmsuXG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4WzBdKS5hcHBseSgnLScsIHRoaXNbMV0uYXBwbHkoJyonLCB4WzFdKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4WzFdKS5hcHBseSgnKycsIHRoaXNbMV0uYXBwbHkoJyonLCB4WzBdKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHhbMF0uYXBwbHkoJyonLCB4WzBdKS5hcHBseSgnKycsIHhbMV0uYXBwbHkoJyonLCB4WzFdKSk7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1swXS5hcHBseSgnKicseFswXSkuYXBwbHkoJysnLHRoaXNbMV0uYXBwbHkoJyonLHhbMV0pKSkuYXBwbHkoJy8nLCBjY19kZCksXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzFdLmFwcGx5KCcqJyx4WzBdKS5hcHBseSgnLScsdGhpc1swXS5hcHBseSgnKicseFsxXSkpKS5hcHBseSgnLycsIGNjX2RkKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9UaGUgbW9zdCBjb25mdXNpbmcgb2YgdGhlbSBhbGw6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhhbGYgPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDAuNSwgMCk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IGhhbGYuYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICBHbG9iYWwubG9nLmFwcGx5KHVuZGVmaW5lZCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIC8vVGhlIG1hZ25pdHVkZTogaWYgdGhpcyB3YXMgZm9yIGEgcG9sYXIgb25lIGl0IGNvdWxkIGJlIGZhc3QuXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzBdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApLmFwcGx5KCcrJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gR2xvYmFsLmF0YW4yLmFwcGx5KHVuZGVmaW5lZCwgRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXNbMV0sIHRoaXNbMF1dKSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0uYXBwbHkoJyonLCB4WzFdKS5hcHBseSgnKycsIHRoZXRhLmFwcGx5KCcqJywgeFswXSkpO1xuICAgICAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBHbG9iYWwuZXhwLmFwcGx5KHVuZGVmaW5lZCxcbi8vICAgICAgICAgICAgICAgICAgICAgaGxtLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGJbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgKS5hcHBseSgnLScsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGV0YS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYlsxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBcblxuLy8gICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBHbG9iYWwuZS5hcHBseSgnXicsXG4vLyAgICAgICAgICAgICAgICAgICAgIGhsbS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB4WzBdXG4vLyAgICAgICAgICAgICAgICAgICAgICkuYXBwbHkoJy0nLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhldGEuYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICk7XG5cbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQuYXBwbHkoJyonLEdsb2JhbC5jb3MuYXBwbHkodW5kZWZpbmVkLCBobWxkX3RjKSkpLFxuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkLmFwcGx5KCcqJyxHbG9iYWwuc2luLmFwcGx5KHVuZGVmaW5lZCwgaG1sZF90YykpKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKXtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vKHgreWkpL0EqZV4oaWspXG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geFswXS5hcHBseSgnKicsIHhbMF0pO1xuLy8gICAgICAgICAgICAgICAgIHZhciBiID0geC5yZWFsaW1hZygpO1xuLy8gICAgICAgICAgICAgICAgIC8vQ2xlYW4gdGhpcyB1cD8gU3ViP1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMF0uYXBwbHkoJyonLGJbMF0pLmFwcGx5KCcrJyxhWzFdLmFwcGx5KCcqJyxiWzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpLFxuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1sxXS5hcHBseSgnKicsYlswXSkuYXBwbHkoJy0nLGFbMF0uYXBwbHkoJyonLGJbMV0pKSkuYXBwbHkoJy8nLCBjY19kZClcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vaHR0cDovL3d3dy53b2xmcmFtYWxwaGEuY29tL2lucHV0Lz9pPVJlJTI4JTI4eCUyQnlpJTI5JTVFJTI4QSplJTVFJTI4aWslMjklMjklMjlcbi8vICAgICAgICAgICAgICAgICAvLyh4K3lpKV4oQSplXihpaykpXG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uQ29tcGxleCkge1xuLy8gICAgICAgICByZXR1cm4gdGhpcy5hcHBseShvLCB4LnJlYWxpbWFnKCkpO1xuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdEdXBsaWNhdGVkIGFuIHghIFRoaXMgbWFrZXMgaXQgZGlmZmljdWx0IHRvIHNvbHZlIGNvbXBsZXggZXF1YXRpb25zLCBJIHRoaW5rJyk7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdEdXBsaWNhdGVkIGFuIHghIFRoaXMgbWFrZXMgaXQgZGlmZmljdWx0IHRvIHNvbHZlIGNvbXBsZXggZXF1YXRpb25zLCBJIHRoaW5rJyk7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfVxuLy8gICAgIHRocm93KCdDTVBMWC5MSVNUICogJyArIG8pO1xuLy8gfTtcbiIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV4UG9sYXI7XG5cbnV0aWwuaW5oZXJpdHMoQ29tcGxleFBvbGFyLCBzdXApO1xuXG5mdW5jdGlvbiBDb21wbGV4UG9sYXIgKHgpe1xuICAgIHguX19wcm90b19fID0gQ29tcGxleFBvbGFyLnByb3RvdHlwZTtcbiAgICByZXR1cm4geDtcbn1cbnZhciBfID0gQ29tcGxleFBvbGFyLnByb3RvdHlwZTtcblxuXy5wb2xhciA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vVE9ETzogUmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuXG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5jb3MuYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSksXG4gICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuc2luLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpXG4gICAgXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuY29zLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLnNpbi5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDb21wbGV4UG9sYXIoW1xuICAgICAgICB0aGlzWzBdLFxuICAgICAgICB0aGlzWzFdLmFwcGx5KCdALScpXG4gICAgXSk7XG59O1xuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24oeCl7XG4gICAgLy8gZC9keCBhKHgpICogZV4oaWIoeCkpXG4gICAgXG4gICAgLy9UT0RPIGVuc3VyZSBiZWxvdyAgZicgKyBpZiBnJyBwYXJ0IGlzIHJlYWxpbWFnIChmJywgZmcnKVxuICAgIHJldHVybiBHbG9iYWwuZVxuICAgIC5hcHBseShcbiAgICAgICAgJ14nLFxuICAgICAgICBHbG9iYWwuaVxuICAgICAgICAuYXBwbHkoJyonLFxuICAgICAgICAgICAgdGhpc1sxXVxuICAgICAgICApXG4gICAgKVxuICAgIC5hcHBseSgnKicsXG4gICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICAuYXBwbHkoJysnLFxuICAgICAgICAgICAgR2xvYmFsLmlcbiAgICAgICAgICAgIC5hcHBseSgnKicsXG4gICAgICAgICAgICAgICAgdGhpc1swXVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFwcGx5KCcqJyxcbiAgICAgICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICk7XG59O1xuLy8gXy5hcHBseSA9IGZ1bmN0aW9uKG8sIHgpIHtcbi8vICAgICBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJysnLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnLScsIHhbMV0pXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBzbG93LCBtYXliZSB3ZSBzaG91bGQgc3dpdGNoIHRvIGNhcnRlc2lhbiBub3c/XG4gICAgICAgICAgICBcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vKEFlXihpaykpIF4gKEJlXihpaikpXG4vLyAgICAgICAgICAgICAgICAgLy9Ib3cgc2xvdyBpcyB0aGlzP1xuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBmYXN0IGZvciByZWFsIG51bWJlcnMgdGhvdWdoXG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Q6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkNvbXBsZXgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5fcmVhbCkpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcrJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9pbWFnKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9yZWFsKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJy0nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX2ltYWcpKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhBZV4oaWspKSBeIChCZV4oaWopKVxuLy8gICAgICAgICAgICAgICAgIC8vSG93IHNsb3cgaXMgdGhpcz9cbi8vICAgICAgICAgICAgICAgICAvL1ZlcnkgZmFzdCBmb3IgcmVhbCBudW1iZXJzIHRob3VnaFxuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4gICAgXG4vLyB9O1xuXy5hYnMgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpc1swXTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiB0aGlzWzFdO1xufTtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xpY0VGdW5jdGlvbjtcblxudXRpbC5pbmhlcml0cyhTeW1ib2xpY0VGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9saWNFRnVuY3Rpb24oZXhwciwgdmFycykge1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gICAgdGhpcy5zeW1ib2xzID0gdmFycztcbiAgICBcbn07XG52YXIgXyA9IFN5bWJvbGljRUZ1bmN0aW9uLnByb3RvdHlwZTtcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHguY29uc3RydWN0b3IgIT09IEV4cHJlc3Npb24uVmVjdG9yKSB7XG4gICAgICAgIHggPSBFeHByZXNzaW9uLlZlY3RvcihbeF0pO1xuICAgIH1cbiAgICB2YXIgZXhwciA9IHRoaXMuZXhwcjtcbiAgICB2YXIgaSwgbCA9IHRoaXMuc3ltYm9scy5sZW5ndGg7XG4gICAgaWYgKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgIHRocm93ICgnSW52YWxpZCBkb21haW4uIEVsZW1lbnQgb2YgRl4nICsgbCArICcgZXhwZWN0ZWQuJyk7XG4gICAgfVxuICAgIGZvcihpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBleHByID0gZXhwci5zdWIodGhpcy5zeW1ib2xzW2ldLCB4W2ldKVxuICAgIH1cbiAgICByZXR1cm4gZXhwcjtcbn07Il19
;