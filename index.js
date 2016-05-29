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
var uid = require('get-uid');


module.exports = Grid;


function Grid (options) {
	if (!(this instanceof Grid)) return new Grid(options);

	extend(this, options);

	this.id = uid();

	if (!isBrowser) return;

	//obtian container
	this.container = options.container || document.body;
	this.container.classList.add(className);

	this.gridElement = document.createElement('div');
	this.gridElement.classList.add('grid');
	this.container.appendChild(this.gridElement);

	//ensure lines values
	this.lines = (options.lines || []).map((lines) => lines && extend(this.defaultLines, lines));
	this.axes = (options.axes || []).map((axis) => axis && extend(this.defaultAxis, axis));

	//create lines container
	this.linesContainer = document.createElement('div');
	this.gridElement.appendChild(this.linesContainer);
	this.linesContainer.classList.add('grid-lines');

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
	values: undefined,
	//copied from values
	titles: undefined
};

Grid.prototype.defaultAxis = {
	name: '',
	//detected from range
	values: undefined,
	//copied from values
	labels: undefined,
	//copied from labels
	titles: undefined
};

Grid.prototype.update = function (options) {
	options = options || {};

	var gridElement = this.gridElement;
	var linesContainer = this.linesContainer;
	var id = this.id;

	//set viewport
	if (options.viewport) this.viewport = options.viewport;
	var viewport = this.viewport;

	var w = this.container.offsetWidth;
	var h = this.container === document.body ? window.innerHeight : this.container.offsetHeight;

	if (viewport instanceof Function) {
		viewport = viewport(w, h);
	}

	if (!viewport) viewport = [0,0,w,h];

	gridElement.style.left = viewport[0] + (typeof viewport[0] === 'number' ? 'px' : '');
	gridElement.style.top = viewport[1] + (typeof viewport[1] === 'number' ? 'px' : '');
	gridElement.style.width = viewport[2] + (typeof viewport[2] === 'number' ? 'px' : '');
	gridElement.style.height = viewport[3] + (typeof viewport[3] === 'number' ? 'px' : '');

	//exceptional case of overflow:hidden
	// if (this.container === document.body) {
	// 	if (viewport[2] >= window.innerWidth || viewport[3] >= window.innerHeight) {
	// 		linesContainer.style.overflow = 'hidden';
	// 	}
	// 	else {
	// 		linesContainer.style.overflow = 'visible';
	// 	}
	// }

	//hide all lines first
	var lines = gridElement.querySelectorAll('.grid-line');
	for (var i = 0; i < lines.length; i++) {
		lines[i].setAttribute('hidden', true);
	}
	var labels = gridElement.querySelectorAll('.grid-label');
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
			lines = extend(this.lines[idx], options.lines[idx]);
		}
		stats.lines = lines;

		var linesMin = Math.min(lines.max, lines.min);
		var linesMax = Math.max(lines.min, lines.max);
		stats.min = linesMin;
		stats.max = linesMax;

		//detect steps, if not defined, as one per each 50px
		var values = [];
		var intersteps = (lines.orientation === 'x' ? (typeof viewport[2] === 'number' ? viewport[2] : linesContainer.clientWidth) : (typeof viewport[3] === 'number' ? viewport[3] : linesContainer.clientHeight)) / 50;
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

		values = lines.values instanceof Function ?
			values.map((v, i) => lines.values(v, i, stats), this).filter((v) => v != null) :
			lines.values || values;
		stats.values = values;

		//define titles
		var titles = lines.titles instanceof Function ? values.map((v, i) => lines.titles(v, i, stats), this) :
			lines.titles === undefined ? values.slice().map(function (value) {
			return value.toLocaleString();
		}) : lines.titles;
		stats.titles = titles;

		//draw lines
		var offsets = values.map(function (value, i) {
			var line = linesContainer.querySelector(`#grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${value|0}-${idx}-${id}`);
			var ratio;
			if (!line) {
				line = document.createElement('span');
				line.id = `grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${value|0}-${idx}-${id}`;
				line.classList.add('grid-line');
				line.classList.add(`grid-line-${lines.orientation}`);
				if (value === linesMin) line.classList.add('grid-line-min');
				if (value === linesMax) line.classList.add('grid-line-max');
				line.setAttribute('data-value', value);
				titles && line.setAttribute('title', titles[i]);
				linesContainer.appendChild(line);
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
				if (lines.style) {
					for (var prop in lines.style) {
						var val = lines.style[prop];
						if (typeof val === 'number') val += 'px';
						line.style[prop] = val;
					}
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
		var axis = this.axes[idx];

		//do not paint inexisting axis
		if (!axis) return;

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


		//put axis properly
		var axisEl = gridElement.querySelector(`#grid-axis-${lines.orientation}${lines.logarithmic?'-log':''}-${idx}-${id}`);
		if (!axisEl) {
			axisEl = document.createElement('span');
			axisEl.id = `grid-axis-${lines.orientation}${lines.logarithmic?'-log':''}-${idx}-${id}`;
			axisEl.classList.add('grid-axis');
			axisEl.classList.add(`grid-axis-${lines.orientation}`);
			axisEl.setAttribute('data-name', axis.name);
			axisEl.setAttribute('title', axis.name);
			gridElement.appendChild(axisEl);
		}
		axisEl.removeAttribute('hidden');

		//draw labels
		axisValues.forEach(function (value, i) {
			if (value == null || labels[i] == null) return;

			var label = gridElement.querySelector(`#grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${value|0}-${idx}-${id}`);
			if (!label) {
				label = document.createElement('label');
				label.id = `grid-label-${lines.orientation}${lines.logarithmic?'-log':''}-${value|0}-${idx}-${id}`;
				label.classList.add('grid-label');
				label.classList.add(`grid-label-${lines.orientation}`);
				label.setAttribute('data-value', value);
				label.setAttribute('for', `grid-line-${lines.orientation}${lines.logarithmic?'-log':''}-${value|0}-${idx}-${id}`);
				axisTitles && label.setAttribute('title', axisTitles[i]);
				label.innerHTML = labels[i];
				gridElement.appendChild(label);
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