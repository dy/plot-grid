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
const magOrder = require('mumath/order');
const closestNumber = require('mumath/closest');
const range = require('just-range');


module.exports = Grid;


inherits(Grid, Component);


//constructor
function Grid (opts) {
	if (!(this instanceof Grid)) return new Grid(opts);

	if (!isBrowser) return;

	Component.call(this, {
		container: opts.container,
		viewport: opts.viewport,
		context: opts.context,
		autostart: opts.autostart,
		draw: opts.draw,
	});

	//create x/y/r/a defaults
	if (!this.x) {
		this.x = extend({}, this.defaults);
	}
	if (!this.y) {
		this.y = extend({}, this.defaults);
	}
	if (!this.r) {
		this.r = extend({}, this.defaults);
	}
	if (!this.a) {
		this.a = extend({}, this.defaults);
	}

	this.update(opts);


	//bind events
	//FIXME: attach generic panzoom component
	// if (opts && opts.wheel) {
	// 	let scrollRatio = 2000;
	// 	let listener = wheel(this.container, (dx, dy, dz, e) => {
	// 		let [left, top, width, height] = this.viewport;

	// 		//get the coord of min/max
	// 		let center = [e.offsetX - left, e.offsetY - top];
	// 		let ratio = [center[0]/width/scrollRatio, center[1]/height/scrollRatio];

	// 		let scale = 1 + dy / scrollRatio;

	// 		let lines = Array(this.lines.length).fill({});
	// 		lines = lines.map((_, i) => {
	// 			let range = (this.lines[i].max - this.lines[i].min);
	// 			let newRange = range*scale;

	// 			let min = this.lines[i].min + range*(1 - ratio[1]) - newRange*(1 - ratio[1]);
	// 			let max = this.lines[i].max - range*(ratio[1]) + newRange*(ratio[1]) ;

	// 			return {
	// 				min: min,
	// 				max: max
	// 			}
	// 		});
	// 		this.update(lines);
	// 	}, false);
	// }
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

	this.clear();
	this.render();

	return this;
}



//default values
Grid.prototype.defaults = {
	name: '',
	units: '',

	//visible range params
	min: 0,
	max: 100,
	range: [0, 100],

	//lines params
	scales: [1, 2, 5],
	log: false,
	distance: 20,
	lines: getRangeLines,

	//axis params
	axis: 0,
	ticks: 4,
	width: 2,
	labels: (line, x, vp, grid) => line.toLocalString() + x.units,
	font: '13pt sans-serif',
	color: 'rgb(0,0,0)',
	opacity: .13,
	style: 'lines',
	disabled: true
};

//litty helper returning lines for the range
function getRangeLines (x, [left, top, width, height], grid) {
	let maxNumber = width / x.distance;

	//get closest scale
	let minStep = (x.range[1] - x.range[0]) / maxNumber;
	let power = Math.floor(Math.log10(minStep));

	//FIXME: not really correct, we gotta find first scale which is more than passed number
	let scale = closestNumber(minStep/Math.pow(10,power), x.scales)*Math.pow(10, power);

	// if (x.log) {

	// }


	return range( Math.floor(x.range[0]/scale)*scale, Math.floor(x.range[1]/scale)*scale, scale);
}
