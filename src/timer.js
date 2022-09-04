/* timer.js
 * A simple timer, with string converstion function.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

/** @param {number} ms */
export function timestringFrom(ms) {
	let s = Math.trunc(ms / 1000);
	const m = Math.trunc(s / 60);
	s -= (m * 60);
	let ss = s.toString();
	if(ss.length < 2) ss = '0' + ss;
	return m.toString() + ':' + ss;
}


export class Timer {
	constructor({time = 0} = {}) {
		this.time = time;
		this.timestamp = 0;
		this.running = false;
	}
	/** @param {number} ts */
	start(ts) {
		if(this.running) {
			this.update(ts);
		} else {
			this.timestamp = ts;
			this.running = true;
		}
	}
	/** @param {number} ts */
	stop(ts) {
		if(this.running) {
			this.update(ts);
			this.running = false;
		}
	}
	reset() {
		this.running = false;
		this.time = 0;
	}
	/** @param {number} ms */
	set_millis(ms) {
		this.time = ms;
	}
	/** @param {number} ts */
	update(ts) {
		if(this.running) {
			const delta = ts - this.timestamp;
			if(delta >= 0) {
				this.time += delta;
			} else {
				console.log('time has gone backwards');
			}
			this.timestamp = ts;
		}
	}		
	get_millis() {
		return this.time;
	}
	timestring() {
		return timestringFrom(this.time);
	}	
}

