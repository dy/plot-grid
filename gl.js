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
	// this.x.getVertices = (values, vp, lines) => {
	// 	let vertices = [];

	// 	let w = vp[2];
	// 	let lineWidth = 2 / vp[2];

	// 	for (let i = 0; i < values.length; i++) {
	// 		let t = (values[i] - lines.start) / lines.range;
	// 		let coord = t * 2 - 1;
	// 		let left = coord - lineWidth;
	// 		let right = coord + lineWidth;

	// 		vertices.push(left);
	// 		vertices.push(-1);
	// 		vertices.push(right);
	// 		vertices.push(-1);
	// 		vertices.push(left);
	// 		vertices.push(1);

	// 		vertices.push(left);
	// 		vertices.push(1);
	// 		vertices.push(right);
	// 		vertices.push(1);
	// 		vertices.push(right);
	// 		vertices.push(-1);
	// 	}

	// 	return vertices;
	// }

	// this.y.getVertices = (values, vp, lines) => {
	// 	let vertices = [];

	// 	let half = lines.lineWidth / vp[3];

	// 	for (let i = 0; i < values.length; i++) {
	// 		let t = (values[i] - lines.start) / lines.range;
	// 		let coord = t * 2 - 1;

	// 		vertices.push(-1);
	// 		vertices.push(coord-half);
	// 		vertices.push(1);
	// 		vertices.push(coord-half);
	// 		vertices.push(-1);
	// 		vertices.push(coord+half);

	// 		vertices.push(-1);
	// 		vertices.push(coord+half);
	// 		vertices.push(1);
	// 		vertices.push(coord+half);
	// 		vertices.push(1);
	// 		vertices.push(coord-half);
	// 	}

	// 	return vertices;
	// }


	//2d canvas for labels
	this.labelsCanvas = document.createElement('canvas');
	this.labelsCanvas.width = this.canvas.width;
	this.labelsCanvas.height = this.canvas.height;
	this.labelsContext = this.labelsCanvas.getContext('2d');
	this.on('resize', (ctx, vp) => {
		this.labelsCanvas.width = this.canvas.width;
		this.labelsCanvas.height = this.canvas.height;
	});
	this.setTexture({
		labels: this.labelsCanvas
	});


	//init set of positions
	// let positions = [];
	// let num = 100, width = .5/num;
	// for (let i = 0; i < num; i++) {
	// 	let t = i/num;
	// 	positions.push(t);
	// 	positions.push(0);
	// 	positions.push(t);
	// 	positions.push(1);
	// 	positions.push(t+width);
	// 	positions.push(0);

	// 	positions.push(t+width);
	// 	positions.push(0);
	// 	positions.push(t+width);
	// 	positions.push(1);
	// 	positions.push(t);
	// 	positions.push(1);
	// }
	// this.setAttribute('position', positions);
}

GLGrid.prototype.context = {
	type: 'webgl',
	antialias: true
};


GLGrid.prototype.vert = `
	precision highp float;

	attribute vec2 position;
	uniform vec4 viewport;
	float num = 100.;

	void main () {
		float isRight = step(.5/num, mod(position.x + .25/num, 1./num));
		float left = position.x - isRight * .5/num;

		float px = 1.001/viewport.z;
		float x = left + isRight * px;

		gl_Position = vec4(vec2(x * 2. - 1., position.y * 2. - 1.), 0, 1);
	}
`;


GLGrid.prototype.frag = `
	precision highp float;

	void main () {
		gl_FragColor = vec4(0,0,0,1);
	}
`;


//draw grid to the canvas
GLGrid.prototype.draw = function (gl, vp) {
	this.drawLines(gl, vp, this.x);
	// this.drawAxis(gl, vp, this.y);

}


//lines instance draw
GLGrid.prototype.drawLines = function (gl, vp, lines) {
	if (!lines || lines.disable) return;

	let [left, top, width, height] = vp;

	//create lines positions here
	let values = lines.getLines(lines, vp, this);
	let coords = lines.getCoords(values, lines, vp, this);

	// this.setTexture('coords', coords);

	//map lines to triangles
	// let vertices = getVertices(coords);
	// this.setAttribute('position', vertices);

	// //obtain per-line colors
	// let verticesPerLine = 6;
	// let colors = lines.getColors(values, vp, lines, this);

	// if (colors.length*verticesPerLine < vertices.length/2) throw 'Not enough colors for lines';

	// let colorBuffer = Array(colors.length*4*verticesPerLine);
	// for (let i = 0; i < colors.length; i++) {
	// 	let [r,g,b,a] = rgba(colors[i]);
	// 	for (let j = 0; j < verticesPerLine; j++) {
	// 		colorBuffer[i*4*verticesPerLine + j*4 + 0] = r;
	// 		colorBuffer[i*4*verticesPerLine + j*4 + 1] = g;
	// 		colorBuffer[i*4*verticesPerLine + j*4 + 2] = b;
	// 		colorBuffer[i*4*verticesPerLine + j*4 + 3] = a;
	// 	}
	// }
	// this.setAttribute('color', colorBuffer);

	Grid.prototype.draw.call(this, gl, vp);

	return this;
}


//axis + labels
GLGrid.prototype.drawAxis = function (ctx, vp, lines) {
	if (!lines || lines.disable || lines.axis === false) return;

	let [left, top, width, height] = vp;

	//create lines positions here
	let values = lines.getLines(lines, vp, this);

	//map lines to triangles
	let vertices = lines.getVertices(values, vp, lines);
	this.setAttribute('position', vertices);

	//obtain per-line colors
	let color = rgb(lines.axisColor || lines.color);
	color.push(1);
	this.setUniform('color', color);

	Grid.prototype.draw.call(this, gl, vp);

	return this;
}


//get rgb from color
function rgba (v) {
	let obj = parseColor(v);

	if (obj.space[0] === 'h') {
		obj.values = hsl.rgb(obj.values);
	}

	obj.values.push(obj.alpha);

	return obj.values;
}
