/**
 * @module  plot-grid
 */

const extend = require('xtend/mutable');
const isBrowser = require('is-browser');
const lg = require('mumath/lg');
const Emitter = require('events').EventEmitter;
const inherits = require('inherits');
const closestNumber = require('mumath/closest');
const mod = require('mumath/mod');
const mag = require('mumath/order');
const within = require('mumath/within');
const uid = require('get-uid');
const insertStyles = require('insert-styles');
const fs = require('fs');

insertStyles(fs.readFileSync(__dirname + '/index.css'));


module.exports = Grid;

/**
 * @constructor
 */
function Grid (options) {
	if (!(this instanceof Grid)) return new Grid(options);

	extend(this, options);

	this.id = uid();

	if (!isBrowser) return;

	//obtian container
	this.container = options.container || document.body;
	if (typeof this.container === 'string') this.container = document.querySelector(this.container);
	this.container.classList.add('grid-container');

	this.element = document.createElement('div');
	this.element.classList.add('grid');
	this.container.appendChild(this.element);

	if (this.className) this.element.className += ' ' + this.className;

	//create lines container
	this.linesContainer = document.createElement('div');
	this.element.appendChild(this.linesContainer);
	this.linesContainer.classList.add('grid-lines');

	this.update(options);
}

inherits(Grid, Emitter);


Grid.prototype.container = null;
Grid.prototype.viewport = null;

Grid.prototype.lines = null;
Grid.prototype.axes = null;

Grid.prototype.prefixes = {
	8: 'Y', // yotta
	7: 'Z', // zetta
	6: 'E', // exa
	5: 'P', // peta
	4: 'T', // tera
	3: 'G', // giga
	2: 'M', // mega
	1: 'k', // kilo
	0: '',
	'-1': 'm', // milli
	'-2': 'µ', // micro
	'-3': 'n', // nano
	'-4': 'p', // pico
	'-5': 'f', // femto
	'-6': 'a', // atto
	'-7': 'z', // zepto
	'-8': 'y'  // ycoto
};

Grid.prototype.defaultLines = {
	orientation: 'x',
	logarithmic: false,
	min: 0,
	max: 100,
	//detected from range
	values: undefined,
	//copied from values
	titles: undefined,
	format: true,
	units: ''
};

Grid.prototype.defaultAxis = {
	name: '',
	//detected from range
	values: undefined,
	//copied from values
	labels: undefined,
	//copied from labels
	titles: undefined,
	format: true,
	units: ''
};

Grid.prototype.update = function (options) {
	options = options || {};

	var that = this;

	var element = this.element;
	var linesContainer = this.linesContainer;
	var id = this.id;

	//set viewport
	if (options.viewport) this.viewport = options.viewport;
	var viewport = this.viewport;

	//hide element to avoid live calc
	element.setAttribute('hidden', true);

	var w = this.container.offsetWidth;
	var h = this.container === document.body ? window.innerHeight : this.container.offsetHeight;

	//calc viewport
	if (viewport instanceof Function) {
		viewport = viewport(w, h);
	}

	if (!viewport) viewport = [0,0,w,h];
	if (viewport[2] < 0 || viewport[3] < 0) throw 'Viewport size is negative, probably because grid container size is 0 or something. Please, check the container size.';

	element.style.left = viewport[0] + (typeof viewport[0] === 'number' ? 'px' : '');
	element.style.top = viewport[1] + (typeof viewport[1] === 'number' ? 'px' : '');
	element.style.width = viewport[2] + (typeof viewport[2] === 'number' ? 'px' : '');
	element.style.height = viewport[3] + (typeof viewport[3] === 'number' ? 'px' : '');


	//ensure lines values are not empty
	this.lines = this.lines || [];
	if (options.lines) {
		this.lines = options.lines.map((lines, i) => lines && extend({}, this.defaultLines, this.lines[i], lines));
	}
	this.axes = this.axes || [];
	if (options.axes) {
		this.axes = options.axes.map((axis, i) => axis && extend({}, this.defaultAxis, this.lines[i], axis));
	}

	//exceptional case of overflow:hidden
	// if (this.container === document.body) {
	// 	if ((viewport[0] + viewport[2]) >= window.innerWidth || (viewport[1] + viewport[3]) >= window.innerHeight) {
	// 		linesContainer.style.overflow = 'hidden';
	// 	}
	// 	else {
	// 		linesContainer.style.overflow = 'visible';
	// 	}
	// }

	//hide all lines, labels, axes first
	var lines = element.querySelectorAll('.grid-line');
	for (var i = 0; i < lines.length; i++) {
		lines[i].setAttribute('hidden', true);
	}
	var axes = element.querySelectorAll('.grid-axis');
	for (var i = 0; i < axes.length; i++) {
		axes[i].setAttribute('hidden', true);
	}
	var labels = element.querySelectorAll('.grid-label');
	for (var i = 0; i < labels.length; i++) {
		labels[i].setAttribute('hidden', true);
	}

	//set lines
	this.lines.forEach(function (lines, idx) {
		if (!lines) return;

		//temp object keeping state of current lines run
		var stats = {
			linesContainer: linesContainer,
			idx: idx,
			id: id
		};

		if (options.lines) {
			if (options.lines[idx] && options.lines[idx].style) {
				this.lines[idx].style = extend(this.lines[idx].style, options.lines[idx].style);
				delete options.lines[idx].style;
			}
			this.lines[idx] = lines = extend(this.lines[idx], options.lines[idx]);
		}
		stats.lines = lines;
		var linesMin = Math.min(lines.max, lines.min);
		var linesMax = Math.max(lines.min, lines.max);
		stats.min = linesMin;
		stats.max = linesMax;

		//detect steps, if not defined, as one per each 50px
		var values = [];
		var minW = Math.min(viewport[2], viewport[3]);
		var intersteps = (lines.orientation === 'x' ? (typeof viewport[2] === 'number' ? viewport[2] : linesContainer.clientWidth) : lines.orientation === 'y' ? (typeof viewport[3] === 'number' ? viewport[3] : linesContainer.clientHeight) : /a/.test(lines.orientation) ? minW * 2 : minW ) / 50 ;
		if (intersteps < 1) {
			values = [linesMin, linesMax];
		}
		//for non-log scale do even distrib
		else if (!lines.logarithmic) {
			var stepSize = (linesMax - linesMin) / Math.floor(intersteps);
			var order = mag(stepSize);

			let scale = /a/.test(lines.orientation) ? [1.5, 3] : [1, 2, 2.5, 5, 10];

			stepSize = closestNumber(stepSize, scale.map((v) => v * order));

			var start = stepSize * Math.round(linesMin / stepSize);

			for (var step = start; step <= linesMax; step += stepSize) {
				if (step < linesMin) continue;
				values.push(step);
			}
		}
		else {
			//each logarithmic divisor
			if (linesMin <= 0 && linesMax >= 0) throw Error('Cannot create logarithmic grid spanning over zero, including zero');

			[1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (base) {
				var order = mag(linesMin);
				var start = base * order;
				for (var step = Math.abs(start); step <= Math.abs(linesMax); step *=10) {
					if (step < Math.abs(linesMin)) continue;
					values.push(step);
				}
			});
		}


		values = lines.values instanceof Function ?
			values.map((v, i) => lines.values(v, i, stats), this).filter((v) => v != null) :
			lines.values || values;

		//to avoid collisions
		values = values.sort((a, b) => a - b);

		stats.values = values;

		//define titles
		var titles = lines.titles instanceof Function ? values.map((v, i) => lines.titles(v, i, stats), this) :
			lines.titles === undefined ? values.map(function (value) {
				let order = mag(value);
				let power = Math.floor(Math.log(order) / Math.log(1000));
				if (lines.format && that.prefixes[power]) {
					if (power > 1) value /= (power*1000);
					return value.toLocaleString() + that.prefixes[power] + lines.units;
				}
				else {
					return value.toLocaleString() + lines.units;
				}
		}) : lines.titles;
		stats.titles = titles;

		//draw lines
		var offsets = values.slice().reverse().map(function (value, i) {
			var line = linesContainer.querySelector(`#grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`);
			var ratio;
			if (!line) {
				line = document.createElement('span');
				line.id = `grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`;
				line.classList.add('grid-line');
				line.classList.add(`grid-line-${lines.orientation}`);
				if (value === linesMin) line.classList.add('grid-line-min');
				if (value === linesMax) line.classList.add('grid-line-max');
				line.setAttribute('data-value', value);

				linesContainer.appendChild(line);
			}

			titles && line.setAttribute('title', titles[values.length - 1 - i]);

			if (!lines.logarithmic) {
				ratio = (value - linesMin) / (linesMax - linesMin);
			}
			else {
				ratio = (lg(value) - lg(linesMin)) / (lg(linesMax) - lg(linesMin));
			}
			if (lines.min > lines.max) ratio = 1 - ratio;

			ratio *= 100;
			if (lines.orientation === 'x') {
				line.style.left = ratio + '%';
			}
			else if (lines.orientation === 'y' ) {
				line.style.top = (100 - ratio) + '%';
			}
			else if (/r/.test(lines.orientation)) {
				line.style.marginLeft = -minW*ratio*.005 + 'px';
				line.style.marginTop = -minW*ratio*.005 + 'px';
				line.style.width = minW*ratio*.01 + 'px';
				line.style.height = minW*ratio*.01 + 'px';
				line.style.borderRadius = minW + 'px';
			}
			else if (/a/.test(lines.orientation)) {
				if (ratio && !mod(ratio/100 * 360, 360)) {
					linesContainer.removeChild(line);
				}
				line.style.width = minW / 2 + 'px';
				line.style.transform = `rotate(${-ratio * 360 / 100}deg)`;
			}

			if (lines.style) {
				for (var prop in lines.style) {
					var val = lines.style[prop];
					if (typeof val === 'number') val += 'px';
					line.style[prop] = val;
				}
			}
			line.removeAttribute('hidden');

			return ratio;
		}).reverse();
		stats.offsets = offsets;

		//draw axes
		var axis = this.axes[idx];

		//get axis element
		var axisEl = element.querySelector(`#grid-axis-${lines.orientation}${lines.logarithmic?'-log':''}-${idx}-${id}`);

		//do not paint inexisting axis
		if (!axis) {
			axisEl && axisEl.setAttribute('hidden', true);
			return this;
		}
		else {
			axisEl && axisEl.removeAttribute('hidden');
		}

		if (options.axes) axis = extend(this.axes[idx], options.axes[idx]);
		stats.axis = axis;

		//define values
		var axisValues = axis.values || values;
		stats.axisValues = axisValues;

		//define titles
		var axisTitles = axis.titles instanceof Function ? axisValues.map((v, i) => axis.titles(v, i, stats), this) : axis.titles ? axis.titles : axisValues === values ? titles : axis.titles === undefined ? axisValues.slice().map(function (value) {
			return value.toLocaleString();
		}) : axis.titles;
		stats.axisTitles = axisTitles;

		//define labels
		var labels = axis.labels instanceof Function ? axisValues.map((v, i) => axis.labels(v, i, stats), this) : axis.labels || axisTitles;
		stats.labels = labels;

		if (!axisEl) {
			axisEl = document.createElement('span');
			axisEl.id = `grid-axis-${lines.orientation}${lines.logarithmic?'-log':''}-${idx}-${id}`;
			axisEl.classList.add('grid-axis');
			axisEl.classList.add(`grid-axis-${lines.orientation}`);
			axisEl.setAttribute('data-name', axis.name);
			axisEl.setAttribute('title', axis.name);
			element.appendChild(axisEl);

		}
		if (/a/.test(lines.orientation)) {
			axisEl.style.marginLeft = -minW*100*.005 + 'px';
			axisEl.style.marginTop = -minW*100*.005 + 'px';
			axisEl.style.width = minW*100*.01 + 'px';
			axisEl.style.height = minW*100*.01 + 'px';
			axisEl.style.borderRadius = minW + 'px';
		}
		else if (/r/.test(lines.orientation)) {
			axisEl.style.marginTop = -minW*100*.005 + 'px';
			axisEl.style.height = minW*100*.01 + 'px';
		}

		axisEl.removeAttribute('hidden');

		//draw labels
		axisValues.forEach(function (value, i) {
			if (value == null || labels[i] == null) return;

			if (lines.orientation === 'x' || lines.orientation === 'y') {
				let label = element.querySelector(`#grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`);

				if (!label) {
					label = document.createElement('label');
					label.id = `grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`;
					label.classList.add('grid-label');
					label.classList.add(`grid-label-${lines.orientation}`);
					label.setAttribute('for', `grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`);
					element.appendChild(label);
				}

				label.innerHTML = labels[i];

				axisTitles && label.setAttribute('title', axisTitles[i]);

				label.setAttribute('data-value', value);

				//hide label for special log case to avoid overlapping
				if (lines.logarithmic) {
					hideLogLabel(label, value, intersteps);
				}

				if (lines.orientation === 'x') {
					label.style.left = offsets[i] + '%';
				}
				else if (lines.orientation === 'y') {
					label.style.top = (100 - offsets[i]) + '%';
				}

				if (within(value, linesMin, linesMax)) {
					label.removeAttribute('hidden');
				} else {
					label.setAttribute('hidden', true);
				}
			}
			else if (/r/.test(lines.orientation)) {
				let labelTop = element.querySelector(`#grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}-top`);
				let labelBottom = element.querySelector(`#grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}-bottom`);

				if (!labelTop) {
					labelTop = document.createElement('label');
					labelTop.id = `grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}-top`;
					labelTop.classList.add('grid-label');
					labelTop.classList.add(`grid-label-${lines.orientation}`);
					labelTop.setAttribute('for', `grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`);
					element.appendChild(labelTop);
				}

				labelTop.innerHTML = labels[i];

				axisTitles && labelTop.setAttribute('title', axisTitles[i]);

				labelTop.setAttribute('data-value', value);

				if(!labelBottom) {
					labelBottom = labelTop.cloneNode();
					labelBottom.id = `grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}-bottom`;
					if (offsets[i]) {
						element.appendChild(labelBottom);
					}
				}

				labelBottom.innerHTML = labels[i];

				// labelTop.style.marginTop = -(minW*.5*offsets[i]/100) + 'px';
				// labelBottom.style.marginTop = (minW*.5*offsets[i]/100) + 'px';
				labelTop.style.top = viewport[3]/2 - (minW*.5*offsets[i]/100) + 'px';
				labelBottom.style.top = viewport[3]/2 + (minW*.5*offsets[i]/100) + 'px';

				if (within(value, linesMin, linesMax)) {
					labelTop.removeAttribute('hidden');
					labelBottom.removeAttribute('hidden');
				} else {
					labelTop.setAttribute('hidden', true);
					labelBottom.setAttribute('hidden', true);
				}

				//hide label for special log case to avoid overlapping
				if (lines.logarithmic) {
					hideLogLabel(labelTop, value, intersteps * 1.7);
					hideLogLabel(labelBottom, value, intersteps * 1.7);
				}
			}
			else if (/a/.test(lines.orientation)) {
				let label = element.querySelector(`#grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}-top`);

				if (!label) {
					label = document.createElement('label');
					label.id = `grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}-top`;
					label.classList.add('grid-label');
					label.classList.add(`grid-label-${lines.orientation}`);
					label.setAttribute('for', `grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${formatValue(value)}-${idx}-${id}`);
					element.appendChild(label);
				}

				label.innerHTML = labels[i];

				axisTitles && label.setAttribute('title', axisTitles[i]);

				label.setAttribute('data-value', value);

				let angle = offsets[i] * Math.PI / 50;
				let angleDeg = offsets[i] * 3.6;
				// label.style.transform = `rotate(${angle}deg)`;
				label.style.left = viewport[2]/2 + Math.cos(angle) * minW/2 + 'px';
				label.style.top = viewport[3]/2 -Math.sin(angle) * minW/2 + 'px';
				label.style.marginTop = (-Math.sin(angle) * .8 - .4) + 'rem';
				label.style.marginLeft = -1 + (Math.cos(angle)) + 'rem';

				if (within(value, linesMin, linesMax) && angleDeg < 360 ) {
					label.removeAttribute('hidden');
				} else {
					label.setAttribute('hidden', true);
				}
			}
		});


		//bloody helpers

		function hideLogLabel (label, value, intersteps) {
			let start = parseInt(value.toExponential()[0]);

			if (values.length > intersteps * 2.8) {
				if (start == 2) label.innerHTML = '';
			}
			if (values.length > intersteps * 2.6) {
				if (start == 5) label.innerHTML = '';
			}
			if (values.length > intersteps * 2.3) {
				if (start == 3) label.innerHTML = '';
			}
			if (values.length > intersteps * 2) {
				if (start == 7) label.innerHTML = '';
			}
			if (values.length > intersteps * 1.7) {
				if (start == 4) label.innerHTML = '';
			}
			if (values.length > intersteps * 1.5) {
				if (start == 6) label.innerHTML = '';
			}
			if (values.length > intersteps * 1.2) {
				if (start == 8) label.innerHTML = '';
			}
			if (values.length > intersteps * .9) {
				if (start == 9) label.innerHTML = '';
			}
		}

	}, this);

	element.removeAttribute('hidden');

	this.emit('update');

	return this;
};

function formatValue (v) {
	return v.toExponential().replace('.', '-').replace('+', '-');
}

