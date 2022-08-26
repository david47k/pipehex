/* Copyright 2022 David Atkinson */

import CONFIG from './config.js';
import { View, PALETTE_SIZE } from './view.js';
import Storage from './storage.js';



/*
 *    /\        4 NW    NE 5 
 *   /  \
 *  |    |      3 W      E 0   
 *  |    |
 *   \  /       2 SW    SE 1  
 *    \/
 * 
 * */


const angles = [ "E", "SE", "SW", "W", "NW", "NE" ];
const shapes = [ "ZERO", "ONE", "TWO_NARROW", "TWO_WIDE", "TWO_STRAIGHT", "THREE_E", "THREE_Y_LEFT",
	"THREE_Y_RIGHT", "THREE_Y_WIDE", "FOUR_K", "FOUR_PLANE", "FOUR_X", "FIVE", "SIX" ];

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

/** @param {any} a
 *  @param {any} b 
 *  @returns {boolean}
 */
function array_equal(a, b) {
    if(Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => array_equal(v,b[i]));
	} else {
		return a === b;
	}
}

/** @param {number[]} conns_a
 *  @param {number[]} conns_b 
 *  @returns {{m:boolean, a:number}}
 */
function shape_match(conns_a, conns_b) { // type ibool[6], ibool[6]
	var rconns = conns_b;
	for (var i=0; i<6; i++) {
		if(array_equal(rconns, conns_a)) {
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

/** @param {number} ms */
function timestringFrom(ms) {
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

function coin_flip() { // return 0 or 1
	return Math.trunc(Math.random() * 2);
}

/** @param {number} n */
function rand_inclusive(n) {
	return Math.trunc(Math.random() * (n+1));
}

let tile_sizes = [ [ 56, 64, 48 ], [ 42, 48, 36 ], [ 28, 32, 24 ] ];
const BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

/** @typedef {{puzzle_w: number, puzzle_h: number, grid: null | Tile[][], sol_grid: null|Tile[][], won: boolean, title: string, timer: any }} GameLike */

// destructuring alternative. overwrites the default values we've already assigned.
// for(const [key, value] of Object.entries(params)) {
//   Object.defineProperty(this, key, { value: value, writable: true });
// }

// destructuring alternative. uses params if provided, otherwise uses defaultParams
// for(const [key, value] of Object.entries(defaultParams)) {
//   if(params.hasOwn(key) Object.defineProperty(this, key, { value: Object.getOwnPropertyDescriptor(params, key), writable: true });
//	 else Object.defineProperty(this, key, { value: value, writable: true });
// }


export class Game {
	/** @constructor
	 *  @param {object} params
	 * */
	//constructor({ puzzle_w=0, puzzle_h=0, grid = null, sol_grid = null, won = false, title = '(puzzle title)', timer = {time:0} } = {}) {
	constructor(params = {}) {
		// these are the defaults, and will be used if not overriden by params
		this.puzzle_w = 0;
		this.puzzle_h = 0;
		/** @type {Tile[][]|null} */
		this.grid =  null;
		/** @type {Tile[][]|null} */
		this.sol_grid = null;
		this.won = false;
		this.title = '(puzzle title)';
		this.timer = new Timer();
		this.wintime  ='';
		
		// this is a funny way of avoiding jsdoc/ts destructuring type issues
		for(const [key, value] of Object.entries(params)) {
			if(params.hasOwnProperty(key)) Object.defineProperty(this, key, { value: Object.getOwnPropertyDescriptor(params, key).value, writable: true });
		}

		// re-juice these objects with the correct type
		this.grid = this.new_game_grid(this.grid);
		this.timer = new Timer(this.timer);
		
		// these values will override anything passed to us
		this.tile_w = 56;
		this.tile_h = 64;	// should be multiple of at least 8, probably 16 too...
		this.tile_vo = this.tile_h * 3 / 4; // It will be 3/4 of tile_h (32 is one side, 64 is long radius, so 48 will be the voffset)
		this.last_ts = 0;
		this.ts = 0;
		this.winningAnimation = { started: false, start_ts: 0 };
	}
	/** @param {number} idx
	 *  @returns {Tile} */
	tile_from_idx(idx) {
		let y = ~~(idx/this.puzzle_w);	// works for 32-bit positive numbers
		let x = idx%this.puzzle_w;
		return this.grid[y][x];
	}
	/** @param {number} idx
	 *  @returns {[number,number]} */
	xy_from_idx(idx) {
		let y = ~~(idx/this.puzzle_w);
		let x = idx % this.puzzle_w;
		return [x,y];
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @returns {number} */
	idx_from_xy(x,y) {
		return (y*this.puzzle_w+x);
	}
	/** @param {Tile[][] | null} oldgrid
	 *  @returns {Tile[][]} */	
	new_game_grid(oldgrid = null) {
		let grid = [];
		for(let y=0; y<this.puzzle_h; y++) {
			let row = [];
			for(let x=0; x<this.puzzle_w; x++) {
				if(oldgrid == null) row.push(new Tile());
				else row.push(new Tile(oldgrid[y][x]));
			}
			grid.push(row);
		}
		return grid;
	}
	/** @param {string} puzstr
	 *  @returns {Tile[][]} */
	new_game_grid_from_puzstr(puzstr) {
		let grid = this.new_game_grid();
		// load puzzle string
		let bytes = puzstr.split('');
		// convert into a conns array e.g. [ 0, 1, 0, 1, 1, 1 ]
		for (let y=0; y<this.puzzle_h; y++) {
			for (let x=0; x<this.puzzle_w; x++) {
				let conns = [ 0, 0, 0, 0, 0, 0 ];
				let byte = bytes[y*this.puzzle_w+x];
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
	have_win_condition() {
		// does this.grid == this.sol_grid?
		if(!Array.isArray(this.sol_grid)) return false;
		for(let y=0; y<this.puzzle_h;y++) {
			for(let x=0; x<this.puzzle_w;x++) {
				if(array_equal(this.grid[y][x].conns, this.sol_grid[y][x].conns)) {
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
	load_level_string(s) {
		// level string is in format w,h,puzzle,solution
		let [ title, w, h, puz, sol ] = s.split(',');
		this.title = title;
		this.puzzle_w = parseInt(w);
		this.puzzle_h = parseInt(h);
		this.grid = this.new_game_grid_from_puzstr(puz);
		this.sol_grid = this.new_game_grid_from_puzstr(sol);
	}
	/** @param {number} px
	 *  @param {number} py
	 *  @returns {[number,number]} */
	pixel_xy_to_grid_xy(px,py) {
		// we can perform a basic translation first
		// then we need to do an advanced check for the corners
		let gy = Math.floor(py / this.tile_vo);
		let ypc = (py % this.tile_vo) / this.tile_vo; // top 1/3 is in the triangle rect
		let xindent = 0;
		if(gy%2==1) xindent = this.tile_w / 2;
		let gx = Math.floor((px - xindent) / this.tile_w);
		let xpc = ((px - xindent) % this.tile_w) / this.tile_w;
		
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
		return (x>=0 && x<this.puzzle_w && y>= 0 && y<this.puzzle_h);
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
	get_gxy_at_angle(x,y,a) {
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
		if(nx<0 || nx>(this.puzzle_w-1) || ny<0 || ny>(this.puzzle_h-1)) return null;
		return [nx,ny];
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @returns {boolean} */	
	is_isolated(x,y) {
		// return TRUE if this tile is not connected to any others
		// check each angle from this tile
		for(let a=0; a<6; a++) {
			if(!this.grid[y][x].conns[a]) continue;	// if we're not connected, continue
			let nxy = this.get_gxy_at_angle(x,y,a);	// get tile that's at that angle
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
	 *  @returns {number[][]} */
	get_surrounding_tiles(x,y) {
		// return an array of surrounding tiles (i.e. not the ones on the edge)
		// array of items [x,y]
		let arr = [];
		for(let a=0; a<6; a++) {
			let nxy = this.get_gxy_at_angle(x,y,a);	// get tile that's at that angle
			if(nxy == null) continue; // no tile there
			let [nx,ny] = nxy;
			arr.push([nx,ny]);
		}
		return arr;
	}
	/** @param {number} px
	 *  @param {number} py
	 *  @param {boolean} recursive
	 *  @returns {[Set<number>, Set<number>]} */	
	get_connected_tiles(px,py,recursive) {		// depth first, easier to find loops
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
		let tileset = new Set();
		tileset.add(py*this.puzzle_w+px);
		let looped_set = new Set();
		
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
			let nxy = this.get_gxy_at_angle(x,y,angle);	// get tile that's at that angle
			if(nxy == null) continue; // no tile there
			let [nx,ny] = nxy;
			if(this.grid[ny][nx].conns[this.invertAngle(angle)]) {
				// we have a connection!
				// check if it's already stored
				if(tileset.has(ny*this.puzzle_w+nx)) {
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
						// copy the whole looped section to looped_set
						for(let i=idx; i<stack.length; i++) {
							looped_set.add(stack[i].y*this.puzzle_w+stack[i].x);
						}
					}
				} else {
					tileset.add(ny*this.puzzle_w+nx);
					if(recursive) {
						stack.push(new StackItem(nx,ny,this.invertAngle(angle),0));
					}
				}
			}
		}
		return [tileset,looped_set];
	}
}


/** @param {string} filename
 *  @param {function(Array<string>):void} onloadfn */
 function readFile(filename, onloadfn) {
    const oReq = new XMLHttpRequest();
    oReq.open("GET", filename, true);
    oReq.responseType = "text";
    oReq.onload = function(oEvent) {
		const t = oReq.response;
		console.log("puzzle file loaded: ",filename);
		// parse CSV into lines
		/** @type { Array<string> } */
		let puzzle_array = [];
		let lines = t.split("\n");
		for(let l of lines) {
			if(l.length>8) puzzle_array.push(l);
		}
        onloadfn(puzzle_array);
    };
    oReq.send(null);
}


export class GameManager {
	constructor() {
		/** @type {Map<string,Array<string>>} */
		this.PUZZLES = new Map();
		/** @type {string} */
		this.puzzle_type = Storage.loadStr('puzzle_type','5');
		this.puzzle_idx = Storage.loadInt('puzzle_idx'+this.puzzle_type,0);
		this.showStats = false;
		this.showFPS = false;
		this.showTimer = true;
		
		readFile('/puzzles5.csv', a => this.PUZZLES.set('5', a));
		readFile('/puzzles10.csv', a => this.PUZZLES.set('10', a ));
		readFile('/puzzles15.csv', a => this.PUZZLES.set('15', a ));
		readFile('/puzzles20.csv', a => this.PUZZLES.set('20', a ));
		readFile('/puzzles30.csv', a => this.PUZZLES.set('30', a ));
		readFile('/puzzles40.csv', a => this.PUZZLES.set('40', a ));

		this.renderSet = new Set();
		this.loopedSet = new Set();
		this.game = this.loadGame(parseInt(this.puzzle_type));
		this.updateStats();
		
		this.view = new View(this.game.puzzle_w,this.game.puzzle_h);

		this.restart({restart_solved:false, restart_game:false});

		this.view.container.addEventListener('contextmenu', function(ev) {
			ev.preventDefault();
			return false;
		});
		this.view.container.addEventListener('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			ev.stopImmediatePropagation();
			return false;
		});
		this.view.container.addEventListener('mouseup', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			ev.stopImmediatePropagation();
			return false;
		});			
		this.view.container.addEventListener('mousedown', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			ev.stopImmediatePropagation();
			var gm = gameManager;
			var [x, y] = gm.game.pixel_xy_to_grid_xy(ev.offsetX, ev.offsetY);
			if(gm.game.inBounds(x,y)) {
				gm.click(x,y,ev.buttons);
			}
			return false;
		});
	}
	prev_puzzle() {
		if(this.puzzle_idx <= 0) {
			console.log("No previous puzzles!");
		} else {
			this.puzzle_idx--;
			Storage.saveInt('puzzle_idx'+this.puzzle_type,this.puzzle_idx);
			this.restart();
		}
	}
	next_puzzle() {
		if(this.puzzle_idx + 1 >= this.PUZZLES.get(this.puzzle_type).length) {
			console.log("Ran out of puzzles!");
		} else {
			this.puzzle_idx++;
			Storage.saveInt('puzzle_idx'+this.puzzle_type,this.puzzle_idx);
			this.restart();
		}
	}
	restart({restart_solved = false, restart_game = true}={}) {	
		// check if we have finished loading the puzzle data, if not, try again later.
		if(!this.PUZZLES.has(this.puzzle_type)) {
			setTimeout(() => gameManager.restart({restart_solved:restart_solved, restart_game:restart_game}), 100);
			return;
		}

		if(restart_game || this.game.puzzle_w==0) {
			const n = parseInt(this.puzzle_type);
			this.game = new Game({puzzle_w:n,puzzle_h:n});
			this.game.load_level_string(this.PUZZLES.get(this.puzzle_type)[this.puzzle_idx]);
		}
		
		// if the game has been solved, actually load the solved puzzle, and set win condition
		if(!restart_solved) {
			let hs = Storage.loadMap('highscore_'+this.puzzle_type, new Map());
			let t = parseInt(hs.get(this.puzzle_idx));
			if(Number.isInteger(t)) {
				this.game.grid = this.game.sol_grid;
				this.game.timer = new Timer({time: t});
				if(this.game.have_win_condition()) {
					this.on_win();
				}
			}
		}
		
		// set up the view, and set all tiles to be rendered
		if(this.view) {
			this.view.setUp(this.game.puzzle_w,this.game.puzzle_h);
			this.paintAll();
		}
		
		// save the game state
		this.saveGame();
	}
	/** @param {number} n */
	setSize(n) {
		this.puzzle_type = n.toString();
		Storage.saveStr('puzzle_type',this.puzzle_type);
		this.puzzle_idx = Storage.loadInt('puzzle_idx'+this.puzzle_type,0);
		this.updateStats();
		this.restart();
	}
	updateLoopSet() {
		const prevSet = this.loopedSet;
		this.loopedSet = new Set();
		// TO DO: have a more efficient mode, where we only look at tiles surounding the clicked tile

		let tiles = [];
		for(let n=0;n<(this.game.puzzle_h*this.game.puzzle_w);n++) {
			tiles.push(n);
		}
		
		while(tiles.length > 0) {
			let idx = tiles.pop();
			if(idx==-1) continue;
			let [tx, ty] = this.game.xy_from_idx(idx);
			let [tileset, looped_set] = this.game.get_connected_tiles(tx,ty,true);
			for (const ti of tileset) {
				let midx = tiles.findIndex( el => el === ti );
				if(midx != -1) {
					tiles[midx] = -1;
				}
			}
			for(const lt of looped_set) {
				//console.log('lt',lt);
				this.loopedSet.add(lt);
			}
		}
		// we need to render everything that has changed between prevSet and loopedSet
		// ie. anything exclusive to one set, but not anything that is in both
		for(const psi of prevSet) {
			if(!this.loopedSet.has(psi)) {
				this.renderSet.add(psi);
			}
		}
		for(const lsi of this.loopedSet) {
			if(!prevSet.has(lsi)) {
				this.renderSet.add(lsi);
			}
		}
	}
	/** @param {number} ts */
	render(ts) {
		this.game.ts = ts;
		this.game.timer.update(ts);
		
		// check for a change
		if(this.renderSet.size > 0) {
			// locate loops, in the whole puzzle
			this.updateLoopSet();
		}
		
		this.view.render();
	}
	paintAll() {
		// note: paintAll does not call render(), render will be called by the animationFrame main() loop
		this.renderSet = new Set();
		this.loopedSet = new Set();
		this.updateLoopSet();
		for(let i=0;i<(this.game.puzzle_h*this.game.puzzle_w);i++) {
			this.renderSet.add(i);
		}
	}
	saveGame() {
		Storage.saveObj('savegame',this.game);
	}
	/** @param {number} n */
	loadGame(n) {
		// will return a fully loaded game, or just a dummy game
		let loaded = Storage.loadObj('savegame',{puzzle_w:0,puzzle_h:0});
		return new Game(loaded);
	}
	updateStats() {
		/** @type {Array<number>} */
		let hsmap = Storage.loadMap('highscore_'+this.puzzle_type, new Map());
		let hs = [ ...hsmap.values() ];
		hs.sort((a, b) => a - b);
		let puztype = this.puzzle_type + 'x' + this.puzzle_type;
		let best = 'tbd';
		let best3 = 'tbd';
		let best5 = 'tbd';
		let best10 = 'tbd'
		if(hs.length>=1)  best = timestringFrom(hs[0]);
		if(hs.length>=3)  best3 = timestringFrom(hs.slice(0,3).reduce( (p, c) => p + c, 0 )/3.0);
		if(hs.length>=5)  best5 = timestringFrom(hs.slice(0,5).reduce( (p, c) => p + c, 0 )/5.0);
		if(hs.length>=10) best10 = timestringFrom(hs.slice(0,10).reduce( (p, c) => p + c, 0 )/10.0);
		this.stats = { puztype: puztype, num: hs.length.toString(), best: best, best3: best3, best5: best5, best10: best10 };
	}
	on_win() {
		this.game.timer.stop(this.game.last_ts);
		this.game.wintime = this.game.timer.timestring();
		document.getElementById('wintime').innerHTML = this.game.wintime;
		let hs = Storage.loadMap('highscore_'+this.puzzle_type, new Map());
		hs.set(this.puzzle_idx, Math.trunc(this.game.timer.get_millis()));
		Storage.saveMap('highscore_'+this.puzzle_type,hs);
		this.updateStats();
		if(this.game.winningAnimation.started == false) {
				this.game.winningAnimation.started = true;
				this.game.winningAnimation.start_ts = this.game.ts;
		}
	}
	/** @param {number} x
	 *  @param {number} y
	 *  @param {number} buttons */
	click(x,y,buttons) {
		if(!this.game.won) {
			if(buttons==0 || buttons==1) this.game.grid[y][x].rotate_cw();
			else if(buttons==2) this.game.grid[y][x].rotate_ccw();
			this.renderSet.add(this.game.idx_from_xy(x,y));
			this.game.timer.start(this.game.last_ts);
			// check if we need to change colours of surrounding tiles
			let surrounding_tiles = this.game.get_surrounding_tiles(x,y);
			while(surrounding_tiles.length > 0) {
				let [nx,ny] = surrounding_tiles.pop();
				if(this.game.is_isolated(nx,ny)) {
					if(this.game.grid[ny][nx].isolated == false) {
						this.game.grid[ny][nx].isolated = true;
						this.game.grid[ny][nx].color = 0;
						this.renderSet.add(this.game.idx_from_xy(nx,ny));
					}
				} else {
					if(this.game.grid[ny][nx].isolated == true) {
						this.renderSet.add(this.game.idx_from_xy(nx,ny));
						this.game.grid[ny][nx].isolated = false;
						// it'll get a color below, now it is no longer isolated
					}
				}
			}
			// check if we are connected to any tiles, in which case we need to change colors
			let [tileset,looped_set] = this.game.get_connected_tiles(x,y,true);
			let colorIdx = this.game.grid[y][x].color;
			if(tileset.size <= 1) {
				this.game.grid[y][x].isolated = true;
				colorIdx = 0;
			} else {
				this.game.grid[y][x].isolated = false;
				
				let iter = tileset.values();
				iter.next();
				let cxy = iter.next().value;		// change the color to the SECOND item in the set
				colorIdx = this.game.tile_from_idx(cxy).color;
				if(colorIdx==0) {
					colorIdx = 1+((y*this.game.puzzle_w+x)%(PALETTE_SIZE-1));	// randomish color
					// TODO: should ideally pick a colour that is dissimilar to surrounding colours
				}
			}
			//console.log('tileset size:',tileset.size);
			for(let v of tileset) {
				let tsy = Math.trunc(v/this.game.puzzle_w);
				let tsx = v%this.game.puzzle_w;
				if(this.game.grid[tsy][tsx].color != colorIdx) {
					this.game.grid[tsy][tsx].color = colorIdx;
					this.renderSet.add(v);
				}
			};
			if(this.game.have_win_condition()) {
				this.on_win();
			}
		}		
		this.render(this.game.ts); // render straight away without waiting for animationFrame
		this.saveGame();		
	}
}

// Global export

export var gameManager = new GameManager();    // global scope
// window.gameManager = new GameManager(); roughly equivalent to this
