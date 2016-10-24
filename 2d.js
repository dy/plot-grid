/**
 * @module  plot-grid/2d
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
	this.clear();

	//then we draw
	this.drawLines(ctx, this.state.x);
	this.drawLines(ctx, this.state.y);

	return this;
}

//lines instance draw
Canvas2DGrid.prototype.drawLines = function (ctx, state) {
	if (!state || !state.lines || state.lines.disabled) return;

	let [left, top, width, height] = state.viewport;
	let [pt, pr, pb, pl] = state.padding;

	//create lines positions here
	let values = state.values;
	let lineColors = state.colors;
	let ticks = state.ticks;
	let labels = state.labels;


	//get coordinates of lines
	let coords = state.lines.getCoords(values, state);

	//build normals, mb someone will need that
	let normals = [];
	for (let i = 0; i < coords.length; i+= 4) {
		let x1 = coords[i], y1 = coords[i+1], x2 = coords[i+2], y2 = coords[i+3];
		let xDif = x2 - x1, yDif = y2 - y1;
		let dist = len(xDif, yDif);
		normals.push(xDif/dist);
		normals.push(yDif/dist);
	}


	//draw lines
	if (state.lines.lines !== false) {
		ctx.lineWidth = state.lineWidth;

		for (let i=0, j=0; i < coords.length; i+=4, j++) {
			let color = lineColors[j];
			if (!color) continue;

			ctx.beginPath();
			let x1 = left + pl + coords[i]*(width - pr-pl),
				y1 = top + pt + coords[i+1]*(height - pb-pt);
			let x2 = left + pl + coords[i+2]*(width - pr-pl),
				y2 = top + pt + coords[i+3]*(height - pb-pt);
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);

			ctx.strokeStyle = color;
			ctx.stroke();
			ctx.closePath();
		}
	}

	//draw axis
	let axisRatio = state.opposite.lines.getRatio(state.axisOrigin, state.opposite);
	axisRatio = clamp(axisRatio, 0, 1);

	if (state.lines.axis !== false && state.axisColor) {
		let axisCoords = state.opposite.lines.getCoords([state.axisOrigin], state.opposite);

		ctx.lineWidth = state.axisWidth;

		let x1 = left + pl + clamp(axisCoords[0], 0, 1)*(width - pr-pl),
			y1 = top + pt + clamp(axisCoords[1], 0, 1)*(height - pt-pb);
		let x2 = left + pl + clamp(axisCoords[2], 0, 1)*(width - pr-pl),
			y2 = top + pt + clamp(axisCoords[3], 0, 1)*(height - pt-pb);

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);

		ctx.strokeStyle = state.axisColor;
		ctx.stroke();
		ctx.closePath();
	}

	//calc labels/tick coords
	let tickCoords = [];
	let labelCoords = [];
	let align = state.align;
	for (let i = 0, j = 0, k = 0; i < normals.length; k++, i+=2, j+=4) {
		let tick = [normals[i] * ticks[k]/(width-pl-pr), normals[i+1] * ticks[k]/(height-pt-pb)];
		let x1 = coords[j], y1 = coords[j+1], x2 = coords[j+2], y2 = coords[j+3];
		let xDif = (x2 - x1)*axisRatio, yDif = (y2 - y1)*axisRatio;
		labelCoords.push(normals[i]*(xDif) + x1)
		labelCoords.push(normals[i+1]*(yDif) + y1)
		tickCoords.push(normals[i]*(xDif + tick[0]*align) + x1);
		tickCoords.push(normals[i+1]*(yDif + tick[1]*align) + y1);
		tickCoords.push(normals[i]*(xDif - tick[0]*(1-align)) + x1);
		tickCoords.push(normals[i+1]*(yDif - tick[1]*(1-align)) + y1);
	}

	//draw ticks
	if (ticks) {
		ctx.lineWidth = state.axisWidth;
		ctx.beginPath();
		for (let i=0, j=0; i < tickCoords.length; i+=4, j++) {
			if (almost(values[j], state.opposite.axisOrigin)) continue;
			let x1 = left + pl + tickCoords[i]*(width - pl-pr),
				y1 = top + pt + tickCoords[i+1]*(height - pt-pb);
			let x2 = left + pl + tickCoords[i+2]*(width - pl-pr),
				y2 = top + pt + tickCoords[i+3]*(height - pt-pb);
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
		}
		ctx.strokeStyle = state.axisColor;
		ctx.stroke();
		ctx.closePath();
	}

	//draw labels
	if (labels) {
		ctx.font = state.fontSize + 'px ' + state.fontFamily;
		ctx.fillStyle = state.labelColor;
		ctx.textBaseline = 'top';
		let textHeight = state.fontSize,
			indent = state.axisWidth + 1.5;
		let textOffset = align < .5 ? -textHeight-state.axisWidth*2 : state.axisWidth;
		let isOpp = state.lines.opposite === 'y' && !state.lines.opposite.disabled;
		for (let i = 0; i < labels.length; i++) {
			let label = labels[i];
			if (label==null) continue;
			if (isOpp && almost(values[i], state.opposite.axisOrigin)) continue;
			let textWidth = ctx.measureText(label).width;

			let textLeft = labelCoords[i*2] * (width - pl-pr) + left + indent + pl;
			if (normals[i*2]) textLeft = clamp(textLeft, left + indent, left + width - textWidth - 1 - state.axisWidth);

			let textTop = labelCoords[i*2+1] * (height - pt-pb) + top + textOffset + pt;
			if (normals[i*2+1]) textTop = clamp(textTop, top + textHeight, top + height - textHeight/2);
			ctx.fillText(label, textLeft, textTop);
		}
	}
}

/*

function drawALines (ctx, vp, lines, grid) {
	if (!lines || lines.disabled) return;
	let [left, top, width, height] = vp;

	let values = lines.getLines(lines, vp, grid);

	//draw lines
	ctx.beginPath();

	let w = width-1, h = height-1;
	let center = [left + w/2 + .5, top + h/2 + .5];
	let t0 = (values[0] - lines.offset) / (lines.range);
	let maxR = Math.max(w/2, h/2);
	let minR = Math.min(w/2, h/2)-1;

	values.forEach((value, i) => {
		let t = (value - lines.offset) / (lines.range);

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
	if (!lines || lines.disabled) return;
	let [left, top, width, height] = vp;

	let values = lines.getLines(lines, vp, grid);

	//draw lines
	ctx.beginPath();

	//keep things in bounds
	let w = width-1, h = height-1;
	let center = [left + w/2 + .5, top + h/2 + .5];
	let maxR = Math.max(w/2, h/2);
	let minR = Math.min(w/2, h/2)-1;
	let t0 = (values[0] - lines.offset) / lines.range;

	values.forEach((value, i) => {
		let t = (value - lines.offset) / lines.range;
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
