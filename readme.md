Grid component for visualizing plots, built with oldschool HTML5 and CSS3. Because it is too wearisome task to paint grid per-component and maintain consistent style across UI. Can be used with visualizers, like [gl-spectrum](https://github.com/dfcreative/gl-spectrum), or sliders, like [slidy](https://github.com/dfcreative/slidy).

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

## Usage

[![npm install plot-grid](https://nodei.co/npm/plot-grid.png?mini=true)](https://npmjs.org/package/plot-grid/)

```js
var createGrid = require('plot-grid');

var grid = createGrid({
	//where to place grid, by default - body
	container: el,

	//position within the container
	viewport: [0, 0, container.clientWidth, container.clientHeight],

	//grid lines
	lines: [
		{
			orientation: 'vertical',
			logarithmic: true,
			min: 20,
			max: 20000,
			values: [20, 200, 2000, 20000],
			titles: ['20Hz', '200Hz', '2kHz', '20kHz']
		},
		{
			orientation: 'horizontal',
			logarithmic: false,
			min: -100,
			max: 0,
			values: [0, -25, -50, -75, -100],
			titles: ['0db', '-25db', '-50db', '-75db', '-100db']
		}
	],

	//grid axes
	axes: [
		{
			name: 'Frequency',
			orientation: 'horizontal',
			logarithmic: true,
			min: 20,
			max: 20000,
			values: [20, 200, 2000, 20000],
			titles: ['0db', '-25db', '-50db', '-75db', '-100db'],
			labels: [20, 200, '2k', '20k']
		},
		{
			name: 'Magnitude',
			orientation: 'vertical',
			logarithmic: false,
			min: -100,
			max: 0,
			values: [0, -25, -50, -75, -100],
			titles: ['0db', '-25db', '-50db', '-75db', '-100db'],
			labels: ['0', '-25', '-50', '-75', '-100']
		}
	]
});

grid.update({
	viewport: [20, 20, width, height],
	x: {
		lines: width < 100 ? [0, 50, 100] : [0, 25, 50, 75, 100]
	}
});
```

You can also axis/line styles:

```css
.grid-line {
	border-width: 1px;
	border-color: rgba(100,100,100,.1);
}
.grid-line-x {
	border-style: dotted;
}
.grid-line-y {
	border-style: solid;
	border-width: 1px;
}

.grid-axis {

}
.grid-axis-x {

}
.grid-axis-label {

}
```


## Used by

* [gl-spectrum](https://github.com/dfcreative/gl-spectrum)
* [audio-spectrum](https://github.com/audio-lab/audio-spectrum)
* [audio-stats](https://github.com/audio-lab/audio-stats)
* [audio-waveform](https://github.com/audio-lab/audio-waveform)
* [audio-spectrogram](https://github.com/audio-lab/audio-spectrogram)

## Related

* [gl-plot2d](https://www.npmjs.com/package/gl-plot2d) — webgl-based grid.
* [gl-plot3d](https://www.npmjs.com/package/gl-plot3d) — webgl-based 3d grid.
* [gl-axes2d](https://www.npmjs.com/package/gl-axes2d) — webgl-based 2d plot axes.
* [gauge](https://www.npmjs.com/package/component-gauge) — simple gauge component.