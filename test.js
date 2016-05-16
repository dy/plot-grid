var test = require('tst');
var Grid = require('./');
var isBrowser = require('is-browser');

if (isBrowser) {
	document.body.style.margin = '0';
}


test('linear', function () {
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

test.skip('logarithmic', function () {

});

test('polar');

test('node');

test('perspective grid');

test('points grid style');