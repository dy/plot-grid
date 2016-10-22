# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Grid component for webgl/canvas2d with zooming, panning, polar mode etc. See [demo](https://dfcreative.github.io/plot-grid).


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
		labels: {0: 'E', 90: 'N', 180: 'W', 270: 'S'}
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

This will create frequency response and directional diagram.
<!--[see in action](http://requirebin.com/?gist=e6371d3310dff351c027edf0bf2a9492).-->

## API

### const Grid = require('plot-grid')

Get grid constructor. You can require render-specific version as:

```js
const Canvas2DGrid = require('plot-grid/2d');
const WebglGrid = require('plot-grid/gl');
const HTMLGrid = require('plot-grid/html'); //pending
```

### let grid = new Grid(options?)

Create new grid instance. It can serve both as a class or constructor function (no `new`).

#### Options

| Name | Type | Description |
|---|---|---|
| container | Element, String, null | Container element to place grid into. By default `document.body`. Can be `null` to render in memory. |
| context | CanvasContext, String, Object | Can be existing context, a string `2d`/`webgl` or context options for [get-canvas-context](https://npmjs.org/package/get-canvas-context). |
| viewport | Array(4) or (w, h) => Array(4) | An array defining the viewbox within the canvas for grid. Array components are `[left, top, width, height]`.
| x, y, r, a | Object, Bool | Options for the grid lines of cartesian or polar plot, see the table below. If just boolean, default options will be guessed. |

#### Lines

| Name | Type | Description |
|---|---|---|
| `lines` | Bool, Array, Function, null | Array with values for lines or function returning such array, `(lines, viewport, grid) => [values...]`. By default lines are calculated based on range and viewport. Can be disabled by passing `false`. |
| `axis` | Bool, Number, String | Enable axis or define it’s origin on the opposite dimension by passing a number, e.g. `0` for zero-line. Note that if origin is outside of the viewport, axis will be placed to the edge. |
| `labels` | Bool, Array, Function | Values for labels. By default returns lines values with `units` suffix. Can be defined via function `(lines, viewport, grid) => [labels...]`. |
| `ticks` | Bool, Number, Array, Function | Size of the ticks for the labels. Can be disabled by passing false, can be a number, an array corresponding to the labels or a function returning size, `(lines, viewport, grid) => [ticks...]`. |
| `name` | String, null | Name for the axis. |
| `units` | String, null | Units to add as a suffix to the labels. |
| `padding` | Number, Array(4) | Space for the labels and axis, by default `0`. |
| **Zoom/pan** |
| `min` | Number | Defines minimum value for the grid, by default `-Infinity`. |
| `max` | Number | Defines maximum value for the grid, by default `Infinity`. |
| `offset` | Number | Defines start point for the visible range, in terms of values. By default `0`.  |
| `scale` | Number | Sets scale for the current range, numver of values per pixel. By default is `1`. |
| `zoom` | Bool, String, Array | Enables zoom interaction. Can be a string with possible interaction: `drag`, `scroll`, or array with these strings. |
| `pan` | Bool, String, Array | Enables pan interaction, can take same values as zoom. |
| **Advanced** |
| `type` | String | Style of lines: `lines`, `dots`, `crosses`. |
| `font` | String | Font to use for labels, by default `12pt sans-serif`. |
| `color` | String, Array | Default color for the lines, axes, ticks and labels. |
| `axisWidth` | Number | Width of axis, by default `2`. |
| `axisColor` | String, Array | Axis color, redefines default `color`. |
| `lineColor` | String, Array, Function | Color(s) for lines, can be a function returning specific color per-line, `(lines, viewport, grid) => [colors...]`. By default `color`. |
| `lineWidth` | Number | Width of lines, by default `1`. |
| `log` | Bool | Place lines logarithmically. |
| `distance` | Number | Minimum distance between lines. By default `10`. |
| `steps` | Array | Base steps to use for lines, by default `[1, 2, 5]`. |
| `step` | Number | Current step value, read-only. |


### grid.update(options)

Pass new options to update grid look. Note that passed options extend existing ones.

```js
grid.update({
	x: {
		log: false
	}
});
```

It will automatically rerender grid.

### grid.render()

Redraw grid. Call whenever you want to redraw grid, like resize etc.

### grid.pan(dx, dy)

Shift grid by the amount of pixels, they will be converted to grid values. This method is used by zoom/pan interactions.

### grid.zoom(dx, dy, cx?, cy?)

Scale grid by the amount of pixels, they will be converted to grid values. This method is used by zoom/pan interactions.

### grid.dispose()

Clear any references, events, dispose context etc. Call if you are not planning to use grid instance anymore.


## Used by

* [gl-spectrum](https://github.com/audio-lab/gl-spectrum)
* [gl-spectrogram](https://github.com/audio-lab/gl-spectrogram)
* [gl-waveform](https://github.com/audio-lab/gl-waveform)

## Thanks

To [@evanw](https://github.com/evanw) with [thetamath](http://thetamath.com/app/y=x%5E(3)-x) for grid API inspiration.

## Related

* [grid](https://github.com/bit101/grid) — collection of grids for canvas2d.
* [gl-plot2d](https://www.npmjs.com/package/gl-plot2d) — webgl-based grid.
* [gl-plot3d](https://www.npmjs.com/package/gl-plot3d) — webgl-based 3d grid.
