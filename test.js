const Grid = require('./2d');
const isBrowser = require('is-browser');
const createSettings = require('settings-panel');
const insertCss = require('insert-styles');

// prepare mobile
// var meta = document.createElement('meta')
// meta.setAttribute('name', 'viewport')
// meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0')
// document.head.appendChild(meta)


insertCss(`
	body {
		margin: 0;
		padding: 0;
	}

	.frame {
		width: calc(100% - 300px);
		min-height: 100vh;
	}
`);


var frame = document.body.appendChild(document.createElement('div'));
frame.className = 'frame';




var settings = createSettings({
	type: {type: 'switch', value: 'Cartesian', options: {'Cartesian': '⊞', 'Polar': '⊗'}, change: v => {
		if (v === 'Polar') {
			settings.set('x', {label: '<br/>⊚', title: 'Radial lines'});
			settings.set('y', {label: '<br/>✳', title: 'Angular lines'});
			settings.set('yRange', {min: 0, max: 360, step: 1, value: [0, 360], scale: 'linear'});

			grid.update([{ orientation: 'r'}, {orientation: 'a'}]);
		}
		else {
			settings.set('x', {label: '<br/>|||', title: 'Horizontal lines', style: 'letter-spacing: -.5ex;'});
			settings.set('y', {label: '<br/>☰', title: 'Vertical lines'});

			grid.update([{ orientation: 'x'}, {orientation: 'y'}]);
		}
	}},
	// viewport: {
	// 	type: 'text',
	// 	value: [0,0,0,0],
	// 	change: (v) => {
	// 		grid.updateViewport();
	// 		grid.update();
	// 	}
	// },
	color: {type: 'color', value: 'rgb(0, 0, 0)', change: c => {
		grid.update([{color: c}, {color: c}]);
	}},
	opacity: {type: 'range', value: .5, min: 0, max: 1, change: v => {
		grid.update([{opacity: v}, {opacity: v}]);
	}},

	x: {type: 'raw', label: '<br/><strong>X lines</strong>', title: 'Horizontal'},
	xLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = [{}];
		lines[0].log = isLog;
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
		grid.update(lines);
	}},
	// xUnits: { label: 'units', type: 'text', value: '', change: v => {
	// 	let lines = grid.lines;
	// 	lines[0].units = v;
	// 	grid.update({
	// 		lines:  lines
	// 	});
	// }},
	xAxis: { type: 'checkbox', label: 'axis', value: true, change: v => {
		grid.update([{
			axis: v
		}]);
	}},
	xRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = [{}];
		lines[0].min = v[0];
		lines[0].max = v[1];
		grid.update(lines);
	}},

	y: {type: 'raw', label: '<br/><strong>Y lines</strong>', title: 'Vertical'},
	yLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = [null, {}];
		lines[1].log = isLog;
		if (isLog) {
			lines[1].min = 1;
			lines[1].max = 10000;
			settings.set('yRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines[1].min = 0;
			lines[1].max = 100;
			if (settings.get('type') === 'Polar') {
				settings.set('yRange', {min: 0, max: 360, step: 1, value: [0, 360], scale: 'linear'});
			}
			else {
				settings.set('yRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});
			}
		}
		grid.update(lines);
	}},
	yAxis: {type: 'checkbox', label: 'axis', value: true, change: v => {
		grid.update([null, {axis: v}]);
	}},
	yRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = [null, {}];
		lines[1].min = v[0];
		lines[1].max = v[1];
		grid.update(lines);
	}}
}, {
	title: '<a href="https://github.com/dfcreative/plot-grid">plot-grid</a>',
	theme: require('settings-panel/theme/control'),
	fontSize: 11,
	// palette: ['black', 'white'],
	fontFamily: 'monospace',
	style: `position: absolute; top: 0px; right: 0px; padding: 20px; height: 100%; width: 300px; z-index: 1;`,
	css: '.settings-panel-title {text-align: left;}'
});


//create grid
var grid = Grid([
	{
		min: 0,
		max: 100,
		orientation: 'x'
	},
	{
		min: 0,
		max: 100,
		orientation: 'y'
	}], {
	container: frame,
	viewport: function (w, h) {
		return [10, 10, w - 20, h - 20];

		// let padding = settings.get('viewport');
		// if (typeof padding === 'string') {
		// 	padding = padding.split(/\s*,\s*/).map(v => parseInt(v));
		// }
		// return [padding[0], padding[1], w - padding[2] - padding[0], h - padding[3] - padding[1]];
	}
});


window.addEventListener('resize', () => grid.update());
