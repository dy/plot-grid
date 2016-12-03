/**
 * @module  plot-grid/gl
 *
 * Canvas2D html grid renderer
 */
'use strict';


const Grid = require('./src/core');
const TAU = Math.PI*2;
const clamp = require('mumath/clamp');
const len = require('mumath/len');
const inherit = require('inherits');
const almost = require('almost-equal');
const rgba = require('color-rgba');

module.exports = GlGrid;


inherit(GlGrid, Grid);


/** @constructor */
function GlGrid (opts) {
	if (!(this instanceof GlGrid)) return new GlGrid(opts);

	opts = opts || {};

	let labelsContainer = this.labelsContainer = document.createElement('div');

	Grid.call(this, opts);

	//FIXME: this container may be wrong if plot-grid is not exclusive in it's own cntnr
	this.container.appendChild(labelsContainer);
	labelsContainer.className = 'plot-grid-labels';
	labelsContainer.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		pointer-events: none;
		overflow: hidden;
		text-rendering: optimizeSpeed;
	`;

	//create label holders, we guess 30 is enough (more is bad practice)
	this.x.labelEls = createLabels(20)
	this.y.labelEls = createLabels(20)
	this.r.labelEls = createLabels(20)
	this.a.labelEls = createLabels(20)

	this.update(opts);

	function createLabels (n) {
		return Array(n).fill(null).map(x => {
			let el = labelsContainer.appendChild(document.createElement('span'))
			el.className = 'plot-grid-label';
			el.style.cssText = `
				position: absolute;
				left: 0;
				top: 0;
				will-change: transform;
			`;
			return el;
		});
	}

	//init position usage
	this.attribute('position', {usage: this.gl.DYNAMIC_DRAW, size: 2})
}

GlGrid.prototype.autostart = false;
GlGrid.prototype.antialias = true;
GlGrid.prototype.alpha = true;
GlGrid.prototype.depth = false;
GlGrid.prototype.premultipliedAlpha = true;
GlGrid.prototype.preserveDrawingBuffer = false;


GlGrid.prototype.update = function (opts) {
	Grid.prototype.update.call(this, opts);

	//preset style
	this.labelsContainer.style.fontFamily = this.x.fontFamily;
	this.labelsContainer.style.fontSize = this.x.fontSize;
	this.labelsContainer.style.color = this.x.labelColor || this.x.color;
}


GlGrid.prototype.vert = `
	attribute vec2 position;

	void main () {
		gl_Position = vec4(position.x*2. - 1., (1. - position.y)*2. - 1., 0, 1);
	}
`;

GlGrid.prototype.frag = `
	precision mediump float;

	uniform vec4 color;

	void main(void) {
		gl_FragColor = color;
	}
`;


//draw grid to the canvas
GlGrid.prototype.draw = function (data) {
	let gl = this.gl;

	this.labelsContainer.style.diplay = 'none';

	this.drawLines(gl, this.state.x);
	this.drawLines(gl, this.state.y);

	this.drawAxis(gl, this.state.x)
	this.drawAxis(gl, this.state.y)

	this.labelsContainer.style.diplay = null;

	return this;
}


//lines instance draw
GlGrid.prototype.drawLines = function (gl, state) {
	let [left, top, width, height] = state.viewport;
	let [pt, pr, pb, pl] = state.padding;

	//draw lines and sublines
	let lines = state.lines;
	let labels = state.labels;
	let labelEls = state.coordinate.labelEls;

	//clean labels
	if (labels) {
		labelEls.forEach(el => el.textContent = '');
	}

	if (!state || !state.coordinate || state.coordinate.disabled) return;

	let axisRatio = state.opposite.coordinate.getRatio(state.coordinate.axisOrigin, state.opposite);
	axisRatio = clamp(axisRatio, 0, 1);

	let coords = state.coordinate.getCoords(lines, state)

	//draw lines
	gl.lineWidth(state.lineWidth);

	let colors = {};

	//form color groups
	for (let i=0, j = 0; i < coords.length; i+=4, j++) {
		let color = state.lineColors[j];
		if (!color) continue;

		let arr = colors[color] || [];

		arr.push(coords[i]);
		arr.push(coords[i+1]);
		arr.push(coords[i+2]);
		arr.push(coords[i+3]);
		colors[color] = arr;
	}
	//render color groups
	for (let color in colors) {
		this.uniform('color', rgba(color));
		this.attribute('position', colors[color]);
		gl.drawArrays(gl.LINES, 0, colors[color].length/2);
	}


	let normals = [];
	for (let i = 0; i < coords.length; i+= 4) {
		let x1 = coords[i], y1 = coords[i+1], x2 = coords[i+2], y2 = coords[i+3];
		let xDif = x2 - x1, yDif = y2 - y1;
		let dist = len(xDif, yDif);
		normals.push(xDif/dist);
		normals.push(yDif/dist);
	}

	//calc labels/tick coords
	let tickCoords = [];
	let labelCoords = [];
	let ticks = state.ticks;
	for (let i = 0, j = 0, k = 0; i < normals.length; k++, i+=2, j+=4) {
		let x1 = coords[j], y1 = coords[j+1], x2 = coords[j+2], y2 = coords[j+3];
		let xDif = (x2 - x1)*axisRatio, yDif = (y2 - y1)*axisRatio;
		let tick = [normals[i] * ticks[k]/(width-pl-pr), normals[i+1] * ticks[k]/(height-pt-pb)];
		tickCoords.push(normals[i]*(xDif + tick[0]*state.tickAlign) + x1);
		tickCoords.push(normals[i+1]*(yDif + tick[1]*state.tickAlign) + y1);
		tickCoords.push(normals[i]*(xDif - tick[0]*(1-state.tickAlign)) + x1);
		tickCoords.push(normals[i+1]*(yDif - tick[1]*(1-state.tickAlign)) + y1);
		labelCoords.push(normals[i]*xDif + x1);
		labelCoords.push(normals[i+1]*yDif + y1);
	}

	//draw ticks
	if (ticks.length) {
		gl.lineWidth(state.axisWidth);
		this.uniform('color', rgba(state.axisColor));
		this.attribute('position', tickCoords);
		gl.drawArrays(gl.LINES, 0, tickCoords.length/2);
	}


	//draw labels
	if (labels) {
		let textHeight = state.fontSize,
			indent = state.axisWidth + 1.5;
		let textOffset = state.tickAlign < .5 ? -textHeight-state.axisWidth*2 : state.axisWidth;
		let isOpp = state.coordinate.orientation === 'y' && !state.opposite.disabled;

		for (let i = 0, j = 0; i < labels.length; i++) {
			let labelEl = labelEls[j];
			let label = labels[i];

			if (label == null) continue;
			if (isOpp && almost(lines[i], state.opposite.coordinate.axisOrigin)) continue;
			labelEl.textContent = label;
			j++;

			let textWidth = labelEl.offsetWidth;

			let textLeft = labelCoords[i*2] * (width - pl-pr) + left + indent + pl;
			if (state.coordinate.orientation === 'y') textLeft = clamp(textLeft, left + indent, left + width - textWidth - 1 - state.axisWidth);

			let textTop = labelCoords[i*2+1] * (height - pt-pb) + top + textOffset + pt;
			if (state.coordinate.orientation === 'x') textTop = clamp(textTop, top, top + height - textHeight - textOffset);

			labelEl.style.transform = `translate3d(${textLeft.toFixed(0)}px, ${textTop.toFixed(0)}px, 0)`;
			// labelEl.style.left = textLeft.toFixed(0) + 'px';
			// labelEl.style.top = textTop.toFixed(0) + 'px';
		}
	}
}

GlGrid.prototype.drawAxis = function (gl, state) {
	//draw axis
	if (state.coordinate.axis && state.axisColor) {
		let axisCoords = state.opposite.coordinate.getCoords([state.coordinate.axisOrigin], state.opposite);

		gl.lineWidth(state.axisWidth);
		this.uniform('color', rgba(state.axisColor));

		this.attribute('position', axisCoords);
		gl.drawArrays(gl.LINES, 0, axisCoords.length/2);
	}
}
