(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
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
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/**
 * @module  plot-grid
 */

var extend = require('xtend');
var isBrowser = require('is-browser');
var lg = require('mumath/lg');
var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var sf = 0;
var className = ((require('insert-css')("._016038c6 {\r\n\tposition: relative;\r\n}\r\n\r\n._016038c6 .grid {\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\tfont-family: sans-serif;\r\n}\r\n._016038c6 .grid-line {\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\twidth: 0;\r\n\theight: 0;\r\n\tcolor: rgba(127,127,127,.3);\r\n}\r\n._016038c6 .grid-line[hidden] {\r\n\tdisplay: none;\r\n}\r\n\r\n._016038c6 .grid-line-x {\r\n\tborder-left: 1px dotted;\r\n\tmargin-left: -1px;\r\n\theight: 100%;\r\n}\r\n\r\n._016038c6 .grid-line-y {\r\n\tmargin-top: -1px;\r\n\tborder-bottom: 1px dotted;\r\n\twidth: 100%;\r\n\ttop: auto;\r\n}\r\n\r\n._016038c6 .grid-axis {\r\n\tposition: absolute;\r\n}\r\n._016038c6 .grid-axis-x {\r\n\ttop: auto;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\tleft: 0;\r\n\tborder-bottom: 2px solid;\r\n\tmargin-bottom: -.5rem;\r\n}\r\n._016038c6 .grid-axis-y {\r\n\tborder-left: 2px solid;\r\n\tright: auto;\r\n\ttop: 0;\r\n\tbottom: 0;\r\n\tleft: -1px;\r\n    margin-left: -.5rem;\r\n}\r\n\r\n._016038c6 .grid-label {\r\n\tposition: absolute;\r\n\ttop: auto;\r\n\tleft: auto;\r\n\tmin-height: 1rem;\r\n\tfont-size: .8rem;\r\n}\r\n._016038c6 .grid-label-x {\r\n\tbottom: auto;\r\n\ttop: 100%;\r\n\tmargin-top: 1.5rem;\r\n\twidth: 2rem;\r\n\tmargin-left: -1rem;\r\n\ttext-align: center;\r\n}\r\n._016038c6 .grid-label-x:before {\r\n\tcontent: '';\r\n\tposition: absolute;\r\n\theight: .5rem;\r\n\twidth: 0;\r\n\tborder-left: 2px solid;\r\n\ttop: -1rem;\r\n\tmargin-left: -1px;\r\n\tmargin-top: -2px;\r\n\tleft: 1rem;\r\n}\r\n\r\n._016038c6 .grid-label-y {\r\n    right: 100%;\r\n    margin-right: 1.5rem;\r\n    margin-top: -.5rem;\r\n}\r\n._016038c6 .grid-label-y:before {\r\n\tcontent: '';\r\n\tposition: absolute;\r\n\twidth: .5rem;\r\n\theight: 0;\r\n\tborder-top: 2px solid;\r\n\tright: -1rem;\r\n\ttop: .4rem;\r\n\tmargin-right: -1px;\r\n}\r\n") || true) && "_016038c6");
var closestNumber = require('mumath/closest');
var mag = require('mumath/order');
var within = require('mumath/within');


module.exports = Grid;


function Grid (options) {
	var this$1 = this;

	if (!(this instanceof Grid)) return new Grid(options);

	extend(this, options);

	if (!isBrowser) return;

	//obtian container
	this.container = options.container || document.body;
	this.container.classList.add(className);

	//display grid
	this.grid = document.createElement('div');
	this.grid.classList.add('grid');
	this.container.appendChild(this.grid);

	this.lines = (options.lines || []).map(function (lines) { return extend(this$1.defaultLines, lines); });
	this.axes = (options.axes || []).map(function (axis) { return extend(this$1.defaultAxis, axis); });

	this.update(options);
}


inherits(Grid, Emitter);


Grid.prototype.container = null;
Grid.prototype.viewport = null;

Grid.prototype.lines = null;
Grid.prototype.axes = null;

Grid.prototype.defaultLines = {
	orientation: 'x',
	logarithmic: false,
	min: 0,
	max: 100,
	//detected from range
	values: null,
	//copied from values
	titles: null
};

Grid.prototype.defaultAxis = {
	name: '',
	//detected from range
	values: null,
	//copied from values
	labels: null,
	//copied from labels
	titles: null
};

Grid.prototype.update = function (options) {
	options = options || {};

	var grid = this.grid;

	//set viewport
	if (options.viewport) this.viewport = options.viewport;
	var viewport = this.viewport;

	if (viewport instanceof Function) {
		viewport = viewport(
			this.container.offsetWidth,
			this.container === document.body ? window.innerHeight : this.container.offsetHeight
		);
	}

	this.grid.style.left = viewport[0] + (typeof viewport[0] === 'number' ? 'px' : '');
	this.grid.style.top = viewport[1] + (typeof viewport[1] === 'number' ? 'px' : '');
	this.grid.style.width = viewport[2] + (typeof viewport[2] === 'number' ? 'px' : '');
	this.grid.style.height = viewport[3] + (typeof viewport[3] === 'number' ? 'px' : '');

	//hide all lines first
	var lines = grid.querySelectorAll('.grid-line');
	for (var i = 0; i < lines.length; i++) {
		lines[i].setAttribute('hidden', true);
	}
	var labels = grid.querySelectorAll('.grid-label');
	for (var i = 0; i < labels.length; i++) {
		labels[i].setAttribute('hidden', true);
	}

	//set lines
	this.lines.forEach(function (lines, idx) {
		//temp object keeping state of current lines run
		var stats = {};

		if (options.lines) lines = extend(this.lines[idx], options.lines[idx]);
		stats.lines = lines;

		var linesMin = Math.min(lines.max, lines.min);
		var linesMax = Math.max(lines.min, lines.max);
		stats.min = linesMin;
		stats.max = linesMax;

		//detect steps, if not defined, as one per each 50px
		var values = [];
		var intersteps = (lines.orientation === 'x' ? (typeof viewport[2] === 'number' ? viewport[2] : this.grid.clientWidth) : (typeof viewport[3] === 'number' ? viewport[3] : this.grid.clientHeight)) / 50;
		if (intersteps < 1) {
			values = [linesMin, linesMax];
		}
		else if (!lines.logarithmic) {
			var stepSize = (linesMax - linesMin) / Math.floor(intersteps);
			var order = mag(stepSize);

			stepSize = closestNumber(stepSize, [1, 2, 2.5, 5, 10].map(function (v) { return v * order; }));

			var start = stepSize * Math.round(linesMin / stepSize);

			for (var step = start; step <= linesMax; step += stepSize) {
				if (step < linesMin) continue;
				values.push(step);
			}
		}
		else {
			//each logarithmic divisor
			if (linesMin < 0 && linesMax > 0) throw Error('Cannot create logarithmic grid spanning over zero');

			[1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (base) {
				var order = mag(linesMin);
				var start = base * order;
				for (var step = start; step <= linesMax; step *=10) {
					if (step < linesMin) continue;
					values.push(step);
				}
			});
		}

		values = lines.values instanceof Function ?
			values.map(function (v, i) { return lines.values(v, i, stats); }, this).filter(function (v) { return v != null; }) :
			lines.values || values;
		stats.values = values;

		//define titles
		var titles = lines.titles instanceof Function ? values.map(function (v, i) { return lines.titles(v, i, stats); }, this) :
			lines.titles || values.slice().map(function (value) {
			return value.toLocaleString();
		});
		stats.titles = titles;

		//draw lines
		var offsets = values.map(function (value, i) {
			var line = grid.querySelector(("#grid-line-" + (lines.orientation) + "-" + (value|0) + "-" + idx));
			var ratio;
			if (!line) {
				line = document.createElement('span');
				line.id = "grid-line-" + (lines.orientation) + "-" + (value|0) + "-" + idx;
				line.classList.add('grid-line');
				line.classList.add(("grid-line-" + (lines.orientation)));
				line.setAttribute('data-value', value);
				line.setAttribute('title', titles[i]);
				grid.appendChild(line);
				if (!lines.logarithmic) {
					ratio = (value - linesMin) / (linesMax - linesMin);
				}
				else {
					ratio = (lg(value) - lg(linesMin)) / (lg(linesMax) - lg(linesMin));
				}
				if (lines.min > lines.max) ratio = 1 - ratio;

				ratio *= 100;
				if (lines.orientation === 'x') {
					line.style.left = ratio + '%';
				}
				else {
					line.style.top = (100 - ratio) + '%';
				}

				if (lines.style) {
					for (var prop in lines.style) {
						var val = lines.style[prop];
						if (typeof val === 'number') val += 'px';
						line.style[prop] = val;
					}
				}
			}
			else {
				ratio = parseFloat(line.getAttribute('data-value'));
			}
			line.removeAttribute('hidden');

			return ratio;
		});
		stats.offsets = offsets;


		//draw axes
		var axis = this.axes[idx];

		//do not paint inexisting axis
		if (!axis) return;

		if (options.axes) axis = extend(this.axes[idx], options.axes[idx]);
		stats.axis = axis;

		//define values
		var axisValues = axis.values || values;
		stats.axisValues = axisValues;

		//define titles
		var axisTitles = axis.titles instanceof Function ? axisValues.map(function (v, i) { return axis.titles(v, i, stats); }, this) : axis.titles ? axis.titles : axisValues === values ? titles : axisValues.slice().map(function (value) {
			return value.toLocaleString();
		});
		stats.axisTitles = axisTitles;

		//define labels
		var labels = axis.labels instanceof Function ? axisValues.map(function (v, i) { return axis.labels(v, i, stats); }, this) : axis.labels || axisTitles;
		stats.labels = labels;


		//put axis properly
		var axisEl = grid.querySelector(("#grid-axis-" + (lines.orientation)));
		if (!axisEl) {
			axisEl = document.createElement('span');
			axisEl.id = "grid-axis-" + (lines.orientation) + "-" + idx;
			axisEl.classList.add('grid-axis');
			axisEl.classList.add(("grid-axis-" + (lines.orientation)));
			axisEl.setAttribute('data-name', axis.name);
			axisEl.setAttribute('title', axis.name);
			grid.appendChild(axisEl);
		}
		axisEl.removeAttribute('hidden');

		//draw labels
		axisValues.forEach(function (value, i) {
			if (value == null || labels[i] == null) return;

			var label = grid.querySelector(("#grid-label-" + (lines.orientation) + "-" + (value|0) + "-" + idx));
			if (!label) {
				label = document.createElement('label');
				label.id = "grid-label-" + (lines.orientation) + "-" + (value|0) + "-" + idx;
				label.classList.add('grid-label');
				label.classList.add(("grid-label-" + (lines.orientation)));
				label.setAttribute('data-value', value);
				label.setAttribute('for', ("grid-line-" + (lines.orientation)));
				label.setAttribute('title', axisTitles[i]);
				label.innerHTML = labels[i];
				grid.appendChild(label);
				if (lines.orientation === 'x') {
					label.style.left = offsets[i] + '%';
				}
				else {
					label.style.top = (100 - offsets[i]) + '%';
				}
			}

			if (within(value, linesMin, linesMax)) {
				label.removeAttribute('hidden');
			} else {
				label.setAttribute('hidden', true);
			}
		});

	}, this);

	this.emit('update');

	return this;
};
},{"events":1,"inherits":3,"insert-css":4,"is-browser":5,"mumath/closest":6,"mumath/lg":7,"mumath/order":8,"mumath/within":9,"xtend":11}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],5:[function(require,module,exports){
module.exports = true;
},{}],6:[function(require,module,exports){
/**
 * @module  mumath/closest
 */

module.exports = function closest (num, arr) {
	var curr = arr[0];
	var diff = Math.abs (num - curr);
	for (var val = 0; val < arr.length; val++) {
		var newdiff = Math.abs (num - arr[val]);
		if (newdiff < diff) {
			diff = newdiff;
			curr = arr[val];
		}
	}
	return curr;
}
},{}],7:[function(require,module,exports){
/**
 * Base 10 logarithm
 *
 * @module mumath/lg
 */
module.exports = require('./wrap')(function (a) {
	return Math.log(a) / Math.log(10);
});
},{"./wrap":10}],8:[function(require,module,exports){
/**
 * @module mumath/order
 */
module.exports = require('./wrap')(function (n) {
	n = Math.abs(n);
	var order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
	return Math.pow(10,order);
});
},{"./wrap":10}],9:[function(require,module,exports){
/**
 * Whether element is between left & right including
 *
 * @param {number} a
 * @param {number} left
 * @param {number} right
 *
 * @return {Boolean}
 */
module.exports = require('./wrap')(function(a, left, right){
	if (left > right) {
		var tmp = left;
		left = right;
		right = tmp;
	}
	if (a <= right && a >= left) return true;
	return false;
});
},{"./wrap":10}],10:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function (a) {
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],11:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],12:[function(require,module,exports){
// var test = require('tst');
var Grid = require('./');
var isBrowser = require('is-browser');

if (isBrowser) {
	document.body.style.margin = '0';
}


// test.only('linear', function () {
	var grid = Grid({
		viewport: function (w, h) {
			return [60, 20, w - 80, h - 80];
		},
		lines: [
			{
				min: 0,
				max: 100,
				orientation: 'x'
			},
			{
				min: 0,
				max: 100,
				orientation: 'y'
			}
		],

		axes: [
			true, {

			}
		]
	});

	window.addEventListener('resize', function () { return grid.update(); });
// });

// test.skip('logarithmic', function () {
// 	var grid = Grid({
// 		viewport: function (w, h) {
// 			return [60, 20, w - 80, h - 80];
// 		},
// 		lines: [
// 			{
// 				min: 20,
// 				max: 20000,
// 				orientation: 'x',
// 				logarithmic: true,
// 				titles: function (value) {
// 					return value >= 1000 ? ((value / 1000).toFixed(0) + 'k') : value;
// 				}
// 			},
// 			{
// 				min: -100,
// 				max: 0,
// 				orientation: 'y'
// 			},
// 			{
// 				min: 20,
// 				max: 20000,
// 				orientation: 'x',
// 				logarithmic: true,
// 				values: function (value) {
// 					if (value.toString()[0] !== '1') return null;
// 					return value;
// 				},
// 				style: {
// 					borderLeftStyle: 'solid'
// 				}
// 			},
// 		],
// 		axes: [
// 			{
// 				labels: function (value, i, opt) {
// 					if (value.toString()[0] !== '2' && value.toString()[0] !== '1' && value.toString()[0] !== '5') return null;
// 					return opt.titles[i];
// 				}
// 			},
// 			true
// 		]
// 	});

// 	window.addEventListener('resize', () => grid.update());
// });

// test('polar');

// test('node');

// test('perspective grid');

// test('points grid style');
},{"./":2,"is-browser":5}]},{},[12]);
