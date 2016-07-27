# plot-grid [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Grid component for visualizing plots, built with oldschool HTML5 and CSS3. Because it is too wearisome task to paint grid per-component and maintain consistent style across UI. Can be used with visualizers, like [gl-spectrum](https://github.com/dfcreative/gl-spectrum), or sliders, like [slidy](https://github.com/dfcreative/slidy).

[![linear grid](https://raw.githubusercontent.com/dfcreative/plot-grid/gh-pages/images/linear.png "Linear grid")](http://dfcreative.github.io/plot-grid/) [![logarithmic grid](https://raw.githubusercontent.com/dfcreative/plot-grid/gh-pages/images/log.png "Logarithmic grid")](http://dfcreative.github.io/plot-grid/log.html)

## Usage

[![npm install plot-grid](https://nodei.co/npm/plot-grid.png?mini=true)](https://npmjs.org/package/plot-grid/)

```js
```

## API

<details><summary>**`grid = new Grid(options)`**</summary>

Create new grid instance. It can serve both as a class or constructor method (no `new`).

Possible options are:

```js
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
		units: 'Hz',
		titles: null // → ['20Hz', '200Hz', '2kHz', '20kHz']
	},
	{
		orientation: 'y',
		min: -100,
		max: 0,
		//undefined values are detected automatically
		titles: function (value, i, stats) {
			return value.toLocalString() + 'db';
		},
		style: {
			color: 'black'
		}
	}
],

//grid axes, corresponding to the lines - settings or true/false
axes: [
	{
		name: 'Frequency',
		// values: null,
		// titles: null,
		labels: [20, 200, '2k', '20k']
	},
	true
],

//change container color property to nudge lines color, can be string or object
style: `color: gray;`
```

</details>
<details><summary>**`grid.update(options)`**</summary>

Pass new options to update grid style. Also should be called on if resize is needed.

```js
grid.update({
	viewport: [20, 20, width, height],
	lines: [{
		logarithmic: false
	}]
});
```

</details>

You can also style axis/lines, see [index.css](./index.css) for CSS classes to override.


## Used by

* [gl-spectrum](https://github.com/audio-lab/gl-spectrum)
* [gl-spectrogram](https://github.com/audio-lab/gl-spectrogram)
* [gl-waveform](https://github.com/audio-lab/gl-waveform)

## Thanks

To [@evanw](https://github.com/evanw) with [thetamath](http://thetamath.com/app/y=x%5E(3)-x) for grid API inspiration.

## Related

* [gl-plot2d](https://www.npmjs.com/package/gl-plot2d) — webgl-based grid.
* [gl-plot3d](https://www.npmjs.com/package/gl-plot3d) — webgl-based 3d grid.
* [gl-axes2d](https://www.npmjs.com/package/gl-axes2d) — webgl-based 2d plot axes.
* [gauge](https://www.npmjs.com/package/component-gauge) — simple gauge component.
* [thetamath](http://thetamath.com/app/) — plot any math function.