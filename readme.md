# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Grid component with zooming, panning, polar mode and others. See [demo](https://dfcreative.github.io/plot-grid).

[![logarithmic grid](https://raw.githubusercontent.com/dfcreative/plot-grid/gh-pages/images/log.png "Logarithmic grid")](http://dfcreative.github.io/plot-grid/log.html) [![polar grid](https://raw.githubusercontent.com/dfcreative/plot-grid/gh-pages/images/polar.png "Polar grid")](http://dfcreative.github.io/plot-grid/)

## Usage

[![npm install plot-grid](https://nodei.co/npm/plot-grid.png?mini=true)](https://npmjs.org/package/plot-grid/)

```js
const createGrid = require('plot-grid');

//cartesian grid
let grid = createGrid({
	x: {
		name: 'Frequency',
		units: 'Hz',
		log: true,
		min: 20,
		max: 20000
	},
	y: {
		name: 'Magnitude',
		units: 'Db',
		max: 0,
		min: -100
	}
});

//polar grid
let polar = createGrid({
	r: {
		name: 'Direction',
		min: 0,
		max: 360,
		values: {0: 'E', 90: 'N', 180: 'W', 270: 'S'}
	},
	a: {
		name: 'Intensity',
		units: 'Db',
		min: -100,
		max: 0,
		log: true,
	}
});
```

This will create frequency response and directional diagram, [see in action](http://requirebin.com/?gist=e6371d3310dff351c027edf0bf2a9492).

## API

### const Grid = require('plot-grid')

Get grid constructor. You can require render-specific version as:

```js
const Canvas2DGrid = require('plot-grid/2d')
const WebglGrid = require('plot-grid/gl') //pending
const HTMLGrid = require('plot-grid/html') //pending
```

### let grid = new Grid(options?)

Create new grid instance. It can serve both as a class or constructor function (no `new`).

Possible options:

| Name | Type | Description |
|---|---|---|
| container | Element, String, null | Container element to place grid into. By default is `document.body` |
| context | CanvasContext, String, Object, null | Can be a string `2d` or `webgl`, context options for [get-canvas-context](https://npmjs.org/package/get-canvas-context) or `null` for non-canvas grid |
| viewport | Array(4) or (w, h) => Array(4) | An array defining the viewbox within the canvas for grid. Array components are `[left, top, width, height]`.
| x, y, r, a | Object, Bool | Options for the grid lines of cartesian or polar plot, see the table below.  |


Lines options may include:

| Name | Type | Description |
|---|---|---|
| lines | Bool, Array, (options, viewport, grid) => Array, null | Array with values for lines or function returning such array. By default lines are calculated based on range and viewport. Can be disabled by passing `false`. |
| axis | Bool, Number, String | Enable axis or define it’s origin on the opposite dimension by passing a number, e.g. 0 for zero-line. String can define placement to the edge: `top, left, bottom, right`. By default it is `left/bottom` |
| labels | Bool, Array, (options, viewport, grid) => Array | Values for labels. |
| name | String, null | Name for the axis. |
| units | String, null | Units to add as a postfix to the labels |
| ticks | Bool, Number, Array, (options, viewport, grid) => Array | Size of the ticks for the labels. Can be disabled by passing false, be a number, an array corresponding to the labels or a function returning size depending on params. |
| padding | Number, Array(4) | Space for the labels and axis, by default 0. If there is not enough space for the labels, the axis will be rotated so that lables are placed over the grid, not outside of it. |
| min | Number | Defines minimum range for the grid, by default `-Infinity`. |
| max | Number | Defines maximum range for the grid, by default `Infinity`. |
| range | Number | Defines current visible range, by default `100`.  |
| start | Number | Defines start point for the visible range, by default `0`.  |
| zoom | Bool, String, Array | Enables zoom interaction. Can be a string with possible interaction: `drag`, `scroll`, `pinch`, or array with these strings. |
| pan | Bool, String, Array | Enables pan interaction, can take same values as zoom. |
| type | String | The style of lines: `lines`, `dots`, `crosses`. |
| log | Bool | Place default lines logarithmically. |
| distance | Number | The minimum distance between lines. By default `10`. |
| scales | Array | The steps to use for lines, by default `[1, 2, 5]`. |
| axisWidth | Number | Width of axis, by default `2`. |
| lineWidth | Number | Width of lines, by default `1`. |
| font | String | Font to use for labels, by default `12pt sans-serif`. |
| color | String, Array | The color of axis/lines. |
| opacity | Number | Fade out lines relative to the axis. |


### grid.update(options)

Pass new options to update grid look. Note that passed options extend existing ones.

```js
grid.update({
	x: {
		log: false
	}
});
```

It is good idea to call `update` whenever resize happened.

### grid.render()

Paint grid in the next animation frame. If you need to draw instantly, do `grid.draw()`.

### grid.dispose()

Clear any references, events, dispose context etc. Call if you are not planning to use grid instance anymore.


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
