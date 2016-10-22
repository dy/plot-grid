require('enable-mobile');
const Grid = require('./gl');
const isBrowser = require('is-browser');
const createSettings = require('settings-panel');
const insertCss = require('insert-styles');
const createFps = require('fps-indicator');


insertCss(`
	body {
		margin: 0;
		padding: 0;
	}

	.frame {
		width: calc(100% - 300px);
		min-height: 100vh;
	}

	.fps {
		z-index: 2;
		right: 300px;
	}
`);


var frame = document.body.appendChild(document.createElement('div'));
frame.className = 'frame';


let fps = createFps({
	container: frame
});
fps.element.style.right = '310px';
fps.element.style.top = '10px';


var settings = createSettings([
	{id: 'use-case', type: 'select', value: 'default', options: {
			'default': '⊞ Default',
			'spectrum': '♒ Spectrum',
			'dictaphone': '┈ Dictaphone',
			'multigrid': '⧉ Multigrid',
			'polar': '⊕ Polar'
		}, change: v => {
			if (v === 'default') {
				settings.set({
					x: true,
					xAxis: 0,
					y: true,
					yAxis: 0,
					r: false,
					a: false
				});
				let lines = {
					axis: 0,
					// distance: 15,
					// steps: [1],
					// labels: (values, lines, vp, grid) => {
					// 	let step = lines.step;
					// 	let stepSize = step/lines.scale;
					// 	let w = Math.max(vp[3], vp[2]);

					// 	//usually ~50 steps per screen
					// 	let stepNumber = w/stepSize;

					// 	let nextStep;

					// 	if (stepNumber < 15) {
					// 		nextStep = 2*step;
					// 	}
					// 	else if (stepNumber < 30) {
					// 		nextStep = 5*step;
					// 	}
					// 	else {
					// 		nextStep = 10*step;
					// 	}

					// 	return values.map(v => {
					// 		if (v % nextStep) return '';
					// 		return v.toString();
					// 	});
					// },
					// ticks: (values, lines, vp, grid) => {
					// 	let step = lines.step;
					// 	let stepSize = step/lines.scale;
					// 	let w = Math.max(vp[3], vp[2]);

					// 	//usually ~50 steps per screen
					// 	let stepNumber = w/stepSize;

					// 	let nextStep;

					// 	if (stepNumber < 15) {
					// 		nextStep = 2*step;
					// 	}
					// 	else if (stepNumber < 30) {
					// 		nextStep = 5*step;
					// 	}
					// 	else {
					// 		nextStep = 10*step;
					// 	}

					// 	return values.map(v => {
					// 		if (v % nextStep) return 0;
					// 		return 5;
					// 	});
					// },
				};
				grid.update({x: lines, y: lines});
			}
			else if (v === 'spectrum') {

			}
			else if (v === 'dictaphone') {
				settings.set({
					x: true,
					xAxis: 0,
					xLines: false,
					y: true,
					yAxis: 0,
					yLines: false,

					r: false,
					a: false
				});
				grid.update({
					x: {

					},
					y: {

					}
				});
			}
			else if (v === 'multigrid') {

			}
			else if (v === 'polar') {

			}
		}
	},
	{content: '<br/>'},

	// viewport: {
	// 	type: 'text',
	// 	value: [0,0,0,0],
	// 	change: (v) => {
	// 		grid.updateViewport();
	// 		grid.update();
	// 	}
	// },


	// color: {type: 'color', value: 'rgb(0, 0, 0)', change: c => {
	// 	grid.update({x:{color: c}, y:{color: c}, r:{color: c}, a:{color: c}});
	// }},


	{id: 'x', label: '|||', title: 'Horizontal X lines', value: true, change: v => {
		grid.update({x: {disable: !v}});
	}},
	{id: 'xLog', label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		if (!settings.get('x')) return;
		let lines = {x:{}};
		lines.x.log = isLog;
		grid.update(lines);
	}},
	// {id: 'xAxis', type: 'range', label: 'axis', value: 0, min: -100, max: 100, change: v => {
	// 	if (!settings.get('x')) return;
	// 	grid.update({x: {
	// 		axis: v
	// 	}});
	// }},
	{id: 'xAxis', type: 'switch', label: 'axis', value: 0, options: ['none', 'top', 'bottom', 0], change: v => {
		if (!settings.get('x')) return;
		grid.update({x: {
			axis: v === 'none' ? false : v
		}});
	}},

	{content: '<br/>'},

	{id: 'y', label: '☰', title: 'Horizontal Y lines', value: true, change: v => {
		grid.update({y: {disable: !v}});
	}},
	{id: 'yLog', label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		if (!settings.get('y')) return;
		let lines = {y:{}};
		lines.y.log = isLog;
		grid.update(lines);
	}},
	// {id: 'yAxis', type: 'checkbox', label: 'axis', value: true, change: v => {
	// 	if (!settings.get('y')) return;
	// 	grid.update({y:{axis: v}});
	// }},
	// {id: 'yAxis', type: 'range', label: 'axis', value: 0, min: -100, max: 100, change: v => {
	// 	if (!settings.get('y')) return;
	// 	grid.update({y:{axis: v}});
	// }},
	{id: 'yAxis', type: 'switch', label: 'axis', value: 0, options: ['none', 'left', 'right', 0], change: v => {
		if (!settings.get('y')) return;
		grid.update({y:{axis: v === 'none' ? false : v}});
	}},

	{content: '<br/>'},

	{id: 'r', label: '⊚', title: 'Radial R lines', value: false, change: v => {
		grid.update({r: {disable: !v}});
	}},
	{id: 'rLog', label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = {r:{}};
		lines.r.log = isLog;
		grid.update(lines);
	}},
	{id: 'rAxis', type: 'checkbox', label: 'axis', value: true, change: v => {
		grid.update({r:{axis: v}});
	}},

	{content: '<br/>'},

	{id: 'a', label: '✳', title: 'Angular α lines', value: false, change: v => {
		grid.update({a: {disable: !v}});
	}},
	{id: 'aLog', label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = {a:{}};
		lines.a.log = isLog;
		grid.update(lines);
	}},
	{id: 'aAxis', type: 'checkbox', label: 'axis', value: true, change: v => {
		grid.update({a:{axis: v}});
	}},
], {
	title: '<a href="https://github.com/dfcreative/plot-grid">plot-grid</a>',
	theme: require('settings-panel/theme/control'),
	fontSize: 11,
	palette: ['rgb(30,30,30)', 'rgb(220,220,220)'],
	fontFamily: 'monospace',
	style: `position: absolute; top: 0px; right: 0px; padding: 20px; height: 100%; width: 300px; z-index: 1;`,
	css: '.settings-panel-title {text-align: left;}'
});


//create grid
var grid = Grid({
	container: frame,
	x: {},
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
