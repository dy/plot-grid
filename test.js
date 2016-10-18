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
	// type: {type: 'switch', value: 'Polar', options: {'Cartesian': '⊞', 'Polar': '⊗'}, change: v => {
	// 	if (v === 'Polar') {
	// 		settings.set('x', {label: '<br/>⊚', title: 'Radial lines'});
	// 		settings.set('y', {label: '<br/>✳', title: 'Angular lines'});
	// 		settings.set('yRange', {min: 0, max: 360, step: 1, value: [0, 360], scale: 'linear'});

	// 		grid.update({x: false, y: false, r: {min: 0, max: 100}, a: {min: 0, max: 360}});
	// 	}
	// 	else {
	// 		settings.set('x', {label: '<br/>|||', title: 'Horizontal lines', style: 'letter-spacing: -.5ex;'});
	// 		settings.set('y', {label: '<br/>☰', title: 'Vertical lines'});
	// 		settings.set('yRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});

	// 		grid.update({x: {min: 0, max: 100}, y: {min: 0, max: 100}, r: false, a: false});
	// 	}
	// }},

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
	// opacity: {type: 'range', value: .13, min: 0, max: 1, change: v => {
	// 	grid.update({x:{opacity: v}, y:{opacity: v}});
	// }},


	x: {label: '|||', title: 'Horizontal X lines', value: true, change: v => {
		grid.update({x: {disable: !v}});
	}},
	xLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = {x:{}};
		lines.x.log = isLog;
		if (isLog) {
			lines.x.min = 1;
			lines.x.max = 10000;
			settings.set('xRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines.x.min = 0;
			lines.x.max = 100;
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
		grid.update({x: {
			axis: v
		}});
	}},
	xRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		grid.update({
			x: {
				min: v[0], max: v[1]
			}
		});
	}},

	y: {label: '☰', title: 'Horizontal Y lines', value: true, change: v => {
		grid.update({y: {disable: !v}});
	}},
	yLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = {y:{}};
		lines.y.log = isLog;
		if (isLog) {
			lines.y.min = 1;
			lines.y.max = 10000;
			settings.set('yRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines.y.min = 0;
			lines.y.max = 100;
			if (settings.get('type') === 'Polar') {
				settings.set('yRange', {min: 0, max: 360, step: 1, value: [0, 360], scale: 'linear'});
			}
			else {
				settings.set('yRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});
			}
		}
		grid.update(lines);
	}},
	yAxis: {type: 'checkbox', label: 'axis', value: false, change: v => {
		grid.update({y:{axis: v}});
	}},
	yRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = {y:{}};
		lines.y.min = v[0];
		lines.y.max = v[1];
		grid.update(lines);
	}},


	'': {type: 'raw', content: '<br/>'},


	r: {label: '⊚', title: 'Radial R lines', value: false, change: v => {
		grid.update({r: {disable: !v}});
	}},
	rLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = {r:{}};
		lines.r.log = isLog;
		if (isLog) {
			lines.r.min = 1;
			lines.r.max = 10000;
			settings.set('rRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines.r.min = 0;
			lines.r.max = 100;
			if (settings.get('type') === 'Polar') {
				settings.set('rRange', {min: 0, max: 360, step: 1, value: [0, 360], scale: 'linear'});
			}
			else {
				settings.set('rRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});
			}
		}
		grid.update(lines);
	}},
	rAxis: {type: 'checkbox', label: 'axis', value: true, change: v => {
		grid.update({r:{axis: v}});
	}},
	rRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = {r:{}};
		lines.r.min = v[0];
		lines.r.max = v[1];
		grid.update(lines);
	}},


	a: {label: '✳', title: 'Angular α lines', value: false, change: v => {
		grid.update({a: {disable: !v}});
	}},
	aLog: { label: 'logarithmic', type: 'checkbox',	value: false, change: isLog => {
		let lines = {a:{}};
		lines.a.log = isLog;
		if (isLog) {
			lines.a.min = 1;
			lines.a.max = 10000;
			settings.set('aRange', {min: 1, max: 10000, step: null, value: [1, 10000], scale: 'log'});
		}
		else {
			lines.a.min = 0;
			lines.a.max = 100;
			if (settings.get('type') === 'Polar') {
				settings.set('aRange', {min: 0, max: 360, step: 1, value: [0, 360], scale: 'linear'});
			}
			else {
				settings.set('aRange', {min: 0, max: 100, step: 1, value: [0, 100], scale: 'linear'});
			}
		}
		grid.update(lines);
	}},
	aAxis: {type: 'checkbox', label: 'axis', value: true, change: v => {
		grid.update({a:{axis: v}});
	}},
	aRange: { type: 'interval', label: 'min..max', value: [0, 100], min: 0, max: 100, change: v => {
		let lines = {a:{}};
		lines.a.min = v[0];
		lines.a.max = v[1];
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
var grid = Grid({
	x: {
		min: 0,
		max: 100
	},
	y: {
		min: 0,
		max: 100
	},
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
