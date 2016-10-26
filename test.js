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
const range = require('just-range');

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
	{id: 'use-case', type: 'select', value: 'spectrum', options: {
			'default': '⊞ Default',
			'spectrum': '♒ Spectrum',
			'dictaphone': '┈ Dictaphone',
			// 'multigrid': '⧉ Multigrid',
			// 'polar': '⊕ Polar'
		}, change: v => {
			if (v === 'default') {
				grid.update({
					x: Grid.prototype.x,
					y: Grid.prototype.y
				});
			}
			//FIXME: add type = log, time, linear to options
			else if (v === 'spectrum') {
				grid.update({
					x: {
						offset: 0,
						origin: 0,
						distance: 10,
						scale: 1/grid.viewport[2],
						steps: [1],
						maxScale: .4,
						lines: state => {
							let res = [];
							let lines = state.lines;

							//get log range numbers
							let logMinStep = lines.distance * lines.scale;
							let logMin = state.offset, logMax = state.offset + state.range;
							let logRange = state.range;

							//get linear range numbers
							let realMinStep = Math.pow(10, logMinStep);
							let min = Math.pow(10, logMin),
								max = Math.pow(10, logMax);

							//calc power steps
							let logStep = Math.ceil(logMinStep);
							let step10 = Math.pow(10, logStep);
							state.logStep = logStep;


							let start = Math.pow(10, Math.floor(logMin/logStep)*logStep);

							for (let order = start; order <= max; order *= step10 ) {
								//not enough subdivisions - display only order lines
								if (1/.5 < realMinStep) {
									res = res.concat(lg(order));
									// state.logSteps = [logStep];
								}
								//display 1, 2, 5 * order lines
								else if (1/.9 < realMinStep) {
									res = res.concat([1, 2, 5].map(v => lg(v*order)));
									// state.logSteps = [logStep, logStep-lg(), logStep-lg()];
								}
								//display 1..9 * order lines
								else if (1/.95 < realMinStep) {
									res = res.concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => lg(v*order)));
								}
								//try to pick proper subdivision for 2,5 ranges
								else {
									// 1/.98, 1/.99, 1/.995, 1/.998, 1/.999, ...
									// 1/realMinStep = .99
									// 1 -  1/realMinStep = .01...
									//inspiration: http://customgraph.com/SGL/piart.php?art=2161

									let localStep = 1 -  1/realMinStep;
									let step = scale(localStep, [1, 2, 5]);
									let step1 = scale(step*1.1, [1, 2, 5]);
									let step2 = scale(step1*1.1, [1, 2, 5]);
									let step5 = scale(step2*1.1, [1, 2, 5]);

									let baseMin = Math.max(min, order)/order,
										baseMax = Math.min(max, 10*order)/order;

									if (baseMin < 2) {
										let from = Math.floor(baseMin/step1)*step1;
										let to = Math.min(baseMax, 2);
										let res1 = range(from, to, step1);
										if (res1) {
											res = res.concat(res1.map(v => lg(v*order)));
										}
									}
									if (baseMin <= 5 && baseMax > 2) {
										let from = Math.max(Math.floor(baseMin/step2)*step2, 2);
										let to = Math.min(baseMax, 5-step1);
										let res2 = range(from, to, step2);
										if (res2) {
											res = res.concat(res2.map(v => lg(v*order)));
										}
									}
									if (baseMax > 5) {
										let from = Math.max(Math.floor(baseMin/step5)*step5, 5);
										let to = Math.min(baseMax, 10-step1);
										let res5 = range(from, to, step5);
										if (res5) {
											res = res.concat(res5.map(v => lg(v*order)));
										}
									}
								}
							}

							return res;
						},
						fontSize: 8,
						ticks: state => {
							return state.values.map(v => {
								if ( isMajor(v, state) ) return state.axisWidth*4;
								return null;
							});
						},
						lineColor: state => {
							return state.values.map(v => {
								if ( isMajor(v, state) ) return state.heavyColor;
								return state.lightColor;
							});
						},
						labels: state => {
							return state.values.map(v => {
								if ( isMajor(v, state) ) return Math.pow(10, v).toPrecision(1);
								return null;
							});
						}
					},
					y: {
						zoom: false,
						pan: false,
						axis: -Infinity
					}
				});

				function isMajor (v, state) {
					let step = state.logStep;


					return (Math.abs(v)+1e-5)%step <= 2e-5
				}
			}
			else if (v === 'dictaphone') {
				grid.update({
					x: {
						lines: false,
						pan: true,
						zoom: true,
						axis: Infinity,
						fontSize: '11pt',
						fontFamily: 'sans-serif',
						offset: 0,
						scale: 10,
						minScale: .006,
						maxScale: 120*1000,
						axisWidth: 2,
						min: 0,
						origin: 0,
						align: 0,
						distance: 20,
						steps: [1, 2.5, 5],
						padding: [60, 0, 0, 0],
						ticks: (state) => {
							let result = {};
							let {lines} = state;

							let minStep = lines.distance * lines.scale;

							let [step, largeStep] = steps.time(minStep);

							let start = Math.floor(state.offset/step-1)*step, end = Math.ceil((state.offset + state.range)/step)*step;
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

							let [step, largeStep] = steps.time(minStep);

							let start = Math.floor(state.offset/step-1)*step, end = Math.ceil((state.offset + state.range)/step)*step;
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
						offset: 0,
						origin: .5,
						axisColor: 'transparent',
						padding: [60, 0,0,0],
						distance: 20,
						scale: 20/grid.viewport[3],
						// ticks: null,
						labels: state => {
							return state.values.map(v => -Math.abs(v).toFixed(0));
						}
						// lines: false
					}
				});
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
		grid.update({x: {disabled: !v}});
	}},
	{id: 'y', label: '☰', title: 'Horizontal Y lines', value: true, change: v => {
		grid.update({y: {disabled: !v}});
	}},
	{id: 'r', label: '⊚', title: 'Radial R lines', value: false, change: v => {
		grid.update({r: {disabled: !v}});
	}},
	{id: 'a', label: '✳', title: 'Angular α lines', value: false, change: v => {
		grid.update({a: {disabled: !v}});
	}}
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

