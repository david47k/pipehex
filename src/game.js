/* game.js
 * The game/puzzle, loading methods, game state, interactions etc.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

import { Timer } from './timer.js';
import { Tile } from './tile.js';
import { arrayEqual } from './util.js';

const BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

export class Game {
	/** @constructor
	 *  @param {object} params
	 * */
	//constructor({ width=0, height=0, grid = null, solvedGrid = null, won = false, title = '(puzzle title)', timer = {time:0} } = {}) {
	constructor(params = {}) {
		// these are the defaults, and will be used if not overriden by params
		this.width = 0;
		this.height = 0;
		/** @type {Tile[][]|null} */
		this.grid =  null;
		/** @type {Tile[][]|null} */
		this.solvedGrid = null;
		this.won = false;
		this.title = '(puzzle title)';
		this.timer = new Timer();
		this.wintime  ='';
		
		// this is a funny way of avoiding jsdoc/ts destructuring type issues
		for(const [key, value] of Object.entries(params)) {
			if(params.hasOwnProperty(key)) Object.defineProperty(this, key, { value: Object.getOwnPropertyDescriptor(params, key).value, writable: true });
		}

		// re-juice these objects with the correct type
		this.grid = this.newGrid(this.grid);
		this.timer = new Timer(this.timer);
		
		// these values will override anything passed to us
		this.tileW = 56;
		this.tileH = 64;	// should be multiple of at least 8, probably 16 too...
		this.tileVO = this.tileH * 3 / 4; // It will be 3/4 of tileH (32 is one side, 64 is long radius, so 48 will be the voffset)
		this.tsPrior = 0;
		this.ts = 0;
		this.winningAnimation = { started: false, start_ts: 0 };
	}
	/** @param {number} idx
	 *  @returns {Tile} */
	tileFromIdx(idx) {
		let y = ~~(idx/this.width);	// works for 32-bit positive numbers
		let x = idx%this.width;
		return this.grid[y][x];
	}
	/** @param {number} idx
	 *  @returns {[number,number]} */
	xyFromIdx(idx) {
		let y = ~~(idx/this.width);
		let x = idx % this.width;
		return [x,y];
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @returns {number} */
	idxFromXy(x,y) {
		return (y*this.width+x);
	}
	/** @param {Tile[][] | null} oldgrid
	 *  @returns {Tile[][]} */	
	newGrid(oldgrid = null) {
		let grid = [];
		for(let y=0; y<this.height; y++) {
			let row = [];
			for(let x=0; x<this.width; x++) {
				if(oldgrid == null) row.push(new Tile());
				else row.push(new Tile(oldgrid[y][x]));
			}
			grid.push(row);
		}
		return grid;
	}
	/** @param {string} puzstr
	 *  @returns {Tile[][]} */
	newGridFromPuzstr(puzstr) {
		let grid = this.newGrid();
		// load puzzle string
		let bytes = puzstr.split('');
		// convert into a conns array e.g. [ 0, 1, 0, 1, 1, 1 ]
		for (let y=0; y<this.height; y++) {
			for (let x=0; x<this.width; x++) {
				let conns = [ 0, 0, 0, 0, 0, 0 ];
				let byte = bytes[y*this.width+x];
				let idx = BASE.indexOf(byte);
				if((idx & 0x01) == 0x01) conns[0] = 1;
				if((idx & 0x02) == 0x02) conns[1] = 1;
				if((idx & 0x04) == 0x04) conns[2] = 1;
				if((idx & 0x08) == 0x08) conns[3] = 1;
				if((idx & 0x10) == 0x10) conns[4] = 1;
				if((idx & 0x20) == 0x20) conns[5] = 1;
				grid[y][x].setup(conns);
			}
		}
		// TODO: Set isolated as appropriate on every tile!!! And do a run to find connected sets and make them
		// the same color!!!
		return grid;
	}
	/** @returns {boolean} */	
	haveWinCondition() {
		// does this.grid == this.solvedGrid?
		if(!Array.isArray(this.solvedGrid)) return false;
		for(let y=0; y<this.height;y++) {
			for(let x=0; x<this.width;x++) {
				if(arrayEqual(this.grid[y][x].conns, this.solvedGrid[y][x].conns)) {
					continue;
				} else {
					return false;
				}
			}
		}
		this.won = true;
		return true;
	}
	/** @param {number} ts
	 *  @returns {boolean} */
	pause(ts) {		// return true if we are now paused, false if we are now running
		if(!this.timer.running) {
			this.timer.start(ts);
			return false;
		} else {
			this.timer.stop(ts);
			return true;
		}
	}
	/** @param {string} s */
	loadLevelString(s) {
		// level string is in format w,h,puzzle,solution
		let [ title, w, h, puz, sol ] = s.split(',');
		this.title = title;
		this.width = parseInt(w);
		this.height = parseInt(h);
		this.grid = this.newGridFromPuzstr(puz);
		this.solvedGrid = this.newGridFromPuzstr(sol);
	}
	/** @param {number} px
	 *  @param {number} py
	 *  @returns {[number,number]} */
	xyFromPixelCoords(px,py) {
		// we can perform a basic translation first
		// then we need to do an advanced check for the corners
		let gy = Math.floor(py / this.tileVO);
		let ypc = (py % this.tileVO) / this.tileVO; // top 1/3 is in the triangle rect
		let xindent = 0;
		if(gy%2==1) xindent = this.tileW / 2;
		let gx = Math.floor((px - xindent) / this.tileW);
		let xpc = ((px - xindent) % this.tileW) / this.tileW;
		
		if (ypc < (1.0/3.0)) {
			// we are in the triangle rectangle, we gotta figure out if we are in the triangle or not
			//  +----+----+            yf=0.0
			//  |AA.' '.BB|
			//  |.'     '.|
			//  +----+----+            yf=1.0
			//xpc=0.0    xpc=1.0
			let yf = ypc*3.0;
			if(xpc < 0.5) {
				if ((2.0*xpc)<(1.0-yf)) { // we are in the AA region
					// tile is same grid x, but grid y is one less
					if(gy%2==0) gx -= 1;
					gy -= 1;
				} else {
					//...
				}
			} else {
				if(((xpc-0.5)*2.0)>yf) { // we are in the BB region
					// tile is one more grid x, one less grid y
					if(gy%2==0) gx -= 1;
					gy -= 1;
					gx += 1;
				} else {
					//...
				}
			}
		}
		return [gx,gy]; // Warning: results may be out of range
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @returns {boolean} */	
	inBounds(x,y) {
		return (x>=0 && x<this.width && y>= 0 && y<this.height);
	}
	/** @param {number} a
	 *  @returns {number} */	
	invertAngle(a) {
		if(a > 2) { return a-3; }
		return a+3;
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @param {number} a
	 *  @returns {[number,number] | null} */
	xyAtAngle(x,y,a) {
		// return the [x,y] of a tile at the angle a
		// or return null if there is no tile

		let nx = x;
		let ny = y;
		
		if(a==0) nx++;
		else if(a==1) {
			if(y%2==0) ny++;
			else { nx++; ny++; }
		}
		else if(a==2) {
			if(y%2==0) { nx--; ny++; }
			else { ny++; }
		}
		else if(a==3) { nx--; }
		else if(a==4) {
			if(y%2==0) { nx--; ny--; }
			else ny--;
		}
		else if(a==5) {
			if(y%2==0) ny--;
			else { nx++; ny--; }
		}
		if(nx<0 || nx>(this.width-1) || ny<0 || ny>(this.height-1)) return null;
		return [nx,ny];
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @returns {boolean} */	
	isIsolated(x,y) {
		// return TRUE if this tile is not connected to any others
		// check each angle from this tile
		for(let a=0; a<6; a++) {
			if(!this.grid[y][x].conns[a]) continue;	// if we're not connected, continue
			let nxy = this.xyAtAngle(x,y,a);	// get tile that's at that angle
			if(nxy == null) continue; // no tile there
			let [nx,ny] = nxy;
			if(this.grid[ny][nx].conns[this.invertAngle(a)]) {
				return false;	// we have a connection!
			}
		}
		return true; 	// not connected
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @returns {number[]} */
	getSurroundingTiles(x,y) {
		// return an array of surrounding tiles (i.e. not the ones on the edge)
		// array of items [x,y]
		/** @var {number[]} */
		let arr = [];
		for(let a=0; a<6; a++) {
			let nxy = this.xyAtAngle(x,y,a);	// get tile that's at that angle
			if(nxy == null) continue; // no tile there
			let [nx,ny] = nxy;
			let idx = this.idxFromXy(nx,ny);
			arr.push(idx);
		}
		return arr;
	}
	/** @param {number} px
	 *  @param {number} py
	 *  @param {boolean} recursive
	 *  @returns {[Set<number>, Set<number>]} */	
	getConnectedTiles(px,py,recursive) {		// depth first, easier to find loops
		class StackItem {
		/** @param {number} px
		 *  @param {number} py
		 *  @param {number | null} fromangle
		 *  @param {number} angle */				
			constructor(px,py,fromangle,angle) {
				this.x = px;
				this.y = py;
				this.fromangle = fromangle;
				this.angle = angle;
			}
		}
		// return a set of [x,y] of tiles that are connected to this one
		let stack = [new StackItem(px,py,null,0)];
		let tileSet = new Set();
		tileSet.add(py*this.width+px);
		let loopedSet = new Set();
		
		while(stack.length > 0) {
			let item = stack.pop();
			let x = item.x;
			let y = item.y;
			let fromangle = item.fromangle;
			let angle = item.angle;
			
			if(angle>5)	continue;

			// add ourselves back on to the stack, with the next angle
			stack.push(new StackItem(x,y,fromangle,angle+1));
			if(fromangle != null && fromangle == angle) continue; // don't check where we came from
			if(!this.grid[y][x].conns[angle]) continue;	// if we're not connected, continue
			let nxy = this.xyAtAngle(x,y,angle);	// get tile that's at that angle
			if(nxy == null) continue; // no tile there
			let [nx,ny] = nxy;
			if(this.grid[ny][nx].conns[this.invertAngle(angle)]) {
				// we have a connection!
				// check if it's already stored
				if(tileSet.has(ny*this.width+nx)) {
					// the stack should have all the looped tiles in it, between 
					// where the stack has nx,ny, and the end of stack.

					// find the start point
					let idx=0;
					for(idx=0; idx<stack.length; idx++) {
						if(stack[idx].x == nx && stack[idx].y == ny) break;
					}
					if(idx==stack.length) {
						// console.log("unable to find looped tile in stack",nx,ny);
					} else {
						// copy the whole looped section to loopedSet
						for(let i=idx; i<stack.length; i++) {
							loopedSet.add(stack[i].y*this.width+stack[i].x);
						}
					}
				} else {
					tileSet.add(ny*this.width+nx);
					if(recursive) {
						stack.push(new StackItem(nx,ny,this.invertAngle(angle),0));
					}
				}
			}
		}
		return [tileSet,loopedSet];
	}
}

