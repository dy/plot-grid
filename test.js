const Grid = require('./');
const isBrowser = require('is-browser');
const createSettings = require('../settings-panel');
const insertCss = require('insert-styles');

insertCss(`
	body {
		margin: 0;
	}
`);


let padding = [60, 60, 60, 60]


let grid = Grid({
	viewport: function (w, h) {
		return [padding[0], padding[1], w - padding[2] - padding[0], h - padding[3] - padding[1]];
	},
	lines: [
		{
			min: 0,
			max: 100,
			orientation: 'x'
		},
		{
			min: 0,
			max: 100,
			orientation: 'y'
		}
	],
	axes: [true, true]
});



	// var grid = Grid({
	// 	viewport: function (w, h) {
	// 		return [60, 20, w - 80, h - 80];
	// 	},
	// 	lines: [
	// 		{
	// 			min: 20,
	// 			max: 20000,
	// 			orientation: 'x',
	// 			logarithmic: true,
	// 			titles: function (value) {
	// 				return value >= 1000 ? ((value / 1000).toFixed(0) + 'k') : value;
	// 			}
	// 		},
	// 		{
	// 			min: -100,
	// 			max: 0,
	// 			orientation: 'y'
	// 		},
	// 		{
	// 			min: 20,
	// 			max: 20000,
	// 			orientation: 'x',
	// 			logarithmic: true,
	// 			values: function (value) {
	// 				if (value.toString()[0] !== '1') return null;
	// 				return value;
	// 			},
	// 			style: {
	// 				borderLeftStyle: 'solid'
	// 			}
	// 		},
	// 	],
	// 	axes: [
	// 		{
	// 			labels: function (value, i, opt) {
	// 				if (value.toString()[0] !== '2' && value.toString()[0] !== '1' && value.toString()[0] !== '5') return null;
	// 				return opt.titles[i];
	// 			}
	// 		},
	// 		true
	// 	]
	// });


	// var grid = Grid({
	// 	viewport: function (w, h) {
	// 		return [60, 20, w - 80, h - 80];
	// 	},
	// 	lines: [
	// 		{
	// 			min: 0,
	// 			max: 100,
	// 			orientation: 'r'
	// 		},
	// 		{
	// 			min: -100,
	// 			max: 100,
	// 			orientation: 'a'
	// 		},
	// 		false
	// 	],

	// 	axes: [
	// 		true, {

	// 		}
	// 	]
	// });

window.addEventListener('resize', () => grid.update());




var settings = createSettings({
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
	opacity: {type: 'range', value: .135, min: 0, max: 1, change: c => {

	}},
	x: {type: 'raw', label: '<br/><strong>A lines</strong>', title: 'Horizontal'},
	xLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = grid.lines;
		lines[0].logarithmic = isLog;
		if (isLog) {
			lines[0].min = 1;
			lines[0].max = 10000;
		}
		else {
			lines[0].min = 0;
			lines[0].max = 100;
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
	xOrientation: { label: 'orientation', type: 'switch', options: ['x', 'y', 'r', 'θ'], value: 'x'},
	xRange: { type: 'interval', label: 'min..max', value: [1, 10000], min: 1, max: 20000, log: true },
	xAxis: { type: 'checkbox', label: 'axis', value: grid.axes[0], change: v => {
		let axes = grid.axes;
		axes[0] = v;
		grid.update({
			axes:  axes
		});
	}},

	y: {type: 'raw', label: '<br/><strong>B lines</strong>', title: 'Vertical'},
	yLog: { label: 'logarithmic', type: 'checkbox',	value: false, style: 'width: 50%', change: isLog => {
		let lines = grid.lines;
		lines[1].logarithmic = isLog;
		if (isLog) {
			lines[1].min = 1;
			lines[1].max = 10000;
		}
		else {
			lines[1].min = 0;
			lines[1].max = 100;
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
	yOrientation: { label: 'orientation', type: 'switch',	options: ['x', 'y', 'r', 'θ'], value: 'x'},
	yRange: { type: 'interval', label: 'min..max', value: [1, 10000], min: 1, max: 20000, log: true}
}, {
	theme: require('settings-panel/theme/control'),
	palette: ['white', 'black'],
	fontSize: 11,
	fontFamily: 'monospace',
	style: `position: absolute; top: 8px; right: 8px; width: 300px; z-index: 1; background: rgba(255,255,255,.9)`
});
