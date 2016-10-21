/**
 * @module  plot-grid/gl
 *
 * Webgl grid renderer
 */
'use strict';


const Grid = require('./src/core');
const inherits = require('inherits');
const Canvas2DGrid = require('./2d');

module.exports = GLGrid;


inherits(GLGrid, Grid);


/** @constructor */
function GLGrid (opts) {
	if (!(this instanceof GLGrid)) return new GLGrid(opts);


	opts = opts || {};
	opts.autostart = false;
	let vp = opts.viewport;
	opts.viewport = null;

	Grid.call(this, opts);

	//canvas 2d is used as a texture, that’s it
	opts.container = null;
	opts.viewport = vp;
	this.grid = new Canvas2DGrid(opts);
	this.grid.canvas.width = this.canvas.width;
	this.grid.canvas.height = this.canvas.height;
	this.grid.resize();

	this.on('resize', (ctx, vp) => {
		this.grid.canvas.width = this.canvas.width;
		this.grid.canvas.height = this.canvas.height;
		this.grid.resize();
	});
	this.on('update', (opts) => {
		//FIXME: this dude automatically draws 2d grid, do something about that
		this.grid.update(opts);
	});
	this.on('draw', (ctx, vp) => {
		this.grid.clear();
		this.grid._draw();
		this.setTexture('grid', this.grid.canvas);
	});
	this.on('pan', updatePanZoom);
	this.on('zoom', updatePanZoom);

	function updatePanZoom () {
		if (!this.x.disable && this.x.zoom) {
			this.grid.x.offset = this.x.offset;
			this.grid.x.scale = this.x.scale;
		}
		if (!this.y.disable && this.y.zoom) {
			this.grid.y.offset = this.y.offset;
			this.grid.y.scale = this.y.scale;
		}
		if (!this.r.disable && this.r.zoom) {
			this.grid.r.offset = this.r.offset;
			this.grid.r.scale = this.r.scale;
		}
		if (!this.a.disable && this.a.zoom) {
			this.grid.a.offset = this.a.offset;
			this.grid.a.scale = this.a.scale;
		}
		this._draw();
	}
}

GLGrid.prototype.context = {
	type: 'webgl',
	antialias: false
};


GLGrid.prototype.frag = `
	precision highp float;

	uniform vec4 viewport;
	uniform sampler2D grid;

	void main () {
		vec2 coord = (gl_FragCoord.xy - viewport.xy) / viewport.zw;
		vec4 color = texture2D(grid, vec2(coord.x, 1. - coord.y));

		gl_FragColor = color;
	}
`;

