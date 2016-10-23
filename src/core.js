/**
 * Abstract plot-grid class, with no specific renderer
 *
 * @module  plot-grid/src/core
 */

'use strict';

const Component = require('gl-component');
const inherits = require('inherits');
const isBrowser = require('is-browser');
const extend = require('just-extend');
// const range = require('just-range');
const pick = require('just-pick');
const magOrder = require('mumath/order');
const clamp = require('mumath/clamp');
const lg = require('mumath/log10');
const isMultiple = require('mumath/is-multiple');
const pretty = require('mumath/pretty');
const panzoom = require('pan-zoom');
const alpha = require('color-alpha');
const almost = require('almost-equal');

module.exports = Grid;


inherits(Grid, Component);


//constructor
function Grid (opts) {
	if (!(this instanceof Grid)) return new Grid(opts);

	if (!isBrowser) return;

	Component.call(this, extend(pick(this, [
		'container', 'viewport', 'context', 'autostart'
	]), opts));

	//set default coords as xy
	if (opts.r == null && opts.a == null && opts.y == null && opts.x == null) {
		opts.x = true;
		opts.y = true;
	}

	//create x/y/r
	this.x = extend({}, Grid.prototype.x, opts.x);
	this.y = extend({}, Grid.prototype.y, opts.y);
	this.r = extend({}, Grid.prototype.r, opts.r);
	this.a = extend({}, Grid.prototype.a, opts.a);

	this.update(opts);


	//enable interactions
	if ((this.pan || this.zoom) && this.container && this.canvas) {
		panzoom(this.canvas, (dx, dy, x, y) => {
			this.pan && this.pan(dx, dy, x, y);
		}, (dx, dy, x, y) => {
			this.zoom && this.zoom(dx, dy, x, y);
		}, {
		});
	}
}


//default pan/zoom handlers
//TODO: check if interaction happens within actual viewport
Grid.prototype.pan = function (dx, dy, x, y) {
	let vp = this.viewport;

	if (!this.x.disable && this.x.pan) this.x.offset -= this.x.scale * dx;
	if (!this.y.disable && this.y.pan) this.y.offset += this.y.scale * dy;

	this.render();

	return this;
};
Grid.prototype.zoom = function (dx, dy, x, y) {
	let [left, top, width, height] = this.viewport;

	if (x==null) x = left + width/2;
	if (y==null) y = top + height/2;

	let oX = this.x && this.x.origin || 0;
	let oY = this.y && this.y.origin || 0;

	//shift start
	let tx = (x-left)/width - oX, ty = oY-(y-top)/height;
	let amt = clamp(-dy, -height*.75, height*.75)/height;

	if (!this.x.disable) {
		let prevScale = this.x.scale;
		this.x.scale *= (1 - amt);
		this.x.scale = Math.max(this.x.scale, this.x.minScale);
		this.x.offset -= width*(this.x.scale - prevScale) * tx;
	}

	if (!this.y.disable) {
		let prevScale = this.y.scale;
		this.y.scale *= (1 - amt);
		this.y.scale = Math.max(this.y.scale, this.x.minScale);
		this.y.offset -= height*(this.y.scale - prevScale) * ty;
	}

	this.render();

	return this;
};


//re-evaluate lines, calc options for renderer
Grid.prototype.update = function (opts) {
	opts = opts || {};

	//disable lines
	if (opts.x !== undefined) this.x.disable = !opts.x;
	if (opts.y !== undefined) this.y.disable = !opts.y;
	if (opts.r !== undefined) this.r.disable = !opts.r;
	if (opts.a !== undefined) this.a.disable = !opts.a;


	//extend props
	if (opts.x) extend(this.x, opts.x);
	if (opts.y) extend(this.y, opts.y);
	if (opts.r) extend(this.r, opts.r);
	if (opts.a) extend(this.a, opts.a);

	//normalize limits
	// this.normalize();

	this.emit('update', opts);

	this.clear();
	this.render();

	return this;
}


//get state object with calculated params, ready for rendering
Grid.prototype.calcLines = function (lines, vp) {
	let state = {
		lines: lines,
		viewport: vp,
		grid: this,
		step: getStep(lines.distance * lines.scale, lines.steps),
	};

	//calculate real offset/range
	state.range = lines.getRange(state);
	state.offset = lines.offset - state.range * clamp(lines.origin, 0, 1);

	//calc axis/style
	state.axisOrigin = typeof lines.axis === 'number' ? lines.axis : 0;

	state.axisColor = lines.axisColor || lines.color;
	state.axisWidth = lines.axisWidth || lines.lineWidth;
	state.lineWidth = lines.lineWidth;
	state.labelColor = state.axisColor;
	state.font = lines.font;


	//get lines stops
	let values;
	if (lines.lines instanceof Function) {
		values = lines.lines(state);
	}
	else if (Array.isArray(lines.lines)) {
		values = lines.lines;
	}
	else if (!lines.lines) {
		//TODO: collect values from labels/ticks/coords mb?
	}
	state.values = values;

	//calc colors
	let colors;
	if (lines.lineColor instanceof Function) {
		colors = lines.lineColor(state);
	}
	else {
		colors = state.lines.lineColor || state.lines.color;
	}
	state.colors = colors;

	//calc ticks
	let ticks;
	if (lines.ticks instanceof Function) {
		ticks = lines.ticks(state);
	}
	else {
		ticks = lines.ticks;
	}
	state.ticks = ticks;

	//calc labels
	let labels;
	if (lines.labels instanceof Function) {
		labels = lines.labels(state);
	}
	else {
		labels = lines.labels;
	}
	state.labels = labels;

	return state;
};



//default values
Grid.prototype.defaults = {
	name: '',
	units: '',

	//visible range params
	min: -Infinity,
	max: Infinity,
	offset: 0,
	origin: .5,
	scale: 1,
	minScale: Number.EPSILON || 1.19209290e-7,
	zoom: true,
	pan: true,

	//lines params
	font: '10pt sans-serif',
	color: 'rgb(0,0,0)',
	style: 'lines',
	disable: true,
	steps: [1, 2, 5],
	log: false,
	distance: 15,
	lines: state => {
		let step = state.step;

		return range( Math.floor(state.offset/step)*step, Math.ceil((state.offset + state.range)/step)*step, step);
	},
	lineWidth: 1,
	lineColor: state => {
		if (!state.values) return;
		let {lines} = state;

		let light = alpha(lines.color, .1);
		let heavy = alpha(lines.color, .4);

		let step = state.step;
		let power = Math.ceil(lg(step));
		let tenStep = Math.pow(10,power);
		let nextStep = Math.pow(10,power+1);
		let eps = step/10;
		return state.values.map(v => {
			if (isMultiple(v, nextStep, eps)) return heavy;
			if (isMultiple(v, tenStep, eps)) return light;
			return null;
		});
	},

	//axis params
	axis: 0,
	axisWidth: 2,
	axisColor: null,

	ticks: state => {
		if (!state.values) return;
		let {lines} = state;

		let step = getStep(getStep(state.step, lines.steps), lines.steps);
		let eps = step/10;
		let tickWidth = state.axisWidth*2;
		return state.values.map(v => {
			if (!isMultiple(v, step, eps)) return null;
			if (almost(v, 0, eps)) return null;
			return tickWidth;
		});
	},
	labels: state => {
		if (!state.values) return;
		let {lines} = state;

		let step = getStep(getStep(state.step, lines.steps), lines.steps);
		let precision = clamp(-Math.floor(lg(step)), 20, 0);
		let eps = step/10;
		return state.values.map(v => {
			if (!isMultiple(v, step, eps)) return null;
			if (almost(v, 0, eps)) return lines.orientation === 'y' ? null : '0';
			// console.log(v, pretty(v))
			return v.toFixed(precision) + lines.units
		});
	},

	//stub methods
	//return coords for the values, redefined by axes
	getCoords: (values, state) => [0,0,0,0],

	//return 0..1 ratio based on value/offset/range, redefined by axes
	getRatio: (value, state) => 0
};



Grid.prototype.x = extend({}, Grid.prototype.defaults, {
	orientation: 'x',
	getCoords: (values, state) => {
		let coords = [];
		for (let i = 0; i < values.length; i++) {
			let t = state.lines.getRatio(values[i], state);
			coords.push(t);
			coords.push(0);
			coords.push(t);
			coords.push(1);
		}
		return coords;
	},
	getRange: state => {
		return state.viewport[2] * state.lines.scale;
	},
	getRatio: (value, state) => {
		return (value - state.offset) / state.range
	}
});
Grid.prototype.y = extend({}, Grid.prototype.defaults, {
	orientation: 'y',
	getCoords: (values, state) => {
		let coords = [];
		for (let i = 0; i < values.length; i++) {
			let t = state.lines.getRatio(values[i], state);
			coords.push(0);
			coords.push(t);
			coords.push(1);
			coords.push(t);
		}
		return coords;
	},
	getRange: state => {
		return state.viewport[3] * state.lines.scale;
	},
	getRatio: (value, state) => {
		return 1 - (value - state.offset) / state.range
	}
});
Grid.prototype.r = extend({}, Grid.prototype.defaults, {
	orientation: 'r'
});
Grid.prototype.a = extend({}, Grid.prototype.defaults, {
	orientation: 'a'
});



//lil helper
//FIXME: replace with just-range
function range(start, stop, step) {
  if (stop == null) {
    stop = start || 0;
    start = 0;
  }
  if (step == null) {
    step = stop > start ? 1 : -1;
  }
  var toReturn = [];
  var right = start < stop;
  for (; right ? start < stop : start > stop; start += step) {
    toReturn.push(start);
  }
  return toReturn;
}


//get closest appropriate step from the list
//FIXME: move to mumath, but implement log first maybe?
function getStep (minStep, srcSteps) {
	let power = Math.floor(lg(minStep));

	let order = Math.pow(10, power);
	let steps = srcSteps.map(v => v*order);
	order = Math.pow(10, power+1);
	steps = steps.concat(srcSteps.map(v => v*order));

	//find closest scale
	let step = 0;
	for (let i = 0; i < steps.length; i++) {
		step = steps[i];
		if (step > minStep) break;
	}

	return step;
}

