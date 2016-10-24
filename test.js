require('enable-mobile');
const Grid = require('./gl');
const isBrowser = require('is-browser');
const createSettings = require('settings-panel');
const insertCss = require('insert-styles');
const createFps = require('fps-indicator');
const scale = require('mumath/scale');
const lg = require('mumath/log10');
const closest = require('mumath/closest');
const pad = require('left-pad');
const steps = require('./src/steps');

insertCss(`
	body {
		margin: 0;
		padding: 0;
	}
	.frame {
		display: block;
		overflow: hidden;
		min-height: 100vh;
	}

	@media (min-width:960px) {
		.frame {
			width: calc(100% - 300px);
		}
		.fps {
			right: 310px!important;
		}
	}
	@media (max-width:960px) {
		.settings-panel {
			display: none!important;
		}
		.frame {
			width: 100vw;
		}
		.fps {
			right: 10px!important;
		}
	}

	.fps {
		z-index: 2;
		font-size: 10px;
		top: 10px!important;
	}
`);


var frame = document.body.appendChild(document.createElement('div'));
frame.className = 'frame';


let fps = createFps({
	container: frame
});


var settings = createSettings([
	{id: 'use-case', type: 'select', value: 'dictaphone', hidden: true, options: {
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
				grid.update({x: {
					// offset:
				}, y: {

				}});
			}
			else if (v === 'spectrum') {

			}
			else if (v === 'dictaphone') {
				settings.set({
					x: true,
					xAxis: 0,
					xLines: false,
					y: true,
					yAxis: Infinity,
					yLines: false,

					r: false,
					a: false
				});


				grid.update({
					x: {
						lines: false,
						pan: true,
						axis: 0,
						font: '12pt sans-serif',
						offset: 0,
						scale: 10,
						minScale: .006,
						maxScale: 120*1000,
						axisWidth: 2,
						min: 0,
						origin: 0,
						tickAlign: 1,
						distance: 20,
						steps: [1, 2.5, 5],
						ticks: (state) => {
							let result = {};
							let {lines} = state;

							let minStep = lines.distance * lines.scale;

							let [step, largeStep] = steps.date(minStep);

							let start = Math.floor(state.offset/step)*step, end = Math.ceil((state.offset + state.range)/step)*step;
							start = Math.max(start, 0);

							for (let i = start; i < end; i+= step) {
								if (i % largeStep) result[i] = 5;
								else result[i] = 20;
							}

							return result;
						},
						labels: (state) => {
							let result = {};
							let {lines} = state;
							let minStep = lines.distance * lines.scale;

							let [step, largeStep] = steps.date(minStep);

							let start = Math.floor(state.offset/step)*step, end = Math.ceil((state.offset + state.range)/step)*step;
							start = Math.max(start, 0);

							function time(ts, showMs) {
								let ms = ts % 1000;
								let seconds = Math.floor(ts/1000) % 60;
								let minutes = Math.floor(ts/1000/60) % 60;
								let hours = Math.floor(ts/1000/60/60) % 60;
								let str = '';
								if (hours) str += pad(hours,2,0) + ':';
								str += pad(minutes,2,0) + ':';
								str += pad(seconds,2,0);
								if (showMs) str += ':' + pad(ms, 3, 0);
								return str;
							}

							for (let i = start; i < end; i+= step) {
								if (i % largeStep) result[i] = null;
								else result[i] = time(i, step < 100);
							}

							return result;
						}
					},
					y: {
						zoom: false,
						pan: false,
						axis: Infinity,
						distance: 20,
						lineColor: null,
						scale: 20/grid.viewport[3],
						labels: state => {
							return state.values.map(v => -Math.abs(v).toFixed(0));
						}
						// lines: false
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
	//x: {},
	// viewport: function (w, h) {
	// 	return [10, 10, w - 20, h - 20];
	// }
});

