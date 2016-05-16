/**
 * @module  plot-grid
 */

var extend = require('xtend');
var isBrowser = require('is-browser');
var lg = require('mumath/lg');
var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var sf = require('sheetify');
var className = sf('./index.css');
var closestNumber = require('mumath/closest');
var mag = require('mumath/order');
var within = require('mumath/within');


module.exports = Grid;


function Grid (options) {
	if (!(this instanceof Grid)) return new Grid(options);

	extend(this, options);

	if (!isBrowser) return;

	//obtian container
	this.container = options.container || document.body;
	this.container.classList.add(className);

	//display grid
	this.grid = document.createElement('div');
	this.grid.classList.add('grid');
	this.container.appendChild(this.grid);

	this.lines = (options.lines || []).map((lines) => extend(this.defaultLines, lines));
	this.axes = (options.axes || []).map((axis) => extend(this.defaultAxis, axis));

	this.update(options);
}


inherits(Grid, Emitter);


Grid.prototype.container = null;
Grid.prototype.viewport = null;

Grid.prototype.lines = null;
Grid.prototype.axes = null;

Grid.prototype.defaultLines = {
	orientation: 'x',
	logarithmic: false,
	min: 0,
	max: 100,
	//detected from range
	values: null,
	//copied from values
	titles: null
};

Grid.prototype.defaultAxis = {
	name: '',
	min: 0,
	max: 100,
	//detected from range
	values: null,
	//copied from values
	labels: null,
	//copied from labels
	titles: null
};

Grid.prototype.update = function (options) {
	options = options || {};

	var grid = this.grid;

	//set viewport
	if (options.viewport) this.viewport = options.viewport;
	var viewport = this.viewport;

	if (viewport instanceof Function) {
		viewport = viewport(
			this.container.offsetWidth,
			this.container === document.body ? window.innerHeight : this.container.offsetHeight
		);
	}

	this.grid.style.left = viewport[0] + (typeof viewport[0] === 'number' ? 'px' : '');
	this.grid.style.top = viewport[1] + (typeof viewport[1] === 'number' ? 'px' : '');
	this.grid.style.width = viewport[2] + (typeof viewport[2] === 'number' ? 'px' : '');
	this.grid.style.height = viewport[3] + (typeof viewport[3] === 'number' ? 'px' : '');

	//hide all lines first
	var lines = grid.querySelectorAll('.grid-line');
	for (var i = 0; i < lines.length; i++) {
		lines[i].setAttribute('hidden', true);
	}
	var labels = grid.querySelectorAll('.grid-label');
	for (var i = 0; i < labels.length; i++) {
		labels[i].setAttribute('hidden', true);
	}

	//set lines
	this.lines.forEach(function (lines, i) {
		if (options.lines) lines = extend(this.lines[i], options.lines[i]);

		//detect steps, if not defined, as one per each 50px
		var values = lines.values;
		if (!values) {
			values = [];
			var intersteps = (lines.orientation === 'x' ? (typeof viewport[2] === 'number' ? viewport[2] : this.grid.clientWidth) : (typeof viewport[3] === 'number' ? viewport[3] : this.grid.clientHeight)) / 50;
			if (intersteps < 1) {
				values = [lines.min, lines.max];
			} else {
				var stepSize = Math.abs(lines.max - lines.min) / Math.floor(intersteps);
				var order = mag(stepSize);

				stepSize = closestNumber(stepSize, [1, 2, 2.5, 5, 10].map((v) => v * order));

				if (lines.min > lines.max) {
					for (var step = lines.max; step <= lines.min; step += stepSize) {
						values.push(step);
					}
				}
				else {
					for (var step = lines.min; step <= lines.max; step += stepSize) {
						values.push(step);
					}
				}
			}
		}

		//define titles
		var titles = lines.titles || values.slice().map(function (value) {
			return value.toLocaleString();
		});

		//draw lines
		values.forEach(function (value, i) {
			var line = grid.querySelector(`#grid-line-${lines.orientation}-${value|0}`);
			if (!line) {
				line = document.createElement('span');
				line.id = `grid-line-${lines.orientation}-${value|0}`;
				line.classList.add('grid-line');
				line.classList.add(`grid-line-${lines.orientation}`);
				line.setAttribute('data-value', value);
				line.setAttribute('title', titles[i]);
				grid.appendChild(line);
				var ratio = value / Math.abs(lines.max - lines.min);
				if (!lines.logarithmic) ratio *= 100;
				if (lines.min > lines.max) ratio = 100 - ratio;
				if (lines.orientation === 'x') {
					line.style.left = ratio + '%';
				}
				else {
					line.style.top = (100 - ratio) + '%';
				}
			}
			line.removeAttribute('hidden');
		});


		//draw axes
		var axis = this.axes[i];

		//do not paint inexisting axis
		if (!axis) return;

		if (options.axes) axis = extend(this.axes[i], options.axes[i]);

		//define values
		var axisValues = axis.values || values;

		//define titles
		var axisTitles = axis.titles || axisValues.slice().map(function (value) {
			return value.toLocaleString();
		});

		//define labels
		var labels = axis.labels || axisTitles;

		var min = axis.min != null ? axis.min : lines.min;
		var max = axis.max != null ? axis.max : lines.max;

		//put axis properly
		var axisEl = grid.querySelector(`#grid-axis-${lines.orientation}`);
		if (!axisEl) {
			axisEl = document.createElement('span');
			axisEl.id = `grid-axis-${lines.orientation}`;
			axisEl.classList.add('grid-axis');
			axisEl.classList.add(`grid-axis-${lines.orientation}`);
			axisEl.setAttribute('data-name', axis.name);
			axisEl.setAttribute('title', axis.name);
			grid.appendChild(axisEl);

			var minRatio = min / Math.abs(lines.max - lines.min);

			if (!lines.logarithmic) minRatio *= 100;
			if (axis.orientation === 'x') {
				axisEl.style.left = minRatio + '%';
			}
			else {
				axisEl.style.bottom = minRatio + '%';
			}

			var maxRatio = 1 - max / Math.abs(lines.max - lines.min);

			if (!lines.logarithmic) maxRatio *= 100;
			if (axis.orientation === 'x') {
				axisEl.style.right = maxRatio + '%';
			}
			else {
				axisEl.style.top = maxRatio + '%';
			}
		}
		axisEl.removeAttribute('hidden');

		//draw labels
		axisValues.forEach(function (value, i) {
			var label = grid.querySelector(`#grid-label-${lines.orientation}-${value|0}`);
			if (!label) {
				label = document.createElement('label');
				label.id = `grid-label-${lines.orientation}-${value|0}`;
				label.classList.add('grid-label');
				label.classList.add(`grid-label-${lines.orientation}`);
				label.setAttribute('data-value', value);
				label.setAttribute('for', `grid-line-${lines.orientation}`);
				label.setAttribute('title', axisTitles[i]);
				label.innerHTML = labels[i];
				grid.appendChild(label);

				var ratio = value / Math.abs(lines.max - lines.min);
				if (!lines.logarithmic) ratio *= 100;
				if (lines.min > lines.max) ratio = 100 - ratio;
				if (lines.orientation === 'x') {
					label.style.left = ratio + '%';
				}
				else {
					label.style.top = (100 - ratio) + '%';
				}
			}

			if (within(value, min, max)) {
				label.removeAttribute('hidden');
			} else {
				label.setAttribute('hidden', true);
			}
		});

	}, this);


	//detect decades
	// var decades = Math.round(lg(this.maxFrequency/this.minFrequency));
	// var decadeOffset = lg(this.minFrequency/10);

	//draw magnitude limits
	// var mRange = this.maxDecibels - this.minDecibels;
	// for (var m = this.minDecibels, i = 0; m <= this.maxDecibels; m += 10, i += 10) {
	// 	line = document.createElement('span');
	// 	line.classList.add('grid-line');
	// 	line.classList.add('grid-line-v');
	// 	if (!i) line.classList.add('grid-line-first');
	// 	line.setAttribute('data-value', m.toLocaleString());
	// 	line.style.bottom = 100 * i / mRange + '%';
	// 	this.grid.appendChild(line);
	// }
	// line.classList.add('grid-line-last');


	/** Map frequency to an x coord */
	// function f2w (f, w, logarithmic) {
	// 	if (logarithmic) {
	// 		var decadeW = w / decades;
	// 		return decadeW * (lg(f) - 1 - decadeOffset);
	// 	} else {
	// 		return
	// 	}
	// };


	/** Map x coord to a frequency */
	function w2f (x, w) {
		var decadeW = w / decades;
		return Math.pow(10, x/decadeW + 1 + decadeOffset);
	};

	this.emit('update');

	return this;
};