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


module.exports = Grid;


inherits(Grid, Component);


//constructor
function Grid (lines, opts) {
	if (!(this instanceof Grid)) return new Grid(lines, opts);

	Component.call(this, opts);

	if (!isBrowser) return;

	this.lines = [];

	this.update(lines);
}



//re-evaluate lines, calc options for renderer
Grid.prototype.update = function (lines) {
	//ensure lines are complete
	Array.isArray(lines) && lines.forEach((newLines, i) => {
		//ensure defaults
		if (!this.lines[i]) this.lines[i] = this.createLines(i);

		let srcLines = this.lines[i];

		extend(srcLines, newLines);

		//normalize some options
		if (srcLines.orientation === 'x' || srcLines.orientation === 'horizontal') srcLines.orientation = 'x';
		else if (srcLines.orientation === 'y' || srcLines.orientation === 'vertical') srcLines.orientation = 'y';
		else if (/a/.test(srcLines.orientation))  srcLines.orientation = 'a';
		else if (/r|d/.test(srcLines.orientation)) srcLines.orientation = 'r';
	});

	this.render(this.lines);

	return this;
}

//create new lines object
Grid.prototype.createLines = function (i) {
	return {
		name: '',
		units: '',
		log: false,
		orientation: !i ? 'x' : 'y',
		min: 0,
		max: 100,
		axis: 0,
		values: (lines, [left, top, width, height]) => {
			let values = [];

			//min dist between lines
			let minDistance = 50;

			//detect values based off state by default
			if (!lines.log) {
				let sequence = [0, 1, 2, 2.5, 5];

				//max number of stops
				let intersteps = 0;

				let minDim = Math.min(width, height);

				//||| horizontal
				if (lines.orientation === 'x') {
					intersteps = width / minDistance;
				}
				//≡ vertical
				else if (lines.orientation === 'y') {
					intersteps = height / minDistance;
				}
				//V angle, quite special
				else if (lines.orientation === 'a') {
					intersteps = minDim * 2;
					sequence = [1.5, 3];
				}
				//)) radius
				else if (lines.orientation === 'r') {
					intersteps = (minDim / minDistance) / 2;
				}
				else {
					return values;
				}

				//find seq number closest to the scale
				let stepSize = (lines.max - lines.min) / Math.floor(intersteps);
				let order = magOrder(stepSize);

				stepSize = closestNumber(stepSize / order, sequence) * order;

				let start = stepSize * Math.ceil(lines.min / stepSize);

				for (let step = start; step <= lines.max; step += stepSize) {
					values.push(step);
				}
			}
			else {
				//FIXME: take into account min step
				if (lines.min <= 0 && lines.max >= 0) throw Error('Cannot create logarithmic grid spanning over zero, including zero');

				let order = magOrder(lines.min);

				[1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (base) {
					let start = base * order;
					for (let step = start; step <= Math.abs(lines.max); step *=10) {
						if (step < Math.abs(lines.min)) continue;
						values.push(step);
					}
				});

				values = values.sort();
			}

			return values;
		},
		labels: (value, lines, vp) => value.toLocalString() + lines.units,
		color: 'rgb(0,0,0)',
		opacity: .13,
		font: '13pt sans-serif',
	};
}
