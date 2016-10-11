/**
 * @module  plot-grid/2d
 *
 * Canvas2D html grid renderer
 */
'use strict';


const Grid = require('./src/core');
const alpha = require('color-alpha');
const TAU = Math.PI*2;


module.exports = createGrid;

/** @constructor */
function createGrid (lines, opts) {
	opts = opts || {};
	opts.autostart = false;
	opts.context = '2d';
	opts.draw = draw;

	let grid = new Grid(lines, opts);

	grid.render(grid.lines);

	return grid;
}


//draw grid to the canvas
function draw (ctx, vp, lines) {
	let [left, top, width, height] = vp;

	ctx.clearRect(left, top, width, height);

	lines.forEach(lines => {
		drawLines(ctx, vp, lines);
	});
}

//draw single grid/lines instance
function drawLines (ctx, vp, lines) {
	let [left, top, width, height] = vp;

	let values = lines.values instanceof Function ? lines.values(lines, vp) : lines.values;

	//draw lines
	ctx.beginPath();

	let center = [left + width/2, top + height/2];
	let maxR = Math.max(center[0], center[1]);
	let minR = Math.min(center[0], center[1]);

	values.forEach(value => {
		let t = (value - lines.min) / (lines.max - lines.min);

		if (lines.orientation === 'x') {
			ctx.moveTo(.5+Math.round(left + t*width), .5+Math.round(top));
			ctx.lineTo(.5+Math.round(left + t*width), .5+Math.round(top + height));
		}
		else if (lines.orientation === 'y') {
			ctx.moveTo(.5+Math.round(left), .5+Math.round(top + t*height));
			ctx.lineTo(.5+Math.round(left + width), .5+Math.round(top + t*height));
		}
		else if (lines.orientation === 'a') {
			let a = TAU * t;
			ctx.moveTo(center[0], center[1]);
			ctx.lineTo(Math.cos(a) * minR, Math.sin(a) * minR);
		}
		else if (lines.orientation === 'r') {
			let r = t * minR;
			ctx.moveTo(center[0], center[1]);
			ctx.arc(center[0], center[1], r, 0, TAU);
		}
	});

	ctx.strokeStyle = lines.color;
	ctx.lineWidth = lines.opacity;
	ctx.stroke();
	ctx.closePath();
}

//axis + labels
function drawAxis () {

}
