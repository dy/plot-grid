var test = require('tst');
var Grid = require('./');
var isBrowser = require('is-browser');

if (isBrowser) {
	document.body.style.margin = '0';
}


test.skip('linear', function () {
	var grid = Grid({
		viewport: function (w, h) {
			return [60, 20, w - 80, h - 80];
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

		axes: [
			true, {

			}
		]
	});

	window.addEventListener('resize', () => grid.update());
});

test.only('logarithmic', function () {
	var grid = Grid({
		viewport: function (w, h) {
			return [60, 20, w - 80, h - 80];
		},
		lines: [
			{
				min: 20,
				max: 20000,
				orientation: 'x',
				logarithmic: true,
				titles: function (value) {
					return value >= 1000 ? ((value / 1000).toFixed(0) + 'k') : value;
				}
			},
			{
				min: -100,
				max: 0,
				orientation: 'y'
			},
			{
				min: 20,
				max: 20000,
				orientation: 'x',
				logarithmic: true,
				values: function (value) {
					if (value.toString()[0] !== '1') return null;
					return value;
				},
				style: {
					borderLeftStyle: 'solid'
				}
			},
		],
		axes: [
			{
				labels: function (value, i, opt) {
					if (value.toString()[0] !== '2' && value.toString()[0] !== '1' && value.toString()[0] !== '5') return null;
					return opt.titles[i];
				}
			},
			true
		]
	});

	window.addEventListener('resize', () => grid.update());
});

test('polar');

test('node');

test('perspective grid');

test('points grid style');