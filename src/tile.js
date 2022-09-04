/* tile.js
 * A hexagonal tile, including rotation, determining angles, shapes etc.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */


/* Angles:
 *  4 /\ 5      4 NW    NE 5 
 *   /  \
 * 3|    |0     3 W      E 0   
 *  |    |
 *   \  /       2 SW    SE 1  
 *  2 \/ 1
 * 
 */

import { arrayEqual } from './util.js';

/* These are unused:
const angles = [ "E", "SE", "SW", "W", "NW", "NE" ];
const shapes = [ "ZERO", "ONE", "TWO_NARROW", "TWO_WIDE", "TWO_STRAIGHT", "THREE_E", "THREE_Y_LEFT",
	"THREE_Y_RIGHT", "THREE_Y_WIDE", "FOUR_K", "FOUR_PLANE", "FOUR_X", "FIVE", "SIX" ];
*/

function coin_flip() { // return 0 or 1
	return Math.trunc(Math.random() * 2);
}

const shape_match_arr = [
	[ 0, 0, 0, 0, 0, 0 ], // zero
	[ 1, 0, 0, 0, 0, 0 ], // one
    [ 1, 1, 0, 0, 0, 0 ], // two_narrow
    [ 1, 0, 1, 0, 0, 0 ], // two_wide 
    [ 1, 0, 0, 1, 0, 0 ], // two_straight 
    [ 1, 1, 1, 0, 0, 0 ], // three_e     
    [ 1, 0, 1, 1, 0, 0 ], // three_y_left
    [ 1, 0, 0, 1, 1, 0 ], // three_y_right
    [ 1, 0, 1, 0, 1, 0 ], // three_y_wide
    [ 1, 1, 1, 1, 0, 0 ], // four_k      
    [ 1, 0, 1, 1, 1, 0 ], // four_plane  
    [ 1, 1, 0, 1, 1, 0 ], // four_x      
    [ 1, 1, 1, 1, 1, 0 ], // five         
    [ 1, 1, 1, 1, 1, 1 ], // six         
];

/** @param {number[]} conns_a
 *  @param {number[]} conns_b 
 *  @returns {{m:boolean, a:number}}
 */
function shape_match(conns_a, conns_b) { // type ibool[6], ibool[6]
	var rconns = conns_b;
	for (var i=0; i<6; i++) {
		if(arrayEqual(rconns, conns_a)) {
			return { m: true, a:i };
		}
		rconns = [ rconns[5], rconns[0], rconns[1], rconns[2], rconns[3], rconns[4] ];
	}
		
	return { m: false, a:0 };
}
	
/** @param {number[]} conns
 *  @returns {{s:number,a:number}}
 */
function conns_to_shapeangle(conns) {		// conns type: bool[6]
	let pipe_count = 0;
	let angle_idx = 0;
	let angle_found = 0;
	for (let i = 0; i < 6; i++) {
		if(conns[i] == 1) {
			pipe_count++;
			if(!angle_found) {
				angle_idx = i; // find angle for pipe_count = 1
				angle_found = 1;
			}
		}
	}
	
	let shape_idx = 0;
	// if pipe_count == 0 then shape_idx = 0, angle_idx is set to 0
	if(pipe_count==1) {
		shape_idx = 1; // angle determined above
	} else if (pipe_count>=2 && pipe_count <=5) {
		for(let test_idx = 2; test_idx <= 12; test_idx++) {		
			const match_result = shape_match(conns, shape_match_arr[test_idx]);
			if(match_result.m==true) { 
				shape_idx = test_idx;
				angle_idx = match_result.a;
				break;
			}
		}
	} else if (pipe_count==6) {
		shape_idx = 13;
		// angle_idx is set to 0
	}

	return { s: shape_idx, a: angle_idx };
}

export class Tile {
	constructor( { conns = [coin_flip(), coin_flip(), coin_flip(), coin_flip(), coin_flip(), coin_flip()],
					color = 0, isolated = true, locked = false, looped = false } = {} ) {
		this.conns = conns;
		let cts_result = conns_to_shapeangle(this.conns);
		this.shape = cts_result.s;
		this.angle = cts_result.a;
		this.color = color; 	// color type: colors_index
		this.isolated = isolated;	// are we connected to any other tiles?
		this.locked = locked;	//
		this.looped = looped;	//
	}
	rotate_cw() {
		this.conns = [ this.conns[5], this.conns[0], this.conns[1], this.conns[2], this.conns[3], this.conns[4] ];
		this.angle++;
		if(this.angle==6) this.angle=0;
		if( (this.shape==4  && this.angle==3) ||
			(this.shape==8  && this.angle==2) ||
			(this.shape==11 && this.angle==3) ||
			this.shape==13 ) {
				this.angle=0;
		}
	}
	rotate_ccw() {
		this.conns = [ this.conns[1], this.conns[2], this.conns[3], this.conns[4], this.conns[5], this.conns[0] ];
		this.angle--;
		if(this.angle==-1) {
			if(this.shape==4) this.angle=2;
			else if(this.shape==8) this.angle=1;
			else if(this.shape==11) this.angle=2;
			else if(this.shape==13) this.angle=0;
			else this.angle=5;
		}
	}
	/** @param {number[]} nconns */
	setup(nconns) {
		this.conns = nconns;
		const cts_result = conns_to_shapeangle(this.conns);
		this.shape = cts_result.s;
		this.angle = cts_result.a;
	}
	/** @param {Tile} tile */
	equal(tile) {
		this.conns.every((x,i) => x == tile.conns[i]);
	}
}
