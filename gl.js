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

module.exports = GLGrid;


inherits(GLGrid, Grid);


/** @constructor */
function GLGrid (opts) {
	if (!(this instanceof GLGrid)) return new GLGrid(opts);

	opts = opts || {};
	opts.autostart = false;

	Grid.call(this, opts);

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
	void main () {
		gl_FragColor = vec4(0,0,0,1);
	}
`;



//draw grid to the canvas
GLGrid.prototype.draw = function (ctx, vp) {
	drawLines(ctx, vp, this.x, this);

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
	let [left, top, width, height] = vp;

	//create lines positions here
	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

	//map lines to triangles
	let positions = [];
	let coordLineWidth = 2 * lines.lineWidth / width;
	for (let i = 0; i < values.length; i++) {
		let t = (values[i] - lines.start) / lines.range;
		let coord = t * 2 - 1;

		//FIXME: x-specific filler
		positions.push(coord);
		positions.push(1);
		positions.push(coord+coordLineWidth);
		positions.push(1);
		positions.push(coord);
		positions.push(-1);

		positions.push(coord);
		positions.push(-1);
		positions.push(coord+coordLineWidth);
		positions.push(1);
		positions.push(coord+coordLineWidth);
		positions.push(-1);
	}

	grid.setAttribute('position', positions);

	Grid.prototype.draw.call(grid, gl, vp);

	return this;
}


//FIXME: make these methods belong to lines objects
function drawXLines (ctx, vp, lines, grid) {
	if (!lines || lines.disable) return;

	let [left, top, width, height] = vp;

	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

	//draw lines
	ctx.beginPath();

	//keep things in bounds
	let w = width-1, h = height-1;
	values.forEach((value, i) => {
		let t = (value - lines.start) / lines.range;
		ctx.moveTo(n(left + t*w), n(top));
		ctx.lineTo(n(left + t*w), n(top + h));
	});

	ctx.strokeStyle = alpha(lines.color, lines.opacity);
	ctx.lineWidth = lines.lineWidth;
	ctx.stroke();
	ctx.closePath();
}

function drawYLines (ctx, vp, lines, grid) {
	if (!lines || lines.disable) return;
	let [left, top, width, height] = vp;

	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

	//draw lines
	ctx.beginPath();

	//keep things in bounds
	let w = width-1, h = height-1;

	values.forEach((value, i) => {
		let t = (value - lines.start) / lines.range;
		ctx.moveTo(n(left), n(top + t*h));
		ctx.lineTo(n(left + w), n(top + t*h));
	});

	ctx.strokeStyle = alpha(lines.color, lines.opacity);
	ctx.lineWidth = lines.lineWidth;
	ctx.stroke();
	ctx.closePath();
}

function drawALines (ctx, vp, lines, grid) {
	if (!lines || lines.disable) return;
	let [left, top, width, height] = vp;

	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

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

	let values = lines.lines instanceof Function ? lines.lines(lines, vp, grid) : lines.lines;

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
