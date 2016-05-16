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
		//temp object keeping state of current lines run
		var stats = {};

		if (options.lines) lines = extend(this.lines[i], options.lines[i]);
		stats.lines = lines;

		var linesMin = Math.min(lines.max, lines.min);
		var linesMax = Math.max(lines.min, lines.max);
		stats.min = linesMin;
		stats.max = linesMax;

		//detect steps, if not defined, as one per each 50px
		var values = lines.values;
		if (!values) {
			values = [];
			var intersteps = (lines.orientation === 'x' ? (typeof viewport[2] === 'number' ? viewport[2] : this.grid.clientWidth) : (typeof viewport[3] === 'number' ? viewport[3] : this.grid.clientHeight)) / 50;
			if (intersteps < 1) {
				values = [linesMin, linesMax];
			}
			else if (!lines.logarithmic) {
				var stepSize = (linesMax - linesMin) / Math.floor(intersteps);
				var order = mag(stepSize);

				stepSize = closestNumber(stepSize, [1, 2, 2.5, 5, 10].map((v) => v * order));

				var start = stepSize * Math.round(linesMin / stepSize);

				for (var step = start; step <= linesMax; step += stepSize) {
					if (step < linesMin) continue;
					values.push(step);
				}
			}
			else {
				//each logarithmic divisor
				if (linesMin < 0 && linesMax > 0) throw Error('Cannot create logarithmic grid spanning over zero');

				[1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (base) {
					var order = mag(linesMin);
					var start = base * order;
					for (var step = start; step <= linesMax; step *=10) {
						if (step < linesMin) continue;
						values.push(step);
					}
				});
			}
		}
		stats.values = values;

		//define titles
		var titles = lines.titles instanceof Function ? values.map((v, i) => lines.titles(v, i, stats), this) :
			lines.titles || values.slice().map(function (value) {
			return value.toLocaleString();
		});
		stats.titles = titles;

		//draw lines
		var offsets = values.map(function (value, i) {
			var line = grid.querySelector(`#grid-line-${lines.orientation}-${value|0}`);
			var ratio;
			if (!line) {
				line = document.createElement('span');
				line.id = `grid-line-${lines.orientation}-${value|0}`;
				line.classList.add('grid-line');
				line.classList.add(`grid-line-${lines.orientation}`);
				line.setAttribute('data-value', value);
				line.setAttribute('title', titles[i]);
				grid.appendChild(line);
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
				else {
					line.style.top = (100 - ratio) + '%';
				}
			}
			else {
				ratio = parseFloat(line.getAttribute('data-value'));
			}
			line.removeAttribute('hidden');

			return ratio;
		});
		stats.offsets = offsets;


		//draw axes
		var axis = this.axes[i];

		//do not paint inexisting axis
		if (!axis) return;

		if (options.axes) axis = extend(this.axes[i], options.axes[i]);
		stats.axis = axis;

		//define values
		var axisValues = axis.values || values;
		stats.axisValues = axisValues;

		//define titles
		var axisTitles = axis.titles instanceof Function ? axisValues.map((v, i) => axis.titles(v, i, stats), this) : axis.titles ? axis.titles : axisValues === values ? titles : axisValues.slice().map(function (value) {
			return value.toLocaleString();
		});
		stats.axisTitles = axisTitles;

		//define labels
		var labels = axis.labels instanceof Function ? axisValues.map((v, i) => axis.labels(v, i, stats), this) : axis.labels || axisTitles;
		stats.labels = labels;


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
		}
		axisEl.removeAttribute('hidden');

		//draw labels
		axisValues.forEach(function (value, i) {
			if (value == null || labels[i] == null) return;

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
				if (lines.orientation === 'x') {
					label.style.left = offsets[i] + '%';
				}
				else {
					label.style.top = (100 - offsets[i]) + '%';
				}
			}

			if (within(value, linesMin, linesMax)) {
				label.removeAttribute('hidden');
			} else {
				label.setAttribute('hidden', true);
			}
		});

	}, this);

	this.emit('update');

	return this;
};