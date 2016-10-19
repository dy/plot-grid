/**
 * @module  plot-grid/gl
 *
 * Webgl grid renderer
 */
'use strict';


const Grid = require('./src/core');
const clamp = require('mumath/clamp');
const TAU = Math.PI*2;
const inherits = require('inherits');
const parseColor = require('color-parse');
const hsl = require('color-space/hsl');

module.exports = GLGrid;


inherits(GLGrid, Grid);


/** @constructor */
function GLGrid (opts) {
	if (!(this instanceof GLGrid)) return new GLGrid(opts);

	opts = opts || {};
	opts.autostart = false;

	Grid.call(this, opts);

	//lines-specific points
	this.x.getPositions = (values, vp, lines) => {
		let positions = [];

		let half = lines.lineWidth / vp[2];

		for (let i = 0; i < values.length; i++) {
			let t = (values[i] - lines.start) / lines.range;
			let coord = t * 2 - 1;

			positions.push(coord-half);
			positions.push(-1);
			positions.push(coord+half);
			positions.push(-1);
			positions.push(coord-half);
			positions.push(1);

			positions.push(coord-half);
			positions.push(1);
			positions.push(coord+half);
			positions.push(1);
			positions.push(coord+half);
			positions.push(-1);
		}

		return positions;
	}

	this.y.getPositions = (values, vp, lines) => {
		let positions = [];

		let half = lines.lineWidth / vp[3];

		for (let i = 0; i < values.length; i++) {
			let t = (values[i] - lines.start) / lines.range;
			let coord = t * 2 - 1;

			positions.push(-1);
			positions.push(coord-half);
			positions.push(1);
			positions.push(coord-half);
			positions.push(-1);
			positions.push(coord+half);

			positions.push(-1);
			positions.push(coord+half);
			positions.push(1);
			positions.push(coord+half);
			positions.push(1);
			positions.push(coord-half);
		}

		return positions;
	}

	let gl = this.context;
	this.setAttribute({
		position: {
			usage: gl.STREAM_DRAW
		},
		// color: {
		// 	usage: gl.STREAM_DRAW,
		// 	size: 4
		// }
	});
}

GLGrid.prototype.context = {
	type: 'webgl',
	antialias: false
};


GLGrid.prototype.frag = `
	precision lowp float;

	uniform vec4 color;
	void main () {
		gl_FragColor = color;
	}
`;



//draw grid to the canvas
GLGrid.prototype.draw = function (ctx, vp) {
	drawLines(ctx, vp, this.x, this);
	drawLines(ctx, vp, this.y, this);

	// if (Array.isArray(this.x)) this.x.forEach((lines) => drawXLines(ctx, vp, lines, this));
	// else drawXLines(ctx, vp, this.x, this);
	// if (Array.isArray(this.y)) this.y.forEach((lines) => drawYLines(ctx, vp, lines, this));
	// else drawYLines(ctx, vp, this.y, this);
	// if (Array.isArray(this.r)) this.r.forEach((lines) => drawRLines(ctx, vp, lines, this));
	// else drawRLines(ctx, vp, this.r, this);
	// if (Array.isArray(this.a)) this.a.forEach((lines) => drawALines(ctx, vp, lines, this));
	// else drawALines(ctx, vp, this.a, this);

	// //draw axes
	// drawXAxis(ctx, vp, this.x, this);
	// drawYAxis(ctx, vp, this.y, this);
	// drawRAxis(ctx, vp, this.r, this);
	// drawAAxis(ctx, vp, this.a, this);

}

//lines instance draw
function drawLines (gl, vp, lines, grid) {
	if (!lines || lines.disable) return;

	let [left, top, width, height] = vp;

	//create lines positions here
	let values = lines.getLines(lines, vp, grid);

	//map lines to triangles
	let positions = lines.getPositions(values, vp, lines);
	grid.setAttribute('position', positions);

	//obtain per-line colors
	let color = rgb(lines.color);
	color.push(lines.opacity);
	grid.setUniform('color', color);

	Grid.prototype.draw.call(grid, gl, vp);

	return this;
}


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


function drawRAxis () {

}
function drawAAxis () {

}



//normalize number
function n (v) {
	return .5 + Math.round(v)
};

//get rgb from color
function rgb (v) {
	let obj = parseColor(v);

	//catch percent
	if (obj.space[0] === 'h') {
		return hsl.rgb(obj.values);
	}

	return obj.values;
}
