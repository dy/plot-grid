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
	let ticks = lines.getTicks(values, lines, vp, this);
	let labels = lines.getLabels(values, lines, vp, this);

	//build normals
	let normals = [];
	for (let i = 0; i < coords.length; i+= 4) {
		let x1 = coords[i], y1 = coords[i+1], x2 = coords[i+2], y2 = coords[i+3];
		let xDif = x2 - x1, yDif = y2 - y1;
		let dist = Math.sqrt(xDif*xDif + yDif*yDif);
		normals.push(xDif/dist);
		normals.push(yDif/dist);
	}

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



	if (lines.axis !== false) {
		//draw axis
		let axisOrigin = lines.axis || 0;

		if (typeof axisOrigin === 'string') {
			switch (axisOrigin) {
				case 'bottom':
				case 'left':
					axisOrigin = lines.opposite.start;
					break;
				default:
					axisOrigin = lines.opposite.start + lines.opposite.range;
			}
		}
		else if (axisOrigin === true) axisOrigin = 0;

		let axisRatio = (axisOrigin - lines.opposite.start) / lines.opposite.range;

		let axisCoords = lines.opposite.getCoords([axisOrigin], lines.opposite, vp, this);

		ctx.lineWidth = lines.axisWidth;

		let x1 = left + axisCoords[0]*width, y1 = top + axisCoords[1]*height;
		let x2 = left + axisCoords[2]*width, y2 = top + axisCoords[3]*height;

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);

		ctx.strokeStyle = lines.axisColor || lines.color;
		ctx.stroke();
		ctx.closePath();


		//draw ticks
		let tickCoords = [];
		for (let i = 0, j = 0, k = 0; i < normals.length; k++, i+=2, j+=4) {
			let tick = [normals[i] * ticks[k]/width, normals[i+1] * ticks[k]/height];
			let x1 = coords[j], y1 = coords[j+1], x2 = coords[j+2], y2 = coords[j+3];
			let xDif = (x2 - x1)*axisRatio, yDif = (y2 - y1)*axisRatio;
			tickCoords.push(normals[i]*(xDif + tick[0]) + x1);
			tickCoords.push(normals[i+1]*(yDif + tick[1]) + y1);
			tickCoords.push(normals[i]*(xDif - tick[0]) + x1);
			tickCoords.push(normals[i+1]*(yDif - tick[1]) + y1);
		}

		ctx.lineWidth = lines.tickWidth || lines.axisWidth/2;
		ctx.beginPath();
		for (let i=0, j=0; i < tickCoords.length; i+=4, j++) {
			let x1 = left + tickCoords[i]*width,
				y1 = top + tickCoords[i+1]*height;
			let x2 = left + tickCoords[i+2]*width,
				y2 = top + tickCoords[i+3]*height;
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
		}
		ctx.strokeStyle = lines.axisColor || lines.color;
		ctx.stroke();
		ctx.closePath();


		//draw labels
		ctx.font = lines.font;
		ctx.fillStyle = lines.color;
		for (let i = 0; i < labels.length; i++) {
			ctx.fillText(labels[i], tickCoords[i*4] * width + left, tickCoords[i*4+1] * height + top);
		}
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


//normalize number
function n (v) {
	return .5 + Math.round(v)
};
