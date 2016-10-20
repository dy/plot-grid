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
const magOrder = require('mumath/order');
const closestNumber = require('mumath/closest');
const alpha = require('color-alpha');


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
	this.x = extend({}, this.defaults, opts.x, {
		lines: (dim, [l, t, w, h], grid) => getRangeLines(dim, w / dim.distance),
		getCoords: (values, lines, [l, t, w, h], grid) => {
			let coords = [];
			for (let i = 0; i < values.length; i++) {
				let t = (values[i] - lines.start) / lines.range;
				coords.push(t);
				coords.push(0);
				coords.push(t);
				coords.push(1);
			}
			return coords;
		}
	});
	this.y = extend({}, this.defaults, opts.y, {
		lines: (dim, [l, t, w, h], grid) => getRangeLines(dim, h / dim.distance),
		getCoords: (values, lines, [l, t, w, h], grid) => {
			let coords = [];
			for (let i = 0; i < values.length; i++) {
				let t = (values[i] - lines.start) / lines.range;
				coords.push(0);
				coords.push(t);
				coords.push(1);
				coords.push(t);
			}
			return coords;
		}
	});
	this.r = extend({}, this.defaults, opts.r, {
		lines: (dim, [l, t, w, h], grid) => getRangeLines(dim, w / dim.distance)
	});
	this.a = extend({}, this.defaults, opts.a, {
		lines: (dim, [l, t, w, h], grid) => getRangeLines(dim, h / dim.distance)
	});

	this.x.opposite = this.y;
	this.y.opposite = this.x;
	this.r.opposite = this.a;
	this.a.opposite = this.r;

	function getRangeLines (x, maxNumber) {
		//get closest scale
		let minStep = (x.range) / maxNumber;
		let power = Math.floor(Math.log10(minStep));

		//FIXME: not really correct, we gotta find first scale which is more than passed number
		let scale = closestNumber(minStep/Math.pow(10,power), x.scales)*Math.pow(10, power);

		// if (x.log) {

		// }

		return range( Math.floor(x.start/scale)*scale, Math.floor((x.start + x.range)/scale)*scale, scale);
	}

	this.update(opts);
}



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
	this.normalize(this.x);
	this.normalize(this.y);
	this.normalize(this.r);
	this.normalize(this.a);

	this.emit('update', opts);

	this.clear();
	this.render();

	return this;
}


//normalize single set
Grid.prototype.normalize = function (lines) {
	if (Array.isArray(lines)) return lines.forEach(this.normalize);

	let range = lines.max - lines.min;
	lines.range = Math.min(range, lines.range);
	if (lines.max != null) lines.start = Math.min(lines.max - lines.range, lines.start);
	if (lines.min != null) lines.start = Math.max(lines.start, lines.min);
}

//default values
Grid.prototype.defaults = {
	name: '',
	units: '',

	//visible range params
	min: -Infinity,
	max: Infinity,
	start: -50,
	range: 100,

	//lines params
	scales: [1, 2, 5],
	log: false,
	distance: 20,
	lines: [],
	lineWidth: 1,
	lineColor: null,

	//axis params
	axis: 0,
	axisWidth: 2,
	axisColor: null,

	ticks: 4,
	labels: (values, lines, vp, grid) => values.map(v => v.toLocaleString() + lines.units),
	font: '10pt sans-serif',
	color: 'rgb(0,0,0)',
	style: 'lines',
	disable: true,

	//technical methods
	getLines: (lines, vp, grid) => lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines,
	getColors: (values, lines, vp, grid) => {
		if (lines.lineColor instanceof Function) {
			return lines.lineColor(values, lines, vp, grid);
		}

		if (Array.isArray(lines.lineColor)) return lines.lineColor;

		return Array(values.length).fill(lines.lineColor || alpha(lines.color, .13));
	},
	getTicks: (values, lines, vp, grid) => {
		if (!lines.ticks) return [];

		if (lines.ticks instanceof Function) {
			return lines.ticks(values, lines, vp, grid);
		}

		if (Array.isArray(lines.ticks)) return lines.ticks;

		return Array(values.length).fill(lines.ticks);
	},
	getLabels:  (values, lines, vp, grid) => {
		if (!lines.labels) return [];

		if (lines.labels instanceof Function) {
			return lines.labels(values, lines, vp, grid);
		}

		if (Array.isArray(lines.labels)) return lines.labels;

		return Array(values.length).fill(lines.labels);
	},
	getCoords: (values, lines, vp, grid) => [0,0,0,0]
};
