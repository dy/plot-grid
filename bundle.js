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
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
/**
 * @module  plot-grid
 */

var extend = require('xtend');
var isBrowser = require('is-browser');
var lg = require('mumath/lg');
var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var sf = 0;
var className = ((require('insert-css')("._85b6c6f3 {\r\n\tposition: relative;\r\n}\r\n\r\n/** Decorative elements repeat canvas’s size */\r\n._85b6c6f3 .grid {\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\tfont-family: sans-serif;\r\n}\r\n._85b6c6f3 .grid-line {\r\n\t/*opacity: .2;*/\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\twidth: 0;\r\n\theight: 0;\r\n\tcolor: rgba(127,127,127,.3);\r\n}\r\n._85b6c6f3 .grid-line[hidden] {\r\n\tdisplay: none;\r\n}\r\n/*.grid-line:after {\r\n\tcontent: attr(data-value);\r\n\tposition: absolute;\r\n\theight: 1rem;\r\n\tline-height: 1rem;\r\n\tfont-size: .8rem;\r\n    text-align: center;\r\n\twidth: 3rem;\r\n}*/\r\n\r\n._85b6c6f3 .grid-line-x {\r\n\tborder-left: 1px dotted;\r\n\tmargin-left: -1px;\r\n\theight: 100%;\r\n}\r\n\r\n._85b6c6f3 .grid-line-y {\r\n\tmargin-top: -1px;\r\n\tborder-bottom: 1px dotted;\r\n\twidth: 100%;\r\n\ttop: auto;\r\n}\r\n/*.grid-line-y:after {\r\n\ttext-align: right;\r\n\tleft: -3rem;\r\n\tmargin-left: -.1rem;\r\n\ttop: -0.5rem;\r\n}*/\r\n\r\n._85b6c6f3 .grid-axis {\r\n\tposition: absolute;\r\n}\r\n._85b6c6f3 .grid-axis-x {\r\n\ttop: auto;\r\n\tbottom: 0;\r\n\tright: 0;\r\n\tleft: 0;\r\n\tborder-bottom: 2px solid;\r\n\tmargin-bottom: -.5rem;\r\n}\r\n._85b6c6f3 .grid-axis-y {\r\n\tborder-left: 2px solid;\r\n\tright: auto;\r\n\ttop: 0;\r\n\tbottom: 0;\r\n\tleft: -1px;\r\n    margin-left: -.5rem;\r\n}\r\n\r\n._85b6c6f3 .grid-label {\r\n\tposition: absolute;\r\n\ttop: auto;\r\n\tleft: auto;\r\n\tmin-height: 1rem;\r\n\tfont-size: .8rem;\r\n}\r\n._85b6c6f3 .grid-label-x {\r\n\tbottom: auto;\r\n\ttop: 100%;\r\n\tmargin-top: 1.5rem;\r\n\twidth: 2rem;\r\n\tmargin-left: -1rem;\r\n\ttext-align: center;\r\n}\r\n._85b6c6f3 .grid-label-x:before {\r\n\tcontent: '';\r\n\tposition: absolute;\r\n\theight: .5rem;\r\n\twidth: 0;\r\n\tborder-left: 2px solid;\r\n\ttop: -1rem;\r\n\tmargin-left: -1px;\r\n\tmargin-top: -2px;\r\n\tleft: 1rem;\r\n}\r\n\r\n._85b6c6f3 .grid-label-y {\r\n    right: 100%;\r\n    margin-right: 1.5rem;\r\n    margin-top: -.5rem;\r\n}\r\n._85b6c6f3 .grid-label-y:before {\r\n\tcontent: '';\r\n\tposition: absolute;\r\n\twidth: .5rem;\r\n\theight: 0;\r\n\tborder-top: 2px solid;\r\n\tright: -1rem;\r\n\ttop: .4rem;\r\n\tmargin-right: -1px;\r\n}\r\n") || true) && "_85b6c6f3");
var closestNumber = require('mumath/closest');
var mag = require('mumath/order');
var within = require('mumath/within');


module.exports = Grid;


function Grid (options) {
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

	this.lines = (options.lines || []).map((lines) => extend(this.defaultLines, lines));
	this.axes = (options.axes || []).map((axis) => extend(this.defaultAxis, axis));

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
	min: 0,
	max: 100,
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
	this.lines.forEach(function (lines, i) {
		if (options.lines) lines = extend(this.lines[i], options.lines[i]);

		//detect steps, if not defined, as one per each 50px
		var values = lines.values;
		if (!values) {
			values = [];
			var intersteps = (lines.orientation === 'x' ? (typeof viewport[2] === 'number' ? viewport[2] : this.grid.clientWidth) : (typeof viewport[3] === 'number' ? viewport[3] : this.grid.clientHeight)) / 50;
			if (intersteps < 1) {
				values = [lines.min, lines.max];
			} else {
				var stepSize = Math.abs(lines.max - lines.min) / Math.floor(intersteps);
				var order = mag(stepSize);

				stepSize = closestNumber(stepSize, [1, 2, 2.5, 5, 10].map((v) => v * order));

				if (lines.min > lines.max) {
					for (var step = lines.max; step <= lines.min; step += stepSize) {
						values.push(step);
					}
				}
				else {
					for (var step = lines.min; step <= lines.max; step += stepSize) {
						values.push(step);
					}
				}
			}
		}

		//define titles
		var titles = lines.titles || values.slice().map(function (value) {
			return value.toLocaleString();
		});

		//draw lines
		values.forEach(function (value, i) {
			var line = grid.querySelector(`#grid-line-${lines.orientation}-${value|0}`);
			if (!line) {
				line = document.createElement('span');
				line.id = `grid-line-${lines.orientation}-${value|0}`;
				line.classList.add('grid-line');
				line.classList.add(`grid-line-${lines.orientation}`);
				line.setAttribute('data-value', value);
				line.setAttribute('title', titles[i]);
				grid.appendChild(line);
				var ratio = value / Math.abs(lines.max - lines.min);
				if (!lines.logarithmic) ratio *= 100;
				if (lines.min > lines.max) ratio = 100 - ratio;
				if (lines.orientation === 'x') {
					line.style.left = ratio + '%';
				}
				else {
					line.style.top = (100 - ratio) + '%';
				}
			}
			line.removeAttribute('hidden');
		});


		//draw axes
		var axis = this.axes[i];

		//do not paint inexisting axis
		if (!axis) return;

		if (options.axes) axis = extend(this.axes[i], options.axes[i]);

		//define values
		var axisValues = axis.values || values;

		//define titles
		var axisTitles = axis.titles || axisValues.slice().map(function (value) {
			return value.toLocaleString();
		});

		//define labels
		var labels = axis.labels || axisTitles;

		var min = axis.min != null ? axis.min : lines.min;
		var max = axis.max != null ? axis.max : lines.max;

		//put axis properly
		var axisEl = grid.querySelector(`#grid-axis-${lines.orientation}`);
		if (!axisEl) {
			axisEl = document.createElement('span');
			axisEl.id = `grid-axis-${lines.orientation}`;
			axisEl.classList.add('grid-axis');
			axisEl.classList.add(`grid-axis-${lines.orientation}`);
			axisEl.setAttribute('data-name', axis.name);
			axisEl.setAttribute('title', axis.name);
			grid.appendChild(axisEl);

			var minRatio = min / Math.abs(lines.max - lines.min);

			if (!lines.logarithmic) minRatio *= 100;
			if (axis.orientation === 'x') {
				axisEl.style.left = minRatio + '%';
			}
			else {
				axisEl.style.bottom = minRatio + '%';
			}

			var maxRatio = 1 - max / Math.abs(lines.max - lines.min);

			if (!lines.logarithmic) maxRatio *= 100;
			if (axis.orientation === 'x') {
				axisEl.style.right = maxRatio + '%';
			}
			else {
				axisEl.style.top = maxRatio + '%';
			}
		}
		axisEl.removeAttribute('hidden');

		//draw labels
		axisValues.forEach(function (value, i) {
			var label = grid.querySelector(`#grid-label-${lines.orientation}-${value|0}`);
			if (!label) {
				label = document.createElement('label');
				label.id = `grid-label-${lines.orientation}-${value|0}`;
				label.classList.add('grid-label');
				label.classList.add(`grid-label-${lines.orientation}`);
				label.setAttribute('data-value', value);
				label.setAttribute('for', `grid-line-${lines.orientation}`);
				label.setAttribute('title', axisTitles[i]);
				label.innerHTML = labels[i];
				grid.appendChild(label);

				var ratio = value / Math.abs(lines.max - lines.min);
				if (!lines.logarithmic) ratio *= 100;
				if (lines.min > lines.max) ratio = 100 - ratio;
				if (lines.orientation === 'x') {
					label.style.left = ratio + '%';
				}
				else {
					label.style.top = (100 - ratio) + '%';
				}
			}

			if (within(value, min, max)) {
				label.removeAttribute('hidden');
			} else {
				label.setAttribute('hidden', true);
			}
		});

	}, this);


	//detect decades
	// var decades = Math.round(lg(this.maxFrequency/this.minFrequency));
	// var decadeOffset = lg(this.minFrequency/10);

	//draw magnitude limits
	// var mRange = this.maxDecibels - this.minDecibels;
	// for (var m = this.minDecibels, i = 0; m <= this.maxDecibels; m += 10, i += 10) {
	// 	line = document.createElement('span');
	// 	line.classList.add('grid-line');
	// 	line.classList.add('grid-line-v');
	// 	if (!i) line.classList.add('grid-line-first');
	// 	line.setAttribute('data-value', m.toLocaleString());
	// 	line.style.bottom = 100 * i / mRange + '%';
	// 	this.grid.appendChild(line);
	// }
	// line.classList.add('grid-line-last');


	/** Map frequency to an x coord */
	// function f2w (f, w, logarithmic) {
	// 	if (logarithmic) {
	// 		var decadeW = w / decades;
	// 		return decadeW * (lg(f) - 1 - decadeOffset);
	// 	} else {
	// 		return
	// 	}
	// };


	/** Map x coord to a frequency */
	function w2f (x, w) {
		var decadeW = w / decades;
		return Math.pow(10, x/decadeW + 1 + decadeOffset);
	};

	this.emit('update');

	return this;
};
},{"events":1,"inherits":13,"insert-css":14,"is-browser":15,"mumath/closest":17,"mumath/lg":18,"mumath/order":19,"mumath/within":20,"xtend":28}],4:[function(require,module,exports){
(function (process){
'use strict';
var ESC = '\u001b[';
var x = module.exports;

x.cursorTo = function (x, y) {
	if (arguments.length === 0) {
		return ESC + 'H';
	}

	if (arguments.length === 1) {
		return ESC + (x + 1) + 'G';
	}

	return ESC + (y + 1) + ';' + (x + 1) + 'H';
};

x.cursorMove = function (x, y) {
	var ret = '';

	if (x < 0) {
		ret += ESC + (-x) + 'D';
	} else if (x > 0) {
		ret += ESC + x + 'C';
	}

	if (y < 0) {
		ret += ESC + (-y) + 'A';
	} else if (y > 0) {
		ret += ESC + y + 'B';
	}

	return ret;
};

x.cursorUp = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'A';
};

x.cursorDown = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'B';
};

x.cursorForward = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'C';
};

x.cursorBackward = function (count) {
	return ESC + (typeof count === 'number' ? count : 1) + 'D';
};

x.cursorLeft = ESC + '1000D';
x.cursorSavePosition = ESC + 's';
x.cursorRestorePosition = ESC + 'u';
x.cursorGetPosition = ESC + '6n';
x.cursorNextLine = ESC + 'E';
x.cursorPrevLine = ESC + 'F';
x.cursorHide = ESC + '?25l';
x.cursorShow = ESC + '?25h';

x.eraseLines = function (count) {
	var clear = '';

	for (var i = 0; i < count; i++) {
		clear += x.cursorLeft + x.eraseEndLine + (i < count - 1 ? x.cursorUp() : '');
	}

	return clear;
};

x.eraseEndLine = ESC + 'K';
x.eraseStartLine = ESC + '1K';
x.eraseLine = ESC + '2K';
x.eraseDown = ESC + 'J';
x.eraseUp = ESC + '1J';
x.eraseScreen = ESC + '2J';
x.scrollUp = ESC + 'S';
x.scrollDown = ESC + 'T';

x.clearScreen = '\u001bc';
x.beep = '\u0007';

x.image = function (buf, opts) {
	opts = opts || {};

	var ret = '\u001b]1337;File=inline=1';

	if (opts.width) {
		ret += ';width=' + opts.width;
	}

	if (opts.height) {
		ret += ';height=' + opts.height;
	}

	if (opts.preserveAspectRatio === false) {
		ret += ';preserveAspectRatio=0';
	}

	return ret + ':' + buf.toString('base64') + '\u0007';
};

x.iTerm = {};

x.iTerm.setCwd = function (cwd) {
	return '\u001b]50;CurrentDir=' + (cwd || process.cwd()) + '\u0007';
};

}).call(this,require('_process'))
},{"_process":2}],5:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],6:[function(require,module,exports){
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{}],7:[function(require,module,exports){
(function (process){
'use strict';
var escapeStringRegexp = require('escape-string-regexp');
var ansiStyles = require('ansi-styles');
var stripAnsi = require('strip-ansi');
var hasAnsi = require('has-ansi');
var supportsColor = require('supports-color');
var defineProps = Object.defineProperties;
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

function Chalk(options) {
	// detect mode if not set manually
	this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
}

// use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001b[94m';
}

var styles = (function () {
	var ret = {};

	Object.keys(ansiStyles).forEach(function (key) {
		ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

		ret[key] = {
			get: function () {
				return build.call(this, this._styles.concat(key));
			}
		};
	});

	return ret;
})();

var proto = defineProps(function chalk() {}, styles);

function build(_styles) {
	var builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder.enabled = this.enabled;
	// __proto__ is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	/* eslint-disable no-proto */
	builder.__proto__ = proto;

	return builder;
}

function applyStyle() {
	// support varags, but simply cast to string in case there's only one arg
	var args = arguments;
	var argsLen = args.length;
	var str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// don't slice `arguments`, it prevents v8 optimizations
		for (var a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || !str) {
		return str;
	}

	var nestedStyles = this._styles;
	var i = nestedStyles.length;

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	var originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
		ansiStyles.dim.open = '';
	}

	while (i--) {
		var code = ansiStyles[nestedStyles[i]];

		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;
	}

	// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
	ansiStyles.dim.open = originalDim;

	return str;
}

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				return build.call(this, [name]);
			}
		};
	});

	return ret;
}

defineProps(Chalk.prototype, init());

module.exports = new Chalk();
module.exports.styles = ansiStyles;
module.exports.hasColor = hasAnsi;
module.exports.stripColor = stripAnsi;
module.exports.supportsColor = supportsColor;

}).call(this,require('_process'))
},{"_process":2,"ansi-styles":6,"escape-string-regexp":10,"has-ansi":12,"strip-ansi":25,"supports-color":26}],8:[function(require,module,exports){
(function (process){
'use strict';
var restoreCursor = require('restore-cursor');
var hidden = false;

exports.show = function () {
	hidden = false;
	process.stdout.write('\u001b[?25h');
};

exports.hide = function () {
	restoreCursor();
	hidden = true;
	process.stdout.write('\u001b[?25l');
};

exports.toggle = function (force) {
	if (force !== undefined) {
		hidden = force;
	}

	if (hidden) {
		exports.show();
	} else {
		exports.hide();
	}
};

}).call(this,require('_process'))
},{"_process":2,"restore-cursor":24}],9:[function(require,module,exports){
(function (process){
'use strict';

var frames = process.platform === 'win32' ?
	['-', '\\', '|', '/'] :
	['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

module.exports = function () {
	var i = 0;

	return function () {
		return frames[i = ++i % frames.length];
	};
};

module.exports.frames = frames;

}).call(this,require('_process'))
},{"_process":2}],10:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],11:[function(require,module,exports){
(function (process){
'use strict';

var cbs = [];
var called = false;

function exit(exit, signal) {
	if (called) {
		return;
	}

	called = true;

	cbs.forEach(function (el) {
		el();
	});

	if (exit === true) {
		process.exit(128 + signal);
	}
};

module.exports = function (cb) {
	cbs.push(cb);

	if (cbs.length === 1) {
		process.once('exit', exit);
		process.once('SIGINT', exit.bind(null, true, 2));
		process.once('SIGTERM', exit.bind(null, true, 15));
	}
};

}).call(this,require('_process'))
},{"_process":2}],12:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex');
var re = new RegExp(ansiRegex().source); // remove the `g` flag
module.exports = re.test.bind(re);

},{"ansi-regex":5}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
module.exports = true;
},{}],16:[function(require,module,exports){
(function (process){
'use strict';
var ansiEscapes = require('ansi-escapes');
var cliCursor = require('cli-cursor');

function main(stream) {
	var prevLineCount = 0;

	var render = function () {
		cliCursor.hide();
		var out = [].join.call(arguments, ' ') + '\n';
		stream.write(ansiEscapes.eraseLines(prevLineCount) + out);
		prevLineCount = out.split('\n').length;
	};

	render.clear = function () {
		stream.write(ansiEscapes.eraseLines(prevLineCount));
		prevLineCount = 0;
	};

	render.done = function () {
		prevLineCount = 0;
		cliCursor.show();
	};

	return render;
}

module.exports = main(process.stdout);
module.exports.stderr = main(process.stderr);
module.exports.create = main;

}).call(this,require('_process'))
},{"_process":2,"ansi-escapes":4,"cli-cursor":8}],17:[function(require,module,exports){
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
},{}],18:[function(require,module,exports){
/**
 * Base 10 logarithm
 *
 * @module mumath/lg
 */
module.exports = require('./wrap')(function (a) {
	return Math.log(a) / Math.log(10);
});
},{"./wrap":21}],19:[function(require,module,exports){
/**
 * @module mumath/order
 */
module.exports = require('./wrap')(function (n) {
	n = Math.abs(n);
	var order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
	return Math.pow(10,order);
});
},{"./wrap":21}],20:[function(require,module,exports){
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
},{"./wrap":21}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
'use strict';
module.exports = function (fn, errMsg) {
	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}

	var ret;
	var called = false;
	var fnName = fn.displayName || fn.name || (/function ([^\(]+)/.exec(fn.toString()) || [])[1];

	var onetime = function () {
		if (called) {
			if (errMsg === true) {
				fnName = fnName ? fnName + '()' : 'Function';
				throw new Error(fnName + ' can only be called once.');
			}

			return ret;
		}

		called = true;
		ret = fn.apply(this, arguments);
		fn = null;

		return ret;
	};

	onetime.displayName = fnName;

	return onetime;
};

},{}],23:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))
},{"_process":2}],24:[function(require,module,exports){
(function (process){
'use strict';
var onetime = require('onetime');
var exitHook = require('exit-hook');

module.exports = onetime(function () {
	exitHook(function () {
		process.stdout.write('\u001b[?25h');
	});
});

}).call(this,require('_process'))
},{"_process":2,"exit-hook":11,"onetime":22}],25:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":5}],26:[function(require,module,exports){
(function (process){
'use strict';
var argv = process.argv;

var terminator = argv.indexOf('--');
var hasFlag = function (flag) {
	flag = '--' + flag;
	var pos = argv.indexOf(flag);
	return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
};

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return false;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

}).call(this,require('_process'))
},{"_process":2}],27:[function(require,module,exports){
(function (process){
/**
 * Simple node/browser test runner
 *
 * @module tst
 */

var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');
var elegantSpinner = require('elegant-spinner');
var logUpdate = require('log-update');
var ansi = require('ansi-escapes');
var inherits = require('inherits');
var Emitter = require('events');
var extend = require('xtend/mutable');


// Error.stackTraceLimit = 10;


//default indentation
test.INDENT = '  ';

//whether we run the only test, forcefully
test.ONLY_MODE = false;

//default timeout for async tests
test.TIMEOUT = 2000;

//max timeout
test.MAX_TIMEOUT = 10e5;

//chain of nested test calls
var tests = [];
var testCount = 0;

//planned tests to run
var testQueue = [];

//flag indicating that since some time tests are run in deferred fashion
//i.e. lost their stack in browser :(
var DEFERRED = false;

//indicate whether we are in only-detection mode (tests are just planned, not run)
//or we are in a forced full-bundle run. Unlikely user will ever touch this flag.
test.DETECT_ONLY = true;

//detect whether at least one test failed
test.ERROR = false;


//end with error, if any
process.on('exit', function () {
    if (test.ERROR) process.exit(1);
});


//run execution after all sync tests are registered
if (test.DETECT_ONLY) {
    setTimeout(function () {
        //if only detection mode wasn’t changed by user
        //which means sync tests are run already - run the thing
        if (test.DETECT_ONLY) {
            run();
        }
    });
}


/**
 * Test enqueuer
 */
function test (message, fn, only) {
    //if run in exclusive mode - allow only `test.only` calls
    if (test.ONLY_MODE && !only) {
        //but if test is run within the parent - allow it
        if (!tests.length) return test;
    }

    //ignore bad args
    if (!message) return test;

    //init test object params
    var testObj = new Test({
        id: testCount++,
        title: message,

        //pending, success, error, group
        status: null,

        //test function
        fn: fn,

        //nested tests
        children: [],

        //whether test should be resolved
        async: undefined,

        //whether the test is last child within the group
        last: false,

        //timeout for the async
        _timeout: test.TIMEOUT,

        //whether the test is the only to run (launched via .only method)
        only: !!only,

        //whether the test was started in deferred fashion
        //it can be sync, but launched after async
        deferred: DEFERRED
    });

    //handle args
    if (!fn) {
        //if only message passed - do skip
        if (!fn && typeof message === 'string') {
            testObj.status = 'skip';
        }
        else {
            //detect test name
            testObj.fn = message;
            message = message.name;
            if (!message) message = 'Test #' + testObj.id;

            //update test title
            testObj.title = message;
        }
    }

    //detect async as at least one function argument
    //NOTE: tests returning promise will set async flag here
    if (testObj.async == null) {
        testObj.async = !!(testObj.fn && testObj.fn.length);
    }

    //also detect promise, if passed one
    if (testObj.fn && testObj.fn.then) {
        //also that means that the test is run already
        //and tests within the promise executor are already detected it’s parent wrongly
        //nothing we can do. Redefining parent is not an option -
        //we don’t know which tests were of this parent, which were not.
        testObj.promise = testObj.fn;
        testObj.async = true;
        testObj.time = now();
    }

    //nested tests are detected here
    //because calls to `.test` from children happen only when some test is active
    testObj.parent = tests[tests.length - 1];

    //register children - supposed that parent will run all the children after fin
    if (testObj.parent) {
        testObj.parent.children.push(testObj);
    }
    //if test has no parent - plan it's separate run
    else {
        testQueue.push(testObj);
    }

    //if detecion only mode - ignore execution
    //if ONLY_MODE - execute it at instant
    if (!test.DETECT_ONLY || test.ONLY_MODE) {
        run();
    }

    return testObj;
}

/**
 * Tests queue runner
 */
var currentTest;
function run () {
    //ignore active run
    if (currentTest) return;

    //get the planned test
    currentTest = testQueue.shift();

    //if the queue is empty - return
    if (!currentTest) return;

    //ignore test if it is not the only run
    if (test.ONLY_MODE && !currentTest.only) {
        return planRun();
    }

    //exec it, the promise will be formed
    currentTest.exec();

    //at the moment test is run, we know all it’s children
    //push all the children to the queue, after the current test
    //FIXME: this guy erases good stacktrace :< Maybe call asyncs last?
    var children = currentTest.children;

    //mind the case if no only children test is selected - run them all instead of none
    if (children.every(function (child) {return !child.only})) {
        children.forEach(function (child) {
            child.only = true;
        });
    }

    for (var i = children.length; i--;){
        testQueue.unshift(children[i]);
    }

    //mark last kid
    if (children.length) {
        children[children.length - 1].last = true;
    }

    //if test is not async - run results at instant to avoid losing stacktrace
    if (!currentTest.async) {
        currentTest = null;
        run();
    }
    //plan running next test after the promise
    else {
        DEFERRED = true;
        currentTest.promise.then(planRun, planRun);
    }

    function planRun () {
        currentTest = null;
        run();
    }
}



/**
 * A test object constructor
 */
function Test (opts) {
    extend(this, opts);
}

inherits(Test, Emitter);


/**
 * Call before exec
 */
Test.prototype.after = function (cb) {
    this.once('after', cb);
    return this;
};

/**
 * Call after exec
 */
Test.prototype.before = function (cb) {
    this.once('before', cb);
    return this;
};

/**
 * Bind promise-like
 */
Test.prototype.then = function (resolve, reject) {
    this.once('success', resolve);
    this.once('error', reject);
    return this;
};

/**
 * Mocha-compat timeout setter
 */
Test.prototype.timeout = function (value) {
    if (value == null) return this._timeout;
    if (value === false) this._timeout = test.MAX_TIMEOUT;
    else if (value === Infinity) this._timeout = test.MAX_TIMEOUT;
    else this._timeout = value;
    return this;
}

/**
 * Prototype props
 *
 * @True {[type]}
 */
extend(Test.prototype, {
    id: testCount,
    title: 'Undefined test',

    //pending, success, error, group
    status: null,

    //test function
    fn: null,

    //nested tests
    children: [],

    //whether test should be resolved
    async: undefined,

    //whether the test is last child within the group
    last: false,

    //timeout for the async
    _timeout: test.TIMEOUT,

    //whether the test is the only to run (launched via .only method)
    only: false,

    //whether the test was started in deferred fashion
    //it can be sync, but launched after async
    deferred: DEFERRED
});

/**
 * Execute main test function
 */
Test.prototype.exec = function () {
    var self = this;

    //ignore skipping test
    if (self.status === 'skip') {
        self.promise = Promise.resolve();
        self.print();
        return self;
    }

    //save test to the chain
    tests.push(self);

    //display title of the test
    self.printTitle();

    //timeout promise timeout id
    var toId;

    //prepare test
    self.emit('before');

    //exec sync test
    if (!self.async) {
        self.promise = Promise.resolve();

        var time;
        try {

            self.time = now();
            var result = self.fn.call(self);
            time = now() - self.time;

        } catch (e) {
            self.fail(e);
        }

        //if the result is promise - whoops, we need to run async
        if (result && result.then) {
            self.async = true;
            self.promise = result;
            //FIXME: this guy violates the order of nesting
            //because so far it was thought as sync
            self.execAsync();
        }

        //if result is not error - do finish
        else {
            self.time = time;
            self.emit('after');

            if (!self.error) {
                if (!self.status !== 'group') self.status = 'success';

                self.emit('success');
                self.print();
            }
        }

    }
    else {
        self.execAsync();
    }

    //after promise’s executor, but before promise then’s
    //so user can’t create tests asynchronously, they should be created at once
    tests.pop();

    return self;
};


/*
 * Exec async test - it should be run in promise
 * sorry about the stacktrace, nothing I can do...
 */
Test.prototype.execAsync = function () {
    var self = this;

    //if promise is already created (by user) - race with timeout
    //FIXME: add time measure
    if (self.promise) {
        self.promise = Promise.race([
            self.promise,
            new Promise(execTimeout)
        ]);
    }
    //else - invoke function
    else {
        self.promise = Promise.race([
            new Promise(function (resolve, reject) {
                self.status = 'pending';
                self.time = now();
                return self.fn.call(self, resolve);
            }),
            new Promise(execTimeout)
        ])
    }

    self.promise.then(function () {
        self.time = now() - self.time;

        clearTimeout(toId);
        if (self.status !== 'group') self.status = 'success';

        self.emit('after');
        self.emit('success');

        self.print();
    }, function (e) {
        self.fail(e)
    });

    function execTimeout (resolve, reject) {
        toId = setTimeout(function () {
            reject(new Error('Timeout ' + self._timeout + 'ms reached. Please fix the test or set `this.timeout(' + (self._timeout + 1000) + ');`.'));
        }, self._timeout);
    }
};


/**
 * Resolve to error (error handler)
 */
Test.prototype.fail = function (e) {
    var self = this;

    if (typeof e !== 'object') e = Error(e);

    //grab stack (the most actual is here, further is mystically lost)
    self.stack = e.stack;

    //set flag that bundle is failed
    test.ERROR = true;

    var parent = self.parent;
    while (parent) {
        parent.status = 'group';
        parent = parent.parent;
    }

    //update test status
    self.status = 'error';
    self.error = e;

    self.emit('fail', e);

    self.print();
};


Test.prototype.printTitle = function () {
    var self = this;

    if (!isBrowser) {
        var frame = elegantSpinner();

        //print title (indicator of started, now current test)
        updateTitle();
        self.titleInterval = setInterval(updateTitle, 50);

        //update title frame
        function updateTitle () {
            //FIXME: this is the most undestructive for logs way of rendering, but crappy
            process.stdout.write(ansi.cursorLeft);
            process.stdout.write(ansi.eraseEndLine);
            process.stdout.write(chalk.white(indent(self) + ' ' + frame() + ' ' + self.title) + test.INDENT);
            // logUpdate(chalk.white(indent(test.indent) + ' ' + frame() + ' ' + test.title));
        }
    }
}
//clear printed title (node)
Test.prototype.clearTitle = function () {
    if (!isBrowser && this.titleInterval) {
        clearInterval(this.titleInterval);
        process.stdout.write(ansi.cursorLeft);
        process.stdout.write(ansi.eraseEndLine);
    }
}

//universal printer dependent on resolved test
Test.prototype.print = function () {
    var self = this;

    this.clearTitle();

    var single = self.children && self.children.length ? false : true;

    if (self.status === 'error') {
        self.printError();
    }
    else if (self.status === 'group') {
        self.printGroup(single);
    }
    else if (self.status === 'success') {
        self.printSuccess(single);
    }
    else if (self.status === 'skip') {
        self.printSkip(single);
    }

    //last child should close parent’s group in browser
    if (self.last) {
        if (isBrowser) {
            //if truly last - create as many groups as many last parents
            if (!self.children.length) {
                console.groupEnd();
                var parent = self.parent;
                while (parent && parent.last) {
                    console.groupEnd();
                    parent = parent.parent;
                }
            }
        } else {
            //create padding
            if (!self.children.length) console.log();
        }
    }
}

//print pure red error
Test.prototype.printError = function () {
    var self = this;

    //browser shows errors better
    if (isBrowser) {
        console.group('%c× ' + self.title, 'color: red; font-weight: normal');
        if (self.error) {
            if (self.error.name === 'AssertionError') {
                if (typeof self.error.expected !== 'object') {
                    var msg = '%cAssertionError:\n%c' + self.error.expected + '\n' + '%c' + self.error.operator + '\n' + '%c' + self.error.actual;
                    console.groupCollapsed(msg, 'color: red; font-weight: normal', 'color: green; font-weight: normal', 'color: gray; font-weight: normal', 'color: red; font-weight: normal');
                }
                else {
                    var msg = '%cAssertionError: ' + self.error.message;
                    console.groupCollapsed(msg, 'color: red; font-weight: normal');
                }
                console.error(self.stack);
                console.groupEnd();
            }
            else {
                var msg = typeof self.error === 'string' ? self.error : self.error.message;
                console.groupCollapsed('%c' + msg, 'color: red; font-weight: normal');
                console.error(self.stack);
                console.groupEnd();
            }
        }
        console.groupEnd();
    }
    else {
        console.log(chalk.red(indent(self) + ' × ') + chalk.red(self.title));

        if (self.error.stack) {
            if (self.error.name === 'AssertionError') {
                console.error(chalk.gray('AssertionError: ') + chalk.green(self.error.expected) + '\n' + chalk.gray(self.error.operator) + '\n' + chalk.red(self.error.actual));
            } else {
                //NOTE: node prints e.stack along with e.message
                var stack = self.error.stack.replace(/^\s*/gm, indent(self) + '   ');
                console.error(chalk.gray(stack));
            }
        }
    }
}

//print green success
Test.prototype.printSuccess = function (single) {
    var self = this;

    if (isBrowser) {
        if (single) {
            console.log('%c√ ' + self.title + '%c  ' + self.time.toFixed(2) + 'ms', 'color: green; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
        } else {
            self.printGroup();
        }
    }
    else {
        if (!single) {
            self.printGroup();
        }
        else {
            console.log(chalk.green(indent(self) + ' √ ') + chalk.green.dim(self.title) + chalk.gray(' ' + self.time.toFixed(2) + 'ms'));
        }
    }
}

//print yellow warning (not all tests are passed or it is container)
Test.prototype.printGroup = function () {
    var self = this;

    if (isBrowser) {
        console.group('%c+ ' + self.title + '%c  ' + self.time.toFixed(2) + 'ms', 'color: orange; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log();
        console.log(indent(self) +' ' + chalk.yellow('+') + ' ' + chalk.yellow(self.title) + chalk.gray(' ' + self.time.toFixed(2) + 'ms'));
    }
}

//print blue skip
Test.prototype.printSkip = function (single) {
    var self = this;

    if (isBrowser) {
        console[single ? 'log' : 'group']('%c- ' + self.title, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent(self) + ' - ') + chalk.cyan.dim(self.title));
    }
}


//return indentation of for a test, based on nestedness
function indent (testObj) {
    var parent = testObj.parent;
    var str = '';
    while (parent) {
        str += test.INDENT;
        parent = parent.parent;
    }
    return str;
}




//skip alias
test.skip = function skip (message) {
   return test(message);
};

//only alias
test.only = function only (message, fn) {
    //indicate that only is detected, except for the case of intentional run
    if (fn) test.DETECT_ONLY = false;
    //change only mode to true
    test.ONLY_MODE = true;

    var result = test(message, fn, true);
    return result;
}

//more obvious chain
test.test = test;


module.exports = test;
}).call(this,require('_process'))
},{"_process":2,"ansi-escapes":4,"chalk":7,"elegant-spinner":9,"events":1,"inherits":13,"is-browser":15,"log-update":16,"performance-now":23,"xtend/mutable":29}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],30:[function(require,module,exports){
var test = require('tst');
var Grid = require('./');
var isBrowser = require('is-browser');

if (isBrowser) {
	document.body.style.margin = '0';
}


test('linear', function () {
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

	window.addEventListener('resize', () => grid.update());
});

test.skip('logarithmic', function () {

});

test('polar');

test('node');

test('perspective grid');

test('points grid style');
},{"./":3,"is-browser":15,"tst":27}]},{},[30]);
