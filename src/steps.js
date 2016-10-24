/**
 * Various common steps getters, not included into bundle by default
 *
 * @module plot-grid/src/steps
 */

const scale = require('mumath/scale');


module.exports = {
	date: getDateSteps
};


function getDateSteps (minStep) {
	let step, largeStep;

	//500ms, 250ms, 100ms, 50ms, 25ms, 10ms, 5ms, ...
	if (minStep < 500) {
		step = scale(minStep, [1, 2.5, 5]);
		largeStep = scale(step*2.1,[1, 2]);
	}
	//1s, 2s, 5s, 10s, 20s
	else if (minStep < 2500) {
		let steps = [1,2.5,5];
		step = scale(minStep, steps);
		largeStep = scale(step*2.55, steps);
	}
	else {
		let minute = 60000;
		//10s
		if (minStep < minute/12) {
			step = minute/12;
			largeStep = minute/2;
		}
		else if (minStep < minute/6) {
			step = minute/4;
			largeStep = minute;
		}
		//30s
		else if (minStep < minute/2) {
			step = minute*.5;
			largeStep = minute*2;
		}
		//1min
		else if (minStep < minute) {
			step = minute*1;
			largeStep = minute*5;
		}
		//2min
		else if (minStep < minute*2) {
			step = minute*2;
			largeStep = minute*10;
		}
		//5min
		else if (minStep < minute*5) {
			step = minute*5;
			largeStep = minute*30;

		}
		//10min
		else if (minStep < minute*10) {
			step = minute*10;
			largeStep = minute*60;
		}
		//30min
		else if (minStep < minute*30) {
			step = minute*30;
			largeStep = minute*120;
		}
		//1h+
		else {
			step = minute*60;
			largeStep = minute*240;
		}
	}

	return [step, largeStep];
}
