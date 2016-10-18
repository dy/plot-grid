//plot-grid use-cases
//TODO: put it into main test as basic use-cases

const createGrid = require('../');


//1. classic grid
let grid = createGrid({
	x: {
		min: 0,
		max: 100,
		axis: 'bottom',
	},
	y: {
		min: 0,
		max: 100,
		axis: 'left'
	},
	padding: [0, 0, 40, 40]
});



//2. dictaphone grid
let dictaphone = createGrid({
	x: {
		name: 'Time'
		units: 's',
		min: 0,
		max: 5*60,
		axis: 'top',
		ticks: (x) => {
			//generate array of repeating |...|...
			return [];
		},
		labels: () => {
			//return object with displaced labels
		},
		range: 3*60,
		origin: 1.5*60,
		pan: 'drag',
		zoom: ['scroll', 'pinch'],
		lines: false
	},
	y: {
		name: 'Gain',
		units: 'db',
		min: -10,
		max: 10,
		axis: 'right',
		ticks: (y) => {
			//generate array of log-placed numbers
			return [];
		},
		zoom: false,
		pan: false
	}
});


//3. θmath
let thetaMath = createGrid({
	x: [{
		name: 'Gentle lines'
		//defaults
		min: -Infinity,
		max: +Infinity,
		axis: false,
		zoom: true,
		pan: true,
		range: 10,
		origin: 0,

		color: 'rgba(0,0,0,.15)'

		lines: (opts, vp, grid) => {
			//generate array based on resolution
		},

		labels: false
	}, {
		name: 'Bold lines',
		axis: false,
		color: 'rgba(0,0,0,.5)',
		lines: (opts, vp, grid) => {
			//generate array of more sparse but bolder lines
		},
		labels: false
	}, {
		name: 'X-axis',
		color: 'rgba(0,0,0,1)',
		lines: false,
		axis: 0,
		labels: (opts, vp, grid) => {
			//generate object based on current resolution
		}
	}],
	y: //same as x
});


//4. Multicoordinate grid
let multiGrid = createGrid({
	x: [{
		name: 'top axis',
		labels: {10: 'a', 20: 'b', 30: 'c'},
		tick: 2,
		axis: 'top'
	}, {
		name: 'bottom axis',
		labels: {1.2: 'x', 2.4: 'y', 3.6: 'z', ...},
	}],
	padding: 40
});

//5. Polar grid
let polarGrid = createGrid({

});
