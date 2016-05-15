var test = require('tst');
var Grid = require('./');
var isBrowser = require('is-browser');

if (isBrowser) {
	document.body.style.margin = '0';
}


test('linear', function () {
	var grid = Grid({
		lines: [
			{
				min: 0,
				max: 100,
				orientation: 'x'
			},
			{
				min: 100,
				max: 0,
				orientation: 'y'
			}
		],

		axes: [
			{
				min: 0,
				max: 100,
				orientation: 'x'
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