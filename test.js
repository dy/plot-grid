const Grid = require('./');
const isBrowser = require('is-browser');
const createSettings = require('../settings-panel');
const insertCss = require('insert-styles');

insertCss(`
	body {
		margin: 0;
		padding: 0;
	}

	.frame {
		margin-right: 300px;
		min-height: 100vh;
	}
`);


let frame = document.body.appendChild(document.createElement('div'));
frame.className = 'frame';


let padding = [60, 60, 60, 60];


let grid = Grid({
	container: frame,
	viewport: function (w, h) {
		return [padding[0], padding[1], w - padding[2] - padding[0], h - padding[3] - padding[1]];
	},
	lines: [
		{
			min: 0,
			max: 100,
			orientation: 'r'
		},
		{
			min: 0,
			max: 100,
			orientation: 'a'
		}
	],
	axes: [true, true]
});


window.addEventListener('resize', () => grid.update());




var settings = createSettings({
	type: {type: 'switch', value: 'Polar', options: {'Cartesian': '⊞', 'Polar': '⊗'}, change: v => {
		let lines = grid.lines;
		if (v === 'Polar') {
			settings.set('x', {label: '<br/>⊚', title: 'Radial lines'});
			settings.set('y', {label: '<br/>✳', title: 'Angular lines'});

			lines[0].orientation = 'r';
			lines[1].orientation = 'a';
		}
		else {
			settings.set('x', {label: '<br/>|||', title: 'Horizontal lines', style: 'letter-spacing: -.5ex;'});
			settings.set('y', {label: '<br/>☰', title: 'Vertical lines'});

			lines[0].orientation = 'x';
			lines[1].orientation = 'y';
		}

		grid.update({lines: lines});
	}},
	viewport: {
		type: 'text',
		value: padding,
		change: (v) => {
			padding = v.split(/\s*,\s*/).map(v => parseInt(v));
			grid.update();
		}
	},
	color: {type: 'color', value: getComputedStyle(grid.element).color, change: c => {
		grid.element.style.color = c;
	}},
	opacity: {type: 'range', value: .5, min: 0, max: 1, change: v => {
		grid.element.style.setProperty('--opacity', v);
	}},

	x: {type: 'raw', label: '<br/><strong>X lines</strong>', title: 'Horizontal'},
	xLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = grid.lines;
		lines[0].logarithmic = isLog;
		if (isLog) {
			lines[0].min = 1;
			lines[0].max = 10000;
			settings.set('xRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines[0].min = 0;
			lines[0].max = 100;
			settings.set('xRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});
		}
		grid.update({
			lines: lines
		});
	}},
	// xUnits: { label: 'units', type: 'text', value: '', change: v => {
	// 	let lines = grid.lines;
	// 	lines[0].units = v;
	// 	grid.update({
	// 		lines:  lines
	// 	});
	// }},
	xAxis: { type: 'checkbox', label: 'axis', value: grid.axes[0], change: v => {
		let axes = grid.axes;
		axes[0] = v;
		grid.update({
			axes:  axes
		});
	}},
	xRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = grid.lines;
		lines[0].min = v[0];
		lines[0].max = v[1];
		grid.update({
			lines: lines
		});
	}},

	y: {type: 'raw', label: '<br/><strong>Y lines</strong>', title: 'Vertical'},
	yLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = grid.lines;
		lines[1].logarithmic = isLog;
		if (isLog) {
			lines[1].min = 1;
			lines[1].max = 10000;
			settings.set('yRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines[1].min = 0;
			lines[1].max = 100;
			settings.set('yRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});
		}
		grid.update({
			lines: lines
		});
	}},
	yAxis: {type: 'checkbox', label: 'axis', value: grid.axes[1], change: v => {
		let axes = grid.axes;
		axes[1] = v;
		grid.update({
			axes:  axes
		});
	} },
	yRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = grid.lines;
		lines[1].min = v[0];
		lines[1].max = v[1];
		grid.update({
			lines: lines
		});
	}}
}, {
	title: '<a href="https://github.com/dfcreative/plot-grid">plot-grid</a>',
	theme: require('../settings-panel/theme/control'),
	fontSize: 11,
	// palette: ['black', 'white'],
	fontFamily: 'monospace',
	style: `position: absolute; top: 0px; right: 0px; padding: 20px; height: 100%; width: 300px; z-index: 1;`,
	css: '.settings-panel-title {text-align: left;}'
});
