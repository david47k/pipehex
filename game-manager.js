
import CONFIG from './config.js';
import { View, PALETTE_SIZE } from './view.js';
import PUZZLES from './puzzles.js';
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

// shape & rotation maps to connections
const example_conns = [ 0, 0, 0, 1, 1, 1 ];	// type: ibool[6]

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

function array_equal(a, b) {
    if(Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => array_equal(v,b[i]));
	} else {
		return a === b;
	}
}

function shape_match(conns_a, conns_b) { // type ibool[6], ibool[6]
	var rconns = conns_b;
	for (var i=0; i<6; i++) {
		if(array_equal(rconns, conns_a)) {
			return [ true, i ];
		}
		rconns = [ rconns[5], rconns[0], rconns[1], rconns[2], rconns[3], rconns[4] ];
	}
		
	return [ false, 0 ];
}
	
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
			let [r,a] = shape_match(conns, shape_match_arr[test_idx]);
			if(r==true) { 
				shape_idx = test_idx;
				angle_idx = a;
				break;
			}
		}
	} else if (pipe_count==6) {
		shape_idx = 13;
		// angle_idx is set to 0
	}

	return [ shape_idx, angle_idx ];
}


export class Timer {
	constructor({time = 0} = {}) {
		this.time = time;
		this.timestamp = null;
		this.running = false;
	}
	start(ts) {
		if(this.running) {
			this.update(ts);
		} else {
			this.timestamp = ts;
			this.running = true;
		}
	}
	stop(ts) {
		if(this.running) {
			this.time += ts - this.timestamp;
			this.running = false;
		}
	}
	reset() {
		this.running = false;
		this.time = 0;
	}
	set_millis(ms) {
		this.time = ms;
	}
	update(ts) {
		if(this.running) {
			this.time += ts - this.timestamp;
			this.timestamp = ts;
		}
	}		
	get_millis() {
		return this.time;
	}
	get_timestring(ts) {
		let t = this.time;
		if(this.running) {
			t += ts - this.timestamp;
		}
		let s = Math.trunc(t / 1000);
		let m = Math.trunc(s / 60);
		s -= (m * 60);
		let ss = s.toString();
		if(ss.length < 2) ss = '0' + ss;
		return m.toString() + ':' + ss;
	}	
}

export function timestring_from_secs(secs) {
	let s = Math.trunc(secs);
	let m = Math.trunc(s / 60);
	s -= (m * 60);
	let ss = s.toString();
	if(ss.length < 2) ss = '0' + ss;
	return m.toString() + ':' + ss;	
}

export class Tile {
	constructor( { conns = [coin_flip(), coin_flip(), coin_flip(), coin_flip(), coin_flip(), coin_flip()],
					color = 0, isolated = true, locked = false, looped = false } = {} ) {
		this.conns = conns;
		[ this.shape, this.angle ] = conns_to_shapeangle(this.conns);
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
	setup(nconns) {
		this.conns = nconns;
		[ this.shape, this.angle ] = conns_to_shapeangle(this.conns);
	}
	equal(tile) {
		this.conns.every((x,i) => x == tile.conns[i]);
	}
}

function coin_flip() { // return 0 or 1
	return Math.trunc(Math.random() * 2);
}

function rand_inclusive(n) {
	return Math.trunc(Math.random() * (n+1));
}

let tile_sizes = [ [ 56, 64, 48 ], [ 42, 48, 36 ], [ 28, 32, 24 ] ];
const BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

export class Game {
	constructor({ puzzle_w=0, puzzle_h=0, grid = null, sol_grid = null, won = false, title = '(puzzle title)', timer = {time:0} } = {}) {
		this.puzzle_w = puzzle_w;
		this.puzzle_h = puzzle_h;
		this.grid = this.new_game_grid(grid);
		this.sol_grid = sol_grid;
		this.won = won;
		this.title = title;
		this.timer = new Timer(timer);
		this.tile_w = 56;
		this.tile_h = 64;	// should be multiple of at least 8, probably 16 too...
		this.tile_vo = this.tile_h * 3 / 4; // It will be 3/4 of tile_h (32 is one side, 64 is long radius, so 48 will be the voffset)
		this.last_ts = 0;
		this.ts = 0;
		this.winningAnimation = { started: false, start_ts: 0 };
	}
	tile_from_xy(x,y) {
		return this.grid[y][x];
	}
	tile_from_idx(idx) {
		let y = ~~(idx/this.puzzle_w);	// works for 32-bit positive numbers
		let x = idx%this.puzzle_w;
		return this.grid[y][x];
	}
	xy_from_idx(idx) {
		let y = ~~(idx/this.puzzle_w);
		let x = idx % this.puzzle_w;
		return [x,y];
	}
	idx_from_xy(x,y) {
		return (y*this.puzzle_w+x);
	}
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
	pause(ts) {		// return true if we are now paused, false if we are now running
		if(!this.timer.running) {
			this.timer.start(ts);
			return false;
		} else {
			this.timer.stop(ts);
			return true;
		}
	}
	load_level_string(s) {
		// level string is in format w,h,puzzle,solution
		let [ title, w, h, puz, sol ] = s.split(',');
		this.title = title;
		this.puzzle_w = parseInt(w);
		this.puzzle_h = parseInt(h);
		this.grid = this.new_game_grid_from_puzstr(puz);
		this.sol_grid = this.new_game_grid_from_puzstr(sol);
	}
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
	inBounds(x,y) {
		return (x>=0 && x<this.puzzle_w && y>= 0 && y<this.puzzle_h);
	}
	invertAngle(a) {
		if(a > 2) { return a-3; }
		return a+3;
	}
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
	get_connected_tiles_o(x,y,tileset,recursive) {
		// return a set of [x,y] of tiles that are connected to this one
		// return an empty set for none
		// initially pass a set with just this [x,y]
		for(let a=0; a<6; a++) {
			if(!this.grid[y][x].conns[a]) continue;	// if we're not connected, continue
			let nxy = this.get_gxy_at_angle(x,y,a);	// get tile that's at that angle
			if(nxy == null) continue; // no tile there
			let [nx,ny] = nxy;
			if(this.grid[ny][nx].conns[this.invertAngle(a)]) {
				// we have a connection!
				// check we don't already have it stored
				if(!tileset.has(ny*this.puzzle_w+nx)) {
					tileset.add(ny*this.puzzle_w+nx);
					if(recursive) tileset = this.get_connected_tiles_o(nx,ny,tileset,recursive);
				}
			}
		}
		return tileset;
	}
	get_connected_tiles(px,py,recursive) {
		// return a set of [x,y] of tiles that are connected to this one
		let stack = [[px,py,null]];
		let tileset = new Set();
		tileset.add(py*this.puzzle_w+px);
		let looped_set = new Set();
		
		for(let i=0; i<stack.length; i++) {
			let x = stack[i][0];
			let y = stack[i][1];
			let fromangle = stack[i][2];
			for(let a=0; a<6; a++) {
				if(fromangle != null && fromangle == a) continue; // don't check where we came from
				if(!this.grid[y][x].conns[a]) continue;	// if we're not connected, continue
				let nxy = this.get_gxy_at_angle(x,y,a);	// get tile that's at that angle
				if(nxy == null) continue; // no tile there
				let [nx,ny] = nxy;
				if(this.grid[ny][nx].conns[this.invertAngle(a)]) {
					// we have a connection!
					// check we don't already have it stored
					if(tileset.has(ny*this.puzzle_w+nx)) {
						console.log('FOUND A LOOP',nx,ny);	
						// TO DO: return a pruned version of the whole tileset
						looped_set.add(y*this.puzzle_w+x);
						looped_set.add(ny*this.puzzle_w+nx);
					} else {
						tileset.add(ny*this.puzzle_w+nx);
						if(recursive) {
							stack.push([nx,ny,this.invertAngle(a)]);
						}
					}
				}
			}
		}
		return [tileset,looped_set];
	}
}


function readFile(filename, onloadfn) {
    const oReq = new XMLHttpRequest();
    oReq.open("GET", filename, true);
    oReq.responseType = "text";
    oReq.onload = function(oEvent) {
		const t = oReq.response;
		console.log("puzzle file loaded: ",filename);
		// parse CSV into lines
		let puzzle_array = [];
		let lines = t.split("\n");
		lines.forEach( l => { if(l.length>8) puzzle_array.push(l); } );		
        onloadfn(puzzle_array);
    };
    oReq.send(null);
}


export class GameManager {
	constructor() {
		this.PUZZLES = { '5': [], '10': [], '15': [], '20': [], '30': [], '40': [] };
		this.puzzle_type = Storage.loadStr('puzzle_type','5');
		this.puzzle_idx = Storage.loadInt('puzzle_idx'+this.puzzle_type,0);
		this.showStats = false;
		this.showFPS = true;
		this.showTimer = true;
		
		readFile('/puzzles5.csv', a => this.PUZZLES['5'] = a );
		readFile('/puzzles10.csv', a => this.PUZZLES['10'] = a );
		readFile('/puzzles15.csv', a => this.PUZZLES['15'] = a );
		readFile('/puzzles20.csv', a => this.PUZZLES['20'] = a );
		readFile('/puzzles30.csv', a => this.PUZZLES['30'] = a );
		readFile('/puzzles40.csv', a => this.PUZZLES['40'] = a );

		this.transitionList = [];
		this.renderSet = new Set();
		this.loopedSet = new Set();
		this.game = this.loadGame(parseInt(this.puzzle_type));
		
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
			var gm = document.gameManager;
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
		if(this.puzzle_idx + 1 >= this.PUZZLES[this.puzzle_type].length) {
			console.log("Ran out of puzzles!");
		} else {
			this.puzzle_idx++;
			Storage.saveInt('puzzle_idx'+this.puzzle_type,this.puzzle_idx);
			this.restart();
		}
	}
	restart({restart_solved = false, restart_game = true}={}) {	
		// check if we have finished loading the puzzle data, if not, try again later.
		if(this.PUZZLES[this.puzzle_type].length < 1) {
			setTimeout(() => document.gameManager.restart({restart_solved:restart_solved, restart_game:restart_game}), 100);
			return;
		}

		// use puzzle_type and puzzle_idx
		if(restart_game || this.game.puzzle_w==0) {
			let n = parseInt(this.puzzle_type);
			this.game = new Game({puzzle_w:n,puzzle_h:n});
			this.game.load_level_string(this.PUZZLES[this.puzzle_type][this.puzzle_idx]);
		}
		
		// if the game has been solved, actually load the solved puzzle, and set win condition
		if(!restart_solved) {
			let hs = Storage.loadObj('highscore_'+this.puzzle_type, []);
			let t = parseInt(hs[this.puzzle_idx]);
			if(Number.isInteger(t)) {
				this.game.grid = this.game.sol_grid;
				this.game.timer.set_millis(t);
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
	}
	
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
		// we can use get_connected_tiles and read the looped set
		
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
			//tiles = tiles.filter(el => el != -1);
			for(const lt of looped_set) {
				console.log('lt',lt);
				//let [ltx,lty] = this.game.xy_from_idx(lt);
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
		for(let i=0;i<(this.game.puzzle_h*this.game.puzzle_w);i++) {
			this.renderSet.add(i);
		}
	}

	zz_runOnTimer() {
		setInterval(this.render, 1000/CONFIG.FPS);
		this.render();
	}
	saveGame() {
		Storage.saveObj('savegame',this.game);
	}
	loadGame(n) {
		// will return a fully loaded game, or just a dummy game
		let loaded = Storage.loadObj('savegame',{puzzle_w:0,puzzle_h:0});
		return new Game(loaded);
	}
	updateStats() {
		let hs = Storage.loadObj('highscore_'+this.puzzle_type, []);
		hs.sort((a, b) => a - b);
		let puztype = this.puzzle_type + 'x' + this.puzzle_type;
		let best = 'tbd';
		let best3 = 'tbd';
		let best5 = 'tbd';
		let best10 = 'tbd'
		if(hs.length>=1)  best = timestring_from_secs(hs[0]);
		if(hs.length>=3)  best3 = timestring_from_secs(hs.slice(0,3).reduce( (p, c) => p + c, 0 )/3.0);
		if(hs.length>=5)  best5 = timestring_from_secs(hs.slice(0,5).reduce( (p, c) => p + c, 0 )/5.0);
		if(hs.length>=10) best10 = timestring_from_secs(hs.slice(0,10).reduce( (p, c) => p + c, 0 )/10.0);
		this.stats = { puztype: puztype, num: hs.length.toString(), best: best, best3: best3, best5: best5, best10: best10 };
	}
	on_win() {
		this.game.timer.stop(this.game.last_ts);
		this.game.wintime = this.game.timer.get_timestring();
		document.getElementById('wintime').innerHTML = this.game.wintime;
		let hs = Storage.loadObj('highscore_'+this.puzzle_type, []);
		hs[this.puzzle_idx] = Math.trunc(this.game.timer.get_millis());
		Storage.saveObj('highscore_'+this.puzzle_type,hs);
		this.updateStats();
		if(this.game.winningAnimation.started == false) {
				this.game.winningAnimation.started = true;
				this.game.winningAnimation.start_ts = this.game.ts;
		}
	}
	click(x,y,buttons) {
		if(!this.game.won) {
			if(buttons==1) this.game.grid[y][x].rotate_cw();
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
			console.log('tileset size:',tileset.size);
			tileset.forEach((val) => {
				let tsy = Math.trunc(val/this.game.puzzle_w);
				let tsx = val%this.game.puzzle_w;
				if(this.game.grid[tsy][tsx].color != colorIdx) {
					this.game.grid[tsy][tsx].color = colorIdx;
					this.renderSet.add(val);
				}
			});
			if(this.game.have_win_condition()) {
				this.on_win();
			}
		}		
		this.render(this.game.ts); // render straight away without waiting for animationFrame
		this.saveGame();		
	}
}
