/* game-manager.js
 * The primary entry point into the game. Manages the other components and
 * interactions with the user.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

import CONFIG from './config.js';
import { View, PALETTE_SIZE } from './view.js';
import Storage from './storage.js';
import { Timer, timestringFrom } from './timer.js';
import { Tile } from './tile.js';
import { arrayEqual } from './util.js';
import { Game } from './game.js';

/** @param {number} n */
function rand_inclusive(n) {
	return Math.trunc(Math.random() * (n+1));
}

let tile_sizes = [ [ 56, 64, 48 ], [ 42, 48, 36 ], [ 28, 32, 24 ] ];

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
