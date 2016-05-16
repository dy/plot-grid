# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Grid component for visualizing plots, built with oldschool HTML5 and CSS3. Because it is too wearisome task to paint grid per-component and maintain consistent style across UI. Can be used with visualizers, like [gl-spectrum](https://github.com/dfcreative/gl-spectrum), or sliders, like [slidy](https://github.com/dfcreative/slidy).

[![linear grid](images/linear.png?raw=true "Linear grid")](http://dfcreative.github.io/plot-grid/)

## Usage

[![npm install plot-grid](https://nodei.co/npm/plot-grid.png?mini=true)](https://npmjs.org/package/plot-grid/)

```js
var createGrid = require('plot-grid');

var grid = createGrid({
	//where to place grid, by default - body
	container: el,

	//position within the container or function returning it
	viewport: [0, 0, container.clientWidth, container.clientHeight],

	//grid lines
	lines: [
		{
			orientation: 'x',
			logarithmic: true,
			min: 20,
			max: 20000,
			values: [20, 200, 2000, 20000],
			titles: ['20Hz', '200Hz', '2kHz', '20kHz']
		},
		{
			orientation: 'y',
			min: -100,
			max: 0,
			//↓ detected automatically depending on scale
			values: null,
			//↓ can be a function mapping values
			titles: function (value, i, stats) {
				return value.toLocalString() + 'db';
			}
		}
	],

	//grid axes, in order according to the lines - settings or true/false
	axes: [
		{
			name: 'Frequency',
			labels: [20, 200, '2k', '20k']
		},
		true
	]
});

grid.update({
	viewport: [20, 20, width, height],
	x: {
		lines: width < 100 ? [0, 50, 100] : [0, 25, 50, 75, 100]
	}
});
```

You can also style axis/lines, see [index.css](./index.css) for CSS classes to override.


## Used by

* [gl-spectrum](https://github.com/dfcreative/gl-spectrum)
* [audio-spectrum](https://github.com/audio-lab/audio-spectrum)
* [audio-stats](https://github.com/audio-lab/audio-stats)
* [audio-waveform](https://github.com/audio-lab/audio-waveform)
* [audio-spectrogram](https://github.com/audio-lab/audio-spectrogram)

## Thanks

To [@evanw](https://github.com/evanw) with [thetamath](http://thetamath.com/app/y=x%5E(3)-x) for grid API inspiration.

## Related

* [gl-plot2d](https://www.npmjs.com/package/gl-plot2d) — webgl-based grid.
* [gl-plot3d](https://www.npmjs.com/package/gl-plot3d) — webgl-based 3d grid.
* [gl-axes2d](https://www.npmjs.com/package/gl-axes2d) — webgl-based 2d plot axes.
* [gauge](https://www.npmjs.com/package/component-gauge) — simple gauge component.
* [thetamath](http://thetamath.com/app/) — plot any math function.