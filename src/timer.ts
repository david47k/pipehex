/* timer.ts
 * A simple timer, with string converstion function.
 *
 * Copyright 2022 David Atkinson <david47k@d47.co>
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

export function timestringFrom(ms: number) {
	let s = Math.trunc(ms / 1000);
	const m = Math.trunc(s / 60);
	s -= (m * 60);
	let ss = s.toString();
	if(ss.length < 2) ss = '0' + ss;
	return m.toString() + ':' + ss;
}

export interface Timer {
	time: number;
	timestamp: number;
	running: boolean;
}


export class Timer {
	constructor({time = 0} = {}) {
		this.time = time;
		this.timestamp = 0;
		this.running = false;
	}

	start(ts: number) {
		if(this.running) {
			this.update(ts);
		} else {
			this.timestamp = ts;
			this.running = true;
		}
	}

	stop(ts: number) {
		if(this.running) {
			this.update(ts);
			this.running = false;
		}
	}
	reset() {
		this.running = false;
		this.time = 0;
	}

	update(ts: number) {
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
	getMillis() {
		return this.time;
	}
	timestring() {
		return timestringFrom(this.time);
	}	
}

