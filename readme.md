# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Grid component for visualizing plots, built with oldschool HTML5 and CSS3. Because it is too wearisome task to paint grid per-component and maintain consistent style across UI. Can be used with visualizers, like [gl-spectrum](https://github.com/dfcreative/gl-spectrum), or sliders, like [slidy](https://github.com/dfcreative/slidy). See
[demo](https://dfcreative.github.io/plot-grid).

[![logarithmic grid](https://raw.githubusercontent.com/dfcreative/plot-grid/gh-pages/images/log.png "Logarithmic grid")](http://dfcreative.github.io/plot-grid/log.html) [![polar grid](https://raw.githubusercontent.com/dfcreative/plot-grid/gh-pages/images/polar.png "Polar grid")](http://dfcreative.github.io/plot-grid/)

## Usage

[![npm install plot-grid](https://nodei.co/npm/plot-grid.png?mini=true)](https://npmjs.org/package/plot-grid/)

```js
const plotGrid = require('plot-grid');

let grid = plotGrid({
	lines: [
		{orientation: 'x', min: 20, max: 20000, units: 'Hz', logarithmic: true},
		{orientation: 'y', min: -100, max: 0, units: 'Db'}
	],
	axes: [true, true]
});
```

This will create basic grid for spectrogram, [see in action](http://requirebin.com/?gist=e6371d3310dff351c027edf0bf2a9492).

## API

<details><summary>`const Grid = require('plot-grid')`</summary>

Get grid constructor. You can require render-specific version:

```js
const Canvas2DGrid = require('plot-grid/2d')
const WebglGrid = require('plot-grid/gl')
const HTMLGrid = require('plot-grid/html') //default
```

</details>
<details><summary>*`let grid = new Grid(lines, options?)`*</summary>

Create new grid instance. It can serve both as a class or constructor method (no `new`).

`lines` is a list of grid lines to draw:

```js
[
	{
		name: 'Frequency',
		units: 'Hz',
		orientation: 'x', //x, y, r, a
		log: true,
		min: 20, //TODO: get rid of it
		max: 20000, //TODO: get rid of it (replace with zoom)
		values: [20, 200, 2000, 20000], //calc automatically
		labels: true, //takes titles values by default
		color: 'rgb(0,0,0)', //lines automatically have opacity
		font: '12px sans-serif',
		opacity: .5,
		axis: true, //or number for specific offset
	},
	{
		name: 'Magnitude',
		orientation: 'y',
		min: -100,
		max: 0,
		//undefined values are detected automatically
		labels: function (value, i, stats) {
			return value.toLocalString() + 'db';
		}
	},
	...
]
```

Possible options object may contain the following properties:

```js
//where to place grid, by default - body
container: el,

//for 2d/webgl grid
context: gl,

//position rectangle within the container/context, or function returning rectangle
viewport: [0, 0, container.clientWidth, container.clientHeight],
```

</details>
<details><summary>`grid.update(options)`</summary>

Pass new lines to update grid look. Note that passed lines just extend existing ones.

```js
grid.update([{
	logarithmic: false
}]);
```

Also `update` should be called whenever resize happened.

</details>
<details><summary>`grid.draw(options)`</summary>

```js
grid.draw();
```

</details>
<details><summary>`grid.dispose()`</summary>

Clear any references, events, dispose context etc. Call if you are not planning to use grid instance anymore.

</details>


## Used by

* [gl-spectrum](https://github.com/audio-lab/gl-spectrum)
* [gl-spectrogram](https://github.com/audio-lab/gl-spectrogram)
* [gl-waveform](https://github.com/audio-lab/gl-waveform)

## Thanks

To [@evanw](https://github.com/evanw) with [thetamath](http://thetamath.com/app/y=x%5E(3)-x) for grid API inspiration.

## Related

* [grid](https://github.com/bit101/grid) — paint grids in canvas
* [gl-plot2d](https://www.npmjs.com/package/gl-plot2d) — webgl-based grid.
* [gl-plot3d](https://www.npmjs.com/package/gl-plot3d) — webgl-based 3d grid.
* [gl-axes2d](https://www.npmjs.com/package/gl-axes2d) — webgl-based 2d plot axes.
* [gauge](https://www.npmjs.com/package/component-gauge) — simple gauge component.
* [thetamath](http://thetamath.com/app/) — plot any math function.
