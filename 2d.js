/**
 * @module  plot-grid/2d
 *
 * Canvas2D html grid renderer
 */
'use strict';


const Grid = require('./src/core');
const TAU = Math.PI*2;
const clamp = require('mumath/clamp');
const inherit = require('inherits');


module.exports = Canvas2DGrid;


inherit(Canvas2DGrid, Grid);


/** @constructor */
function Canvas2DGrid (opts) {
	if (!(this instanceof Canvas2DGrid)) return new Canvas2DGrid(opts);

	opts = opts || {};
	opts.autostart = false;
	opts.context = '2d';

	Grid.call(this, opts);
}


//draw grid to the canvas
Canvas2DGrid.prototype.draw = function (ctx, vp) {
	this.drawLines(ctx, vp, this.x);
	this.drawLines(ctx, vp, this.y);

	// //draw axes
	// drawXAxis(ctx, vp, this.x, this);
	// drawYAxis(ctx, vp, this.y, this);
	// drawRAxis(ctx, vp, this.r, this);
	// drawAAxis(ctx, vp, this.a, this);

	return this;
}

//lines instance draw
Canvas2DGrid.prototype.drawLines = function (ctx, vp, lines) {
	if (!lines || lines.disable) return;

	let [left, top, width, height] = vp;

	//create lines positions here
	let values = lines.getLines(lines, vp, this);
	let coords = lines.getCoords(values, lines, vp, this);
	let colors = lines.getColors(values, lines, vp, this);

	//build lines shape
	ctx.lineWidth = lines.lineWidth;

	for (let i=0, j=0; i < coords.length; i+=4, j++) {
		ctx.beginPath();
		let x1 = left + coords[i]*width, y1 = top + coords[i+1]*height;
		let x2 = left + coords[i+2]*width, y2 = top + coords[i+3]*height;
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);

		ctx.strokeStyle = colors[j];
		ctx.stroke();
		ctx.closePath();
	}
}

/*

function drawALines (ctx, vp, lines, grid) {
	if (!lines || lines.disable) return;
	let [left, top, width, height] = vp;

	let values = lines.getLines(lines, vp, grid);

	//draw lines
	ctx.beginPath();

	let w = width-1, h = height-1;
	let center = [left + w/2 + .5, top + h/2 + .5];
	let t0 = (values[0] - lines.start) / (lines.range);
	let maxR = Math.max(w/2, h/2);
	let minR = Math.min(w/2, h/2)-1;

	values.forEach((value, i) => {
		let t = (value - lines.start) / (lines.range);

		//360deg line
		if (t === t0) return;

		let a = TAU * t;
		ctx.moveTo(center[0], center[1]);
		ctx.lineTo(center[0] + Math.cos(a) * minR, center[1] + Math.sin(a) * minR);
	});

	ctx.strokeStyle = alpha(lines.color, lines.opacity);
	ctx.lineWidth = lines.lineWidth;
	ctx.stroke();
	ctx.closePath();
}

function drawRLines (ctx, vp, lines, grid) {
	if (!lines || lines.disable) return;
	let [left, top, width, height] = vp;

	let values = lines.getLines(lines, vp, grid);

	//draw lines
	ctx.beginPath();

	//keep things in bounds
	let w = width-1, h = height-1;
	let center = [left + w/2 + .5, top + h/2 + .5];
	let maxR = Math.max(w/2, h/2);
	let minR = Math.min(w/2, h/2)-1;
	let t0 = (values[0] - lines.start) / lines.range;

	values.forEach((value, i) => {
		let t = (value - lines.start) / lines.range;
		let r = t * minR;
		ctx.moveTo(center[0] + r, center[1]);
		ctx.arc(center[0], center[1], r, 0, TAU);
	});

	ctx.strokeStyle = alpha(lines.color, lines.opacity);
	ctx.lineWidth = lines.lineWidth;
	ctx.stroke();
	ctx.closePath();
}
*/

//axis + labels
function drawXAxis (ctx, vp, lines, grid) {
	if (!lines || lines.disable || lines.axis === false) return;

	let [left, top, width, height] = vp;


	//keep things in bounds
	let w = width-1, h = height-1;
	let axis = lines.axis;

	let axisOffset = top + height;

	let opposite = Array.isArray(grid.y) ? grid.y[0] : grid.y;

	if (typeof axis === 'number' && opposite.range) {
		let t = (clamp(axis, opposite.start, opposite.start + opposite.range) - opposite.start) / opposite.range;
		axisOffset = top + t * height;
	} else if (typeof axis === 'string') {
		if (axis === 'top') axisOffset = top;
		else if (axis === 'bottom') axisOffset = top + height;
	}

	ctx.beginPath();
	ctx.moveTo(n(left), n(axisOffset));
	ctx.lineTo(n(left + w), n(axisOffset));
	ctx.strokeStyle = lines.color;
	ctx.lineWidth = lines.axisWidth;
	ctx.stroke();
	ctx.closePath();
}


function drawYAxis (ctx, vp, lines, grid) {
	if (!lines || lines.disable || lines.axis === false) return;

	let [left, top, width, height] = vp;

	//keep things in bounds
	let w = width-1, h = height-1;
	let axis = lines.axis;

	let axisOffset = left;

	let opposite = Array.isArray(grid.x) ? grid.x[0] : grid.x;

	if (typeof axis === 'number' && opposite.range) {
		let t = (clamp(axis, opposite.start, opposite.start + opposite.range) - opposite.start) / opposite.range;
		axisOffset = left + t * width;
	} else if (typeof axis === 'string') {
		if (axis === 'left') axisOffset = left;
		else if (axis === 'bottom') axisOffset = left + width;
	}

	ctx.beginPath();
	ctx.moveTo(n(axisOffset), n(top));
	ctx.lineTo(n(axisOffset), n(top + h));
	ctx.strokeStyle = lines.color;
	ctx.lineWidth = lines.axisWidth;
	ctx.stroke();
	ctx.closePath();
}




//normalize number
function n (v) {
	return .5 + Math.round(v)
};
