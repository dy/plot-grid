# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges) ![gzip-size](https://img.shields.io/badge/size-18.4kb-brightgreen.svg)

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

Each of _x/y/r/a_ can define custom dimension view by the following options:

| Name | Type | Description |
|---|---|---|
| `lines` | Bool, Array, Function, String, null | Array with values for lines or function returning such array, `state => [values...]`. Can be disabled by passing `false`. Also can be a string, one of `log`, `linear` or `time`, to define standard line types. Default is `linear`. |
| `axis` | Bool | Enable axis. |
| `labels` | Bool, Array, Function | Values for labels. By default returns lines values with `units` suffix. Can be defined via function `state => [labels...]`. |
| `ticks` | Bool, Number, Array, Function | Size of the ticks for the labels. Can be disabled by passing false, can be a number, an array corresponding to the labels or a function returning size, `state => [ticks...]`. |
| `name` | String, null | Name for the axis. |
| `units` | String, null | Units to add as a suffix to the labels. |
| `padding` | Number, Array(4), Function | Space for labels and axis, by default `0`. Array sequence is `top, right, bottom, left`, as in css. |
| **Zoom/pan** |
| `offset` | Number | Defines start point for the visible range, in terms of values. By default `0`. |
| `origin` | Number | Defines position of the offset on the screen, for example, `.5` is center, `1` is right/top edge of the screen, `0` is left/bottom. By default `.5`. |
| `scale` | Number, Function | Sets scale for the current range, number of values per pixel. Can be a function, if scale should depend on viewport for adaptive layout. By default is `1`. |
| `min`, `max` | Number | Limits for panning, by default `-Infinity`, `Infinity`. |
| `minScale`, `maxScale` | Number | Scale limits. |
| `zoom` | Bool, String, Array | Enables zoom interaction. Can be a string with possible interaction: `drag`, `scroll`, or array with these strings. |
| `pan` | Bool, String, Array | Enables pan interaction, can take same values as zoom. |
| **Style** |
| `style` | String | Style of lines: `lines`, `dots`, `crosses`. |
| `fontSize` | String, Number | Font size to use for labels, by default `10pt`. |
| `fontFamily` | String | Font family to use for labels, by default `sans-serif`. |
| `color` | String, Array | Default color for the lines, axes, ticks and labels. |
| `axisOrigin` | Number | The value on the opposite coordinates corresponding to the axis. By default `0`. |
| `axisWidth` | Number | Width of axis, by default `2`. |
| `axisColor` | String, Array | Axis color, redefines default `color`. |
| `lineColor` | String, Array, Function | Color(s) for lines, can be a function returning specific color per-line, `state => [colors...]`. By default `color`. |
| `lineWidth` | Number | Width of lines, by default `1`. |
| `align` | Number | The side to align ticks and labels, `0..1`. By default `0.5`. |
| `distance` | Number | Minimum distance between lines. By default `10`. |
| `steps` | Array | Base steps to use for lines, by default `[1, 2, 5]`. |


#### State

Some lines properties which can be functions receive `state` object as an argument, which includes following values, directly fed to renderer:

| Name | Description |
|---|---|
| `values` | Array with values for lines. |
| `lines` | Reference to lines options object. |
| `grid` | Reference to the grid instance. |
| `viewport` | Current area on the canvas to render grid. |
| `range` | Current visible values range. |
| `offset` | Value corresponding to the left offset of the grid. |
| `axisOrigin` | Value for the axis on the opposite dimension, if any. |
| `colors` | Color or array of colors, corresponding to lines. |
| `ticks` | List with tick sizes. |
| `labels` | Text values for the labels. |

For complete list of details log state object in console.


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
