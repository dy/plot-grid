/**
 * @module  plot-grid/2d
 *
 * Canvas2D html grid renderer
 */
'use strict';


const Grid = require('./src/core');
const alpha = require('color-alpha');
const TAU = Math.PI*2;
const clamp = require('mumath/clamp');


module.exports = createGrid;

/** @constructor */
function createGrid (opts) {
	opts = opts || {};
	opts.autostart = false;
	opts.context = '2d';
	opts.draw = draw;

	let grid = new Grid(opts);

	return grid;
}


//draw grid to the canvas
function draw (ctx, vp) {
	drawXLines(ctx, vp, this.x, this);
	// drawYLines(ctx, vp, this.y, this);
	// drawRLines(ctx, vp, this.r, this);
	// drawALines(ctx, vp, this.a, this);
}


//draw single grid/lines instance
function drawXLines (ctx, vp, lines, grid) {
	let [left, top, width, height] = vp;

	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

	//draw lines
	ctx.beginPath();

	//keep things in bounds
	let w = width-1, h = height-1;

	values.forEach((value, i) => {
		let t = (value - lines.min) / (lines.max - lines.min);

		ctx.moveTo(n(left + t*w), n(top));
		ctx.lineTo(n(left + t*w), n(top + h));
	});

	ctx.strokeStyle = alpha(lines.color, lines.opacity);
	ctx.stroke();
	ctx.closePath();
}


//draw single grid/lines instance
function drawRLines (ctx, vp, lines, grid) {
	let [left, top, width, height] = vp;

	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

	//draw lines
	ctx.beginPath();

	//keep things in bounds
	let w = width-1, h = height-1;

	let center = [left + w/2 + .5, top + h/2 + .5];
	let maxR = Math.max(w/2, h/2);
	let minR = Math.min(w/2, h/2)-1;
	let t0 = (values[0] - lines.min) / (lines.max - lines.min);

	createXShape(values);
	values.forEach((value, i) => {
		let t = (value - lines.min) / (lines.max - lines.min);

		if (lines.orientation === 'x') {
			ctx.moveTo(n(left + t*w), n(top));
			ctx.lineTo(n(left + t*w), n(top + h));
		}
		else if (lines.orientation === 'y') {
			ctx.moveTo(n(left), n(top + t*h));
			ctx.lineTo(n(left + w), n(top + t*h));
		}
		else if (lines.orientation === 'a') {
			if (t === t0) return;
			let a = TAU * t;
			ctx.moveTo(center[0], center[1]);
			ctx.lineTo(center[0] + Math.cos(a) * minR, center[1] + Math.sin(a) * minR);
		}
		else if (lines.orientation === 'r') {
			let r = t * minR;
			ctx.moveTo(center[0] + r, center[1]);
			ctx.arc(center[0], center[1], r, 0, TAU);
		}
	});

	ctx.strokeStyle = lines.color;
	ctx.lineWidth = lines.opacity;
	ctx.stroke();
	ctx.closePath();
}


//normalize number
function n (v) {
	return .5 + Math.round(v)
};

//axis + labels
function drawAxis () {

}
