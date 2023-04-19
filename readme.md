# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges) ![gzip-size](https://img.shields.io/badge/size-18.4kb-brightgreen.svg)

Grid component for webgl/canvas2d with zooming, panning, polar mode etc. See [demo](https://dy.github.io/plot-grid).


## Usage

[![npm install plot-grid](https://nodei.co/npm/plot-grid.png?mini=true)](https://npmjs.org/package/plot-grid/)

```js
const createGrid = require('plot-grid');

//cartesian grid
let grid = createGrid({
	x: {
		type: 'logarithmic',
		min: 0
	},
	y: {
		min: -100,
		max: 0
	}
});
```

This will create frequency response and directional diagram.
<!--[see in action](http://requirebin.com/?gist=e6371d3310dff351c027edf0bf2a9492).-->

## API

### `let grid = new Grid(options?)`

Create new grid instance. It can serve both as a class or constructor function (no `new`). By default it displays cartesian grid, but

| Name | Default | Description |
|---|---|---|
| `container` | `document.body` | Container to place grid into. Can be `null` to render in memory. |
| `context` | `null` | Can be pre-existing context. |
| `pixelRatio` | `window.devicePixelRatio` | Pixel ratio of canvas. |
| `autostart` | `true` | Render every frame automatically or call `render` method manually. Useful if _plot-grid_ is used in cooperation with other components. |
| `interactions` | `true` | Enable pan/zoom interactions, see `interact` event. |
| `x`, `y`, `r`, `a` | _Bool_, _String_, _Object_ | Boolean, enabling coordinates of `linear` type or a string, defining custom type: `linear`, `logarithmic` or `time`. If object is passed, it defines custom lines behaviour, see the table below. |

Each of _x_, _y_, _r_, _a_ can be customized by the following options:

| Name | Type | Default | Description |
|---|---|---|---|
| `type` | _String_, `null` | `null` | Default type to extend, one of `linear`, `logarithmic`, `time`. |
| `color` | _String_ | `rgba(0,0,0,1)` | Default color for the lines, axes, ticks and labels. |
| `format` | _Function_ | `null` | Formatter for label values. Takes a value and returns a string. [pretty-number](https://npmjs.org/package/pretty-number) can be used as such. |
| `lines` | _Bool_, _Array_, _Function_, `null` |  | Array with values, defining lines, or function returning such array, `state => [values...]`. Can be disabled by passing `false`. By default implemented by `type`. |
| `ticks` | _Bool_, _Array_, _Number_, _Function_ | `5` | Tick size. Can be disabled by passing `false`. |
| `labels` | _Bool_, _Array_, _Object_ , _Function_, `null` | `null` | Object or array with labels corresponding to lines. Can be defined as a function returning such array `(state) => labels`. `null` value will output values as is. Can be disabled by passing `false`. |
| `axis` | _Bool_ | `true` | Enable axis. |

#### Pan & zoom

Additional pan/zoom params can be set for each coordinate `x`, `y`, `r`, `a`:

| Name | Type | Default | Description |
|---|---|---|---|
| `offset` | _Number_ | `0` | Defines start point for the visible range, in terms of values. |
| `origin` | _Number_ | `0.5` | Defines position of the offset on the screen, for example, `.5` for center, `1` for right/top edge of the screen, `0` for left/bottom. |
| `scale` | _Number_ | `1` | Sets scale for the current range, number of values per pixel. |
| `min`, `max` | _Number_ | `-Infinity`, `Infinity` | Limits for panning. |
| `minScale`, `maxScale` | _Number_ | `0`, `Infinity` | Scale limits. |
| `zoom` | _Bool_ | `true` | Enables zoom interaction. |
| `pan` | _Bool_ | `true` | Enables pan interaction. |

To change pan or zoom, use `update` method with the propertives above, as `update({x: {offset, scale}, y: {offset, scale});`.

Another time it might be useful to engage `grid.on('interact', grid => {})` handler for grid interactions, like moving and zooming.

#### Style

Each coordinate can be customized more with additional options:

| Name | Type | Default | Description |
|---|---|---|---|
| `lineColor` | _String_, _Number_, _Function_, `null` | `.3` | Color for lines. Number value will take the base color above with changed opacity. Function signature is `state => [...values]`. |
| `lineWidth` | _Number_ | `1` | Width of lines. We guess that width of sublines should not differ from the width of lines, if you have use-case requiring the opposite, please address [issues](/issues). |
| `axisOrigin` | _Number_ | `0` | Define axis alignment by value on the opposite coordinate. |
| `axisColor` | _String_, _Number_ | `0.1` | Axis color, redefines default `color`. |
| `axisWidth` | _Number_ | `2` | Width of axis line. |
| `align` | _Number_ | `0.5` | The side to align ticks and labels, `0..1`. |
| `fontSize` | _String_, _Number_ | `10pt` | Font size for labels. Sizes with units will be automatically transformed to pixels by [to-px](https://npmjs.org/package/to-px). |
| `fontFamily` | _String_ | `sans-serif` | Font family to use for labels. |
| `padding` WIP | _Number_, _Array(4)_ | `0` | Padding inside the viewport to indent lines from axes and labels. Ordering is _top_, _right_, _bottom_, _left_, as in css. |
| `style` WIP | _String_ | `lines` | Style of rendering: `lines` or `dots`. Note that `dots` is available only when `x` and `y` are both enabled. |
| `distance` | _Number_ | `120` | Minimum distance between lines. |

### `grid.update(options)`

Pass new options to update grid look. Note that passed options extend existing ones.

```js
grid.update({
	x: {
		type: 'logarithmic',
		offset: 0,
		min: 0,
		scale: .01
	}
});
```
Note that you may need to call render in manual mode `grid.update().render()`.

### `grid.render()`

Redraw grid. Call whenever you need to redraw grid, like resize etc. It will not recalculate lines, just rerender existing lines. To recalculate lines, use `grid.update()`.

### `grid.draw()`

Directly invoke draw method, useful in case if grid needs to be drawn over other content.


## Used by

* [gl-spectrum](https://github.com/audio-lab/gl-spectrum)
* [gl-spectrogram](https://github.com/audio-lab/gl-spectrogram)
* [gl-waveform](https://github.com/audio-lab/gl-waveform)

## Thanks

To [@evanw](https://github.com/evanw) with [thetamath](http://thetamath.com/app/y=x%5E(3)-x) for grid API inspiration.

## Related

* [grid](https://github.com/bit101/grid) — collection of grids for canvas2d.
