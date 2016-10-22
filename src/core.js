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
const closestNumber = require('mumath/closest');
const clamp = require('mumath/clamp');
const alpha = require('color-alpha');
const panzoom = require('pan-zoom');
const precision = require('mumath/precision');

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
		orientation: 'x',
		lines: getRangeLines,
		getCoords: (values, lines, vp, grid) => {
			let coords = [];
			let range = lines.getRange(lines, vp, grid);
			for (let i = 0; i < values.length; i++) {
				let t = lines.getRatio(values[i], lines.offset, range);
				coords.push(t);
				coords.push(0);
				coords.push(t);
				coords.push(1);
			}
			return coords;
		},
		getRange: (lines, vp, grid) => {
			return vp[2] * lines.scale;
		},
		getRatio: (value, offset, range) => {
			return (value - offset) / range
		}
	});
	this.y = extend({}, this.defaults, opts.y, {
		orientation: 'y',
		lines: getRangeLines,
		getCoords: (values, lines, vp, grid) => {
			let coords = [];
			let range = lines.getRange(lines, vp, grid);
			for (let i = 0; i < values.length; i++) {
				let t = lines.getRatio(values[i], lines.offset, range);
				coords.push(0);
				coords.push(t);
				coords.push(1);
				coords.push(t);
			}
			return coords;
		},
		getRange: (lines, vp, grid) => {
			return vp[3] * lines.scale;
		},
		getRatio: (value, offset, range) => {
			return 1 - (value - offset) / range
		}
	});
	this.r = extend({}, this.defaults, opts.r, {
		orientation: 'r',
		lines: (dim, [l, t, w, h], grid) => getRangeLines(dim, w / dim.distance)
	});
	this.a = extend({}, this.defaults, opts.a, {
		orientation: 'a',
		lines: (dim, [l, t, w, h], grid) => getRangeLines(dim, h / dim.distance)
	});

	this.x.opposite = this.y;
	this.y.opposite = this.x;
	this.r.opposite = this.a;
	this.a.opposite = this.r;


	function getRangeLines (lines, vp, grid) {
		let step = lines.getStep(lines, vp, grid);
		let width = lines.getRange(lines, vp, grid);

		return range( Math.floor(lines.offset/step)*step, Math.ceil((lines.offset + width)/step)*step, step)//.map(v => Math.floor(v/step)*step);
	}

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
//TODO: check if interaction happens within actual zoom
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

	//shift start
	let tx = (x-left)/width, ty = 1-(y-top)/height;
	let amt = clamp(dy, -height*.75, height*.75)/height;

	if (!this.x.disable) {
		let prevScale = this.x.scale;
		this.x.scale *= (1 - amt);
		this.x.scale = Math.max(this.x.scale, Number.EPSILON);
		this.x.offset -= width*(this.x.scale - prevScale) * tx;
	}

	if (!this.y.disable) {
		let prevScale = this.y.scale;
		this.y.scale *= (1 - amt);
		this.y.scale = Math.max(this.y.scale, Number.EPSILON);
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



//default values
Grid.prototype.defaults = {
	name: '',
	units: '',

	//visible range params
	min: -Infinity,
	max: Infinity,
	offset: 0,
	scale: 1,
	zoom: true,
	pan: true,

	//lines params
	steps: [1, 2, 5],
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
	labels: (values, lines, vp, grid) => {
		let step = lines.getStep(lines, vp, grid);
		let numnum = precision(step);
		return values.map(v => v.toFixed(Math.min(numnum, 20)) + lines.units)
	},
	font: '10pt sans-serif',
	color: 'rgb(0,0,0)',
	style: 'lines',
	disable: true,

	//technical methods
	//get closest appropriate step
	getStep: (lines, vp, grid) => {
		let minStep = lines.distance * lines.scale;
		let power = Math.ceil(Math.log10(minStep));
		let order = Math.pow(10, power);

		let step = closestNumber(minStep/order, lines.steps)*order;
		lines.step = step;

		return step;
	},
	//return visible range in values terms
	getRange: (lines, vp, grid) => {
		return Math.max(vp[2], vp[3]) * lines.scale;
	},

	//get list of stops for lines
	getLines: (lines, vp, grid) => {
		if (lines.lines instanceof Function) return lines.lines(lines, vp, grid);

		return lines.lines;
	},
	//get colors for the lines
	getColors: (values, lines, vp, grid) => {
		if (lines.lineColor instanceof Function) {
			return lines.lineColor(values, lines, vp, grid);
		}

		if (Array.isArray(lines.lineColor)) return lines.lineColor;

		return Array(values.length).fill(lines.lineColor || alpha(lines.color, .13));
	},
	//get tick sizes for the lines
	getTicks: (values, lines, vp, grid) => {
		if (!lines.ticks) return [];

		if (lines.ticks instanceof Function) {
			return lines.ticks(values, lines, vp, grid);
		}

		if (Array.isArray(lines.ticks)) return lines.ticks;

		return Array(values.length).fill(lines.ticks);
	},
	//get labels for the lines
	getLabels:  (values, lines, vp, grid) => {
		if (!lines.labels) return [];

		if (lines.labels instanceof Function) {
			return lines.labels(values, lines, vp, grid);
		}

		if (Array.isArray(lines.labels)) return lines.labels;

		return Array(values.length).fill(lines.labels);
	},
	//return coords for the values, redefined by axes
	getCoords: (values, lines, vp, grid) => [0,0,0,0],
	//return 0..1 ratio based on value/offset/range, redefined by axes
	getRatio: (value, offset, range) => {
		return (value - offset) / range
	}
};


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
