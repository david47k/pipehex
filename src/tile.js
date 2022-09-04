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

function coinFlip() { // return 0 or 1
	return Math.trunc(Math.random() * 2);
}

const shapeMatchArr = [
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

/** @param {number[]} connsA
 *  @param {number[]} connsB 
 *  @returns {{m:boolean, a:number}}
 */
function shapeMatch(connsA, connsB) { // type ibool[6], ibool[6]
	var rconns = connsB;
	for (var i=0; i<6; i++) {
		if(arrayEqual(rconns, connsA)) {
			return { m: true, a:i };
		}
		rconns = [ rconns[5], rconns[0], rconns[1], rconns[2], rconns[3], rconns[4] ];
	}
		
	return { m: false, a:0 };
}
	
/** @param {number[]} conns
 *  @returns {{s:number,a:number}}
 */
function connsToShapeAngle(conns) {		// conns type: bool[6]
	let pipeCount = 0;
	let angleIdx = 0;
	let angleFound = 0;
	for (let i = 0; i < 6; i++) {
		if(conns[i] == 1) {
			pipeCount++;
			if(!angleFound) {
				angleIdx = i; // find angle for pipeCount = 1
				angleFound = 1;
			}
		}
	}
	
	let shapeIdx = 0;
	// if pipeCount == 0 then shapeIdx = 0, angleIdx is set to 0
	if(pipeCount==1) {
		shapeIdx = 1; // angle determined above
	} else if (pipeCount>=2 && pipeCount <=5) {
		for(let testIdx = 2; testIdx <= 12; testIdx++) {		
			const matchResult = shapeMatch(conns, shapeMatchArr[testIdx]);
			if(matchResult.m==true) { 
				shapeIdx = testIdx;
				angleIdx = matchResult.a;
				break;
			}
		}
	} else if (pipeCount==6) {
		shapeIdx = 13;
		// angleIdx is set to 0
	}

	return { s: shapeIdx, a: angleIdx };
}

export class Tile {
	constructor( { conns = [coinFlip(), coinFlip(), coinFlip(), coinFlip(), coinFlip(), coinFlip()],
					color = 0, isolated = true, locked = false, looped = false } = {} ) {
		this.conns = conns;
		let shapeAngle = connsToShapeAngle(this.conns);
		this.shape = shapeAngle.s;
		this.angle = shapeAngle.a;
		this.color = color; 	// color type: colorsIndex
		this.isolated = isolated;	// are we connected to any other tiles?
		this.locked = locked;	//
		this.looped = looped;	//
	}
	rotate(ccw = false) {
		if(!ccw) { // not counter-clockwise
			this.conns = [ this.conns[5], this.conns[0], this.conns[1], this.conns[2], this.conns[3], this.conns[4] ];
			this.angle++;
			if(this.angle==6) this.angle=0;
			if( (this.shape==4  && this.angle==3) ||
				(this.shape==8  && this.angle==2) ||
				(this.shape==11 && this.angle==3) ||
				this.shape==13 ) {
					this.angle=0;
			}
		} else { // counter-clockwise
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
	}
	/** @param {number[]} nconns */
	setup(nconns) {
		this.conns = nconns;
		const shapeAngle = connsToShapeAngle(this.conns);
		this.shape = shapeAngle.s;
		this.angle = shapeAngle.a;
	}
	/** @param {Tile} tile */
	equal(tile) {
		this.conns.every((x,i) => x == tile.conns[i]);
	}
}
