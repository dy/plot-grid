/**
 * Abstract plot-grid class, with no specific renderer
 *
 * @module  plot-grid/src/core
 */

'use strict';

const createLoop = require('canvas-loop')
const inherits = require('inherits')
const isBrowser = require('is-browser')
const extend = require('object-assign')
const range = require('just-range')
const pick = require('just-pick')
const clamp = require('mumath/clamp')
const panzoom = require('pan-zoom')
const alpha = require('color-alpha')
const isObj = require('is-plain-obj')
const parseUnit = require('parse-unit')
const toPx = require('to-px')
const types = require('./types')
const Emitter = require('events')
const getContext = require('gl-util/context')


module.exports = Grid;


Grid.types = types;


inherits(Grid, Emitter);


//constructor
function Grid (opts) {
	if (!(this instanceof Grid)) return new Grid(opts);

	if (!isBrowser) return;

	Emitter.call(opts);

	//create rendering state
	this.state = {};

	extend(this, opts);

	//create canvas/container
	//FIXME: this is not very good for 2d case though
	if (!this.context) this.context = getContext(this);
	if (!this.canvas) this.canvas = this.context.canvas;
	if (!this.container) this.container = document.body || document.documentElement;
	if (!this.canvas.parentNode) {
		this.container.appendChild(this.canvas);
	}


	this.canvas.classList.add('plot-grid-canvas')

	//set default coords as xy
	if (opts.r == null && opts.a == null && opts.y == null && opts.x == null) {
		opts.x = true;
		opts.y = true;
	}

	//create x/y/r
	this.x = extend({disabled: true}, Grid.prototype.x, opts.x);
	this.y = extend({disabled: true}, Grid.prototype.y, opts.y);
	this.r = extend({disabled: true}, Grid.prototype.r, opts.r);
	this.a = extend({disabled: true}, Grid.prototype.a, opts.a);

	//enable proper lines
	if (opts.x !== undefined) this.x.disabled = !opts.x;
	if (opts.y !== undefined) this.y.disabled = !opts.y;
	if (opts.r !== undefined) this.r.disabled = !opts.r;
	if (opts.a !== undefined) this.a.disabled = !opts.a;

	//create loop
	this.loop = createLoop(this.canvas, {parent: this.container, scale: this.pixelRatio});

	this.loop.on('tick', () => {
		this.render();
	});
	this.loop.on('resize', () => {
		this.update()
	});

	this.autostart && this.loop.start();


	//enable interactions
	panzoom(this.canvas, (e) => {
		if (!this.interactions) return;

		let {width, height} = this.canvas;

		//shift start
		let zoom = clamp(-e.dz, -height*.75, height*.75)/height;

		let x = {offset: this.x.offset, scale: this.x.scale},
			y = {offset: this.y.offset, scale: this.y.scale};

		//pan
		if (!this.x.disabled) {
			let oX = this.x && this.x.origin || 0;
			if (this.x.pan) {
				x.offset -= this.x.scale * e.dx;
			}
			if (this.x.zoom !== false) {
				let tx = (e.x)/width - oX;
				let prevScale = x.scale;
				x.scale *= (1 - zoom);
				x.scale = clamp(x.scale, this.x.minScale, this.x.maxScale);
				x.offset -= width*(x.scale - prevScale) * tx;
			}
		}
		if (!this.y.disabled) {
			let oY = this.y && this.y.origin || 0;
			if (this.y.pan) {
				y.offset += y.scale * e.dy;
			}
			if (this.y.zoom !== false) {
				let ty = oY-(e.y)/height;
				let prevScale = y.scale;
				y.scale *= (1 - zoom);
				y.scale = clamp(y.scale, this.y.minScale, this.y.maxScale);
				y.offset -= height*(y.scale - prevScale) * ty;
			}
		}
		this.update({x, y});
		this.emit('interact', this);
	});
}


//re-evaluate lines, calc options for renderer
Grid.prototype.update = function (opts) {
	if (!opts) opts = {};

	let shape = [this.canvas.width, this.canvas.height];

	if (opts) {
		//treat bools
		if (opts.x === false || opts.x === true) opts.x = {disabled: !opts.x};
		if (opts.y === false || opts.y === true) opts.y = {disabled: !opts.y};
		if (opts.r === false || opts.r === true) opts.r = {disabled: !opts.r};
		if (opts.a === false || opts.a === true) opts.a = {disabled: !opts.a};

		//take over types properties
		if  (opts.x && opts.x.type) opts.x = extend({}, Grid.types[opts.x.type], opts.x);
		if  (opts.y && opts.y.type) opts.y = extend({}, Grid.types[opts.y.type], opts.y);
		if  (opts.r && opts.r.type) opts.r = extend({}, Grid.types[opts.r.type], opts.r);
		if  (opts.a && opts.a.type) opts.a = extend({}, Grid.types[opts.a.type], opts.a);

		//extend props
		if (opts.x) extend(this.x, opts.x);
		if (opts.y) extend(this.y, opts.y);
		if (opts.r) extend(this.r, opts.r);
		if (opts.a) extend(this.a, opts.a);
	}

	//normalize, make sure range/offset are not off the limits
	if (!this.x.disabled) {
		let range = this.x.getRange({shape: shape, coordinate: this.x});

		this.x.offset = clamp(this.x.offset, this.x.min, Math.max(this.x.max - range, this.x.min));

		this.x.maxScale = (this.x.max - this.x.min) / shape[0];
	}

	if (!this.y.disabled) {
		let range = this.y.getRange({shape: shape, coordinate: this.y});
		this.y.offset = clamp(this.y.offset, this.y.min, Math.max(this.y.max - range, this.y.min));
		this.y.maxScale = (this.y.max - this.y.min) / shape[1];
	}

	//recalc state
	this.state.x = this.calcCoordinate(this.x, shape, this);
	this.state.y = this.calcCoordinate(this.y, shape, this);

	this.state.x.opposite = this.state.y;
	this.state.y.opposite = this.state.x;

	this.emit('update', opts);

	return this;
}


//get state object with calculated params, ready for rendering
Grid.prototype.calcCoordinate = function (coord, shape) {
	let state = {
		coordinate: coord,
		shape: shape,
		grid: this
	};

	//calculate real offset/range
	state.range = coord.getRange(state);
	state.offset = clamp(
		coord.offset - state.range * clamp(coord.origin, 0, 1),
		Math.max(coord.min, -Number.MAX_VALUE+1), Math.min(coord.max, Number.MAX_VALUE) - state.range
	);
	state.scale = coord.scale;

	//calc style
	state.axisColor = typeof coord.axisColor === 'number' ? alpha(coord.color, coord.axisColor) : coord.axisColor || coord.color;
	state.axisWidth = coord.axisWidth || coord.lineWidth;
	state.lineWidth = coord.lineWidth;
	state.tickAlign = coord.tickAlign;
	state.labelColor = state.color;

	//get padding
	if (typeof coord.padding === 'number') {
		state.padding = Array(4).fill(coord.padding);
	}
	else if (coord.padding instanceof Function) {
		state.padding = coord.padding(state);
	}
	else {
		state.padding = coord.padding;
	}

	//calc font
	if (typeof coord.fontSize === 'number') {
		state.fontSize = coord.fontSize
	}
	else {
		let units = parseUnit(coord.fontSize);
		state.fontSize = units[0] * toPx(units[1]);
	}
	state.fontFamily = coord.fontFamily || 'sans-serif';

	//get lines stops, including joined list of values
	let lines;
	if (coord.lines instanceof Function) {
		lines = coord.lines(state);
	}
	else {
		lines = coord.lines || [];
	}
	state.lines = lines;

	//calc colors
	if (coord.lineColor instanceof Function) {
		state.lineColors = coord.lineColor(state);
	}
	else if (Array.isArray(coord.lineColor)) {
		state.lineColors = coord.lineColor;
	}
	else {
		let color = typeof coord.lineColor === 'number' ? alpha(coord.color, coord.lineColor) : (coord.lineColor === false || coord.lineColor == null) ? null : coord.color;
		state.lineColors = Array(lines.length).fill(color);
	}


	//calc ticks
	let ticks;
	if (coord.ticks instanceof Function) {
		ticks = coord.ticks(state);
	}
	else if (Array.isArray(coord.ticks)) {
		ticks = coord.ticks;
	}
	else {
		let tick = (coord.ticks === true || coord.ticks === true) ? state.axisWidth*2 : coord.ticks || 0;
		ticks = Array(lines.length).fill(tick);
	}
	state.ticks = ticks;


	//calc labels
	let labels;
	if (coord.labels === true) labels = state.lines.concat(Array(sublines.length).fill(null));
	else if (coord.labels instanceof Function) {
		labels = coord.labels(state);
	}
	else if (Array.isArray(coord.labels)) {
		labels = coord.labels;
	}
	else if (isObj(coord.labels)) {
		labels = coord.labels
	}
	else {
		labels = Array(state.lines.length).fill(null);
	}
	state.labels = labels;


	//convert hashmap ticks/labels to lines + colors
	if (isObj(ticks)) {
		state.ticks = Array(lines.length).fill(0);
	}
	if (isObj(labels)) {
		state.labels = Array(lines.length).fill(null);
	}

	if (isObj(ticks)) {
		for (let value in ticks) {
			state.ticks.push(ticks[value]);
			state.lines.push(parseFloat(value));
			state.lineColors.push(null);
			state.labels.push(null);
		}
	}
	if (isObj(labels)) {
		for (let value in labels) {
			state.labels.push(labels[value]);
			state.lines.push(parseFloat(value));
			state.lineColors.push(null);
			state.ticks.push(null);
		}
	}

	return state;
};


Grid.prototype.pixelRatio = window.devicePixelRatio;
Grid.prototype.autostart = true;
Grid.prototype.interactions = true;


//default values
Grid.prototype.defaults = extend({
	type: 'linear',
	name: '',
	units: '',

	//visible range params
	min: -Infinity,
	max: Infinity,
	offset: 0,
	origin: .5,
	scale: 1,
	minScale: 1.19209290e-13,
	maxScale: Number.MAX_VALUE || 1e100,
	zoom: true,
	pan: true,

	//labels
	labels: true,
	fontSize: '10pt',
	fontFamily: 'sans-serif',
	padding: 0,
	color: 'rgb(0,0,0,1)',

	//lines params
	lines: true,
	tick: 8,
	tickAlign: .5,
	lineWidth: 1,
	distance: 13,
	style: 'lines',
	lineColor: .4,

	//axis params
	axis: true,
	axisOrigin: 0,
	axisWidth: 2,
	axisColor: 1,

	//stub methods
	//return coords for the values, redefined by axes
	getCoords: (values, state) => [0,0,0,0],

	//return 0..1 ratio based on value/offset/range, redefined by axes
	getRatio: (value, state) => 0,

	//default label formatter
	format: v => v
}, types.linear);

Grid.prototype.x = extend({}, Grid.prototype.defaults, {
	orientation: 'x',
	getCoords: (values, state) => {
		let coords = [];
		if (!values) return coords;
		for (let i = 0; i < values.length; i++) {
			let t = state.coordinate.getRatio(values[i], state);
			coords.push(t);
			coords.push(0);
			coords.push(t);
			coords.push(1);
		}
		return coords;
	},
	getRange: state => {
		return state.shape[0] * state.coordinate.scale;
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
			let t = state.coordinate.getRatio(values[i], state);
			coords.push(0);
			coords.push(t);
			coords.push(1);
			coords.push(t);
		}
		return coords;
	},
	getRange: state => {
		return state.shape[1] * state.coordinate.scale;
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
