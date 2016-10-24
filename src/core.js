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
const range = require('just-range');
const pick = require('just-pick');
const clamp = require('mumath/clamp');
const lg = require('mumath/log10');
const isMultiple = require('mumath/is-multiple');
const pretty = require('mumath/pretty');
const panzoom = require('pan-zoom');
const alpha = require('color-alpha');
const almost = require('almost-equal');
const isObj = require('is-plain-obj');
const getStep = require('mumath/scale');

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
	if (!this.x.disable && this.x.pan) {
		this.x.offset -= this.x.scale * dx;
		this.x.offset = clamp(this.x.offset, this.x.min, this.x.max);
	}
	if (!this.y.disable && this.y.pan) {
		this.y.offset += this.y.scale * dy;
		this.y.offset = clamp(this.y.offset, this.y.min, this.y.max);
	}

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
	let amt = clamp(-dy, -height*.75, height*.75)/height;

	if (this.x.zoom !== false) {
		let tx = (x-left)/width - oX;
		let prevScale = this.x.scale;
		this.x.scale *= (1 - amt);
		this.x.scale = clamp(this.x.scale, this.x.minScale, this.x.maxScale);
		this.x.offset -= width*(this.x.scale - prevScale) * tx;
	}

	if (this.y.zoom !== false) {
		let ty = oY-(y-top)/height;
		let prevScale = this.y.scale;
		this.y.scale *= (1 - amt);
		this.y.scale = clamp(this.y.scale, this.y.minScale, this.y.maxScale);
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
		minStep: getStep(lines.distance * lines.scale, lines.steps),
	};

	//calculate real offset/range
	state.range = lines.getRange(state);
	state.offset = clamp(
		lines.offset - state.range * clamp(lines.origin, 0, 1),
		lines.min, lines.max - state.range
	);

	//calc axis/style
	state.axisOrigin = typeof lines.axis === 'number' ? lines.axis : 0;

	state.axisColor = lines.axisColor || lines.color;
	state.axisWidth = lines.axisWidth || lines.lineWidth;
	state.lineWidth = lines.lineWidth;
	state.tickAlign = lines.tickAlign;
	state.labelColor = state.axisColor;
	state.font = lines.font;

	//get lines stops
	let values;
	if (lines.lines instanceof Function) {
		values = lines.lines(state);
	}
	else {
		values = lines.lines || [];
	}
	state.values = values;

	//calc colors
	let colors;
	if (lines.lineColor instanceof Function) {
		colors = lines.lineColor(state);
	}
	else {
		let color = typeof lines.lineColor === 'string' ? lines.lineColor : lines.color;
		colors = Array(values.length).fill(color);
	}
	state.colors = colors;

	//calc ticks
	let ticks;
	if (lines.ticks instanceof Function) {
		ticks = lines.ticks(state);
	}
	else if (Array.isArray(lines.ticks)) {
		ticks = lines.ticks;
	}
	else {
		let tick = (lines.ticks === true || lines.ticks === true) ? state.axisWidth*2 : lines.ticks || 0;
		ticks = Array(values.length).fill(tick);
	}
	state.ticks = ticks;

	//calc labels
	let labels;
	if (lines.labels === true) lines.labels = Grid.prototype.defaults.labels;
	if (lines.labels instanceof Function) {
		labels = lines.labels(state);
	}
	else if (Array.isArray(lines.labels)) {
		labels = lines.labels;
	}
	else {
		labels = Array(values.length).fill(null);
	}
	state.labels = labels;

	//convert hashmap ticks/labels to values + colors
	if (isObj(ticks)) {
		state.ticks = Array(values.length).fill(0);
	}
	if (isObj(labels)) {
		state.labels = Array(values.length).fill(null);
	}

	if (isObj(ticks)) {
		for (let value in ticks) {
			state.ticks.push(ticks[value]);
			state.values.push(parseFloat(value));
			state.colors.push(null);
			state.labels.push(null);
		}
	}
	if (isObj(labels)) {
		for (let value in labels) {
			state.labels.push(labels[value]);
			state.values.push(parseFloat(value));
			state.colors.push(null);
			state.ticks.push(0);
		}
	}

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
	maxScale: Number.MAX_VALUE || 1e100,
	zoom: true,
	pan: true,

	//lines params
	font: '10pt sans-serif',
	color: 'rgb(0,0,0)',
	style: 'lines',
	tickAlign: .5,
	disable: true,
	steps: [1, 2, 5],
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

		let step = getStep(getStep(state.step*1.1, lines.steps)*1.1, lines.steps);
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

		let step = getStep(getStep(state.step*1.1, lines.steps)*1.1, lines.steps);
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
		if (!values) return coords;
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
	//FIXME: handle infinity case here
	getRatio: (value, state) => {
		return (value - state.offset) / state.range
	}
});
Grid.prototype.y = extend({}, Grid.prototype.defaults, {
	orientation: 'y',
	getCoords: (values, state) => {
		let coords = [];
		if (!values) return coords;
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
