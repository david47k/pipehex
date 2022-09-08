/* game-manager.js
 * Manages the game, other components, takes interaction with the player.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

import CONFIG from './config.js';
import { View, PALETTE, PALETTE_ANNEX } from './view.js';
import Storage from './storage.js';
import { Timer, timestringFrom } from './timer.js';
import { Tile } from './tile.js';
import { arrayEqual } from './util.js';
import { Game } from './game.js';

/** @param {number} n */
function rand_inclusive(n) {
	return Math.trunc(Math.random() * (n+1));
}


/** @typedef {{width: number, height: number, grid: null | Tile[][], solvedGrid: null|Tile[][], won: boolean, title: string, timer: any }} GameLike */

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
		let puzzleArr = [];
		let lines = t.split("\n");
		for(let l of lines) {
			if(l.length>8) puzzleArr.push(l);
		}
        onloadfn(puzzleArr);
    };
    oReq.send(null);
}


export class GameManager {
	constructor() {
		/** @type {Map<string,Array<string>>} */
		this.PUZZLES = new Map();
		/** @type {string} */
		this.puzzleType = Storage.loadStr('puzzleType','5');
		this.puzzleIdx = Storage.loadInt('puzzleIdx'+this.puzzleType,0);
		this.showStats = false;
		this.showFPS = false;
		this.showTimer = true;
		this.showSettings = false;
		
		readFile('/puzzles5.csv', a => this.PUZZLES.set('5', a));
		readFile('/puzzles10.csv', a => this.PUZZLES.set('10', a ));
		readFile('/puzzles15.csv', a => this.PUZZLES.set('15', a ));
		readFile('/puzzles20.csv', a => this.PUZZLES.set('20', a ));
		readFile('/puzzles30.csv', a => this.PUZZLES.set('30', a ));
		readFile('/puzzles40.csv', a => this.PUZZLES.set('40', a ));

		this.renderSet = new Set();
		this.loopedSet = new Set();
		this.game = this.loadGame(parseInt(this.puzzleType));
		this.updateStats();
		
		this.view = new View(this.game.width,this.game.height);

		this.restart({restartSolved:false, restartGame:false});

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
			var [x, y] = gm.game.xyFromPixelCoords(ev.offsetX, ev.offsetY);
			if(gm.game.inBounds(x,y)) {
				gm.click(x,y,ev.buttons);
			}
			return false;
		});
	}
	prevPuzzle() {
		if(this.puzzleIdx <= 0) {
			console.log("No previous puzzles!");
		} else {
			this.puzzleIdx--;
			Storage.saveInt('puzzleIdx'+this.puzzleType,this.puzzleIdx);
			this.restart();
		}
	}
	nextPuzzle() {
		if(this.puzzleIdx + 1 >= this.PUZZLES.get(this.puzzleType).length) {
			console.log("Ran out of puzzles!");
		} else {
			this.puzzleIdx++;
			Storage.saveInt('puzzleIdx'+this.puzzleType,this.puzzleIdx);
			this.restart();
		}
	}
	restart({restartSolved = false, restartGame = true}={}) {	
		// check if we have finished loading the puzzle data, if not, try again later.
		if(!this.PUZZLES.has(this.puzzleType)) {
			setTimeout(() => gameManager.restart({restartSolved:restartSolved, restartGame:restartGame}), 100);
			return;
		}

		if(restartGame || this.game.width==0) {
			const n = parseInt(this.puzzleType);
			this.game = new Game({width:n,height:n});
			this.game.loadLevelString(this.PUZZLES.get(this.puzzleType)[this.puzzleIdx]);
		}
		
		// if the game has been solved, actually load the solved puzzle, and set win condition
		if(!restartSolved) {
			let hs = Storage.loadMap('highscore'+this.puzzleType, new Map());
			let t = parseInt(hs.get(this.puzzleIdx));
			if(Number.isInteger(t)) {
				this.game.grid = this.game.solvedGrid;
				this.game.timer = new Timer({time: t});
				if(this.game.haveWinCondition()) {
					this.onWin();
				}
			}
		}
		
		// set up the view, and set all tiles to be rendered
		if(this.view) {
			this.view.setUp(this.game.width,this.game.height);
			this.paintAll();
		}
		
		// save the game state
		this.saveGame();
	}
	/** @param {number} n */
	setSize(n) {
		this.puzzleType = n.toString();
		Storage.saveStr('puzzleType',this.puzzleType);
		this.puzzleIdx = Storage.loadInt('puzzleIdx'+this.puzzleType,0);
		this.updateStats();
		this.restart();
	}
	updateLoopSet() {
		const prevSet = this.loopedSet;
		this.loopedSet = new Set();
		// TO DO: have a more efficient mode, where we only look at tiles surounding the clicked tile

		let tiles = [];
		for(let n=0;n<(this.game.height*this.game.width);n++) {
			tiles.push(n);
		}
		
		while(tiles.length > 0) {
			let idx = tiles.pop();
			if(idx==-1) continue;
			let [tx, ty] = this.game.xyFromIdx(idx);
			let [tileSet, loopedSet] = this.game.getConnectedTiles(tx,ty,true);
			for (const ti of tileSet) {
				let midx = tiles.findIndex( el => el === ti );
				if(midx != -1) {
					tiles[midx] = -1;
				}
			}
			for(const lt of loopedSet) {
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
		for(let i=0;i<(this.game.height*this.game.width);i++) {
			this.renderSet.add(i);
		}
	}
	saveGame() {
		Storage.saveObj('savegame',this.game);
	}
	/** @param {number} n */
	loadGame(n) {
		// will return a fully loaded game, or just a dummy game
		this.showTimer = (Storage.loadStr('showTimer','true') === 'true');
		this.showFPS = (Storage.loadStr('showFPS','false') === 'true');
		let loaded = Storage.loadObj('savegame',{width:0,height:0});
		return new Game(loaded);
	}
	updateStats() {
		/** @type {Array<number>} */
		let hsmap = Storage.loadMap('highscore'+this.puzzleType, new Map());
		let hs = [ ...hsmap.values() ];
		hs.sort((a, b) => a - b);
		let puztype = this.puzzleType + 'x' + this.puzzleType;
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
	onWin() {
		this.game.timer.stop(this.game.tsPrior);
		this.game.wintime = this.game.timer.timestring();
		document.getElementById('wintime').innerHTML = this.game.wintime;
		let hs = Storage.loadMap('highscore'+this.puzzleType, new Map());
		hs.set(this.puzzleIdx, Math.trunc(this.game.timer.getMillis()));
		Storage.saveMap('highscore'+this.puzzleType,hs);
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
			if(buttons==0 || buttons==1) this.game.grid[y][x].rotate();
			else if(buttons==2) this.game.grid[y][x].rotate(true);
			this.renderSet.add(this.game.idxFromXy(x,y));
			this.game.timer.start(this.game.tsPrior);
			// check if we need to change colours of surrounding tiles
			let surrounding_tiles = this.game.getSurroundingTiles(x,y);
			while(surrounding_tiles.length > 0) {
				let [nx,ny] = surrounding_tiles.pop();
				if(this.game.isIsolated(nx,ny)) {
					if(this.game.grid[ny][nx].isolated == false) {
						this.game.grid[ny][nx].isolated = true;
						this.game.grid[ny][nx].color = PALETTE_ANNEX;
						this.renderSet.add(this.game.idxFromXy(nx,ny));
					}
				} else {
					if(this.game.grid[ny][nx].isolated == true) {
						this.renderSet.add(this.game.idxFromXy(nx,ny));
						this.game.grid[ny][nx].isolated = false;
						// it'll get a color below, now it is no longer isolated
					}
				}
			}
			// check if we are connected to any tiles, in which case we need to change colors
			let [tileSet,loopedSet] = this.game.getConnectedTiles(x,y,true);
			let colorIdx = this.game.grid[y][x].color;
			if(tileSet.size <= 1) {
				this.game.grid[y][x].isolated = true;
				colorIdx = PALETTE_ANNEX;
			} else {
				this.game.grid[y][x].isolated = false;
				
				let iter = tileSet.values();
				iter.next();
				let cxy = iter.next().value;		// change the color to the SECOND item in the set
				colorIdx = this.game.tileFromIdx(cxy).color;
				if(colorIdx==PALETTE_ANNEX) {
					colorIdx = ((y*this.game.width+x)%(PALETTE.length));	// randomish color
					// TODO: should ideally pick a colour that is dissimilar to surrounding colours
				}
			}
			//console.log('tileSet size:',tileSet.size);
			for(let v of tileSet) {
				let tsy = Math.trunc(v/this.game.width);
				let tsx = v%this.game.width;
				if(this.game.grid[tsy][tsx].color != colorIdx) {
					this.game.grid[tsy][tsx].color = colorIdx;
					this.renderSet.add(v);
				}
			};
			if(this.game.haveWinCondition()) {
				this.onWin();
			}
		}		
		this.render(this.game.ts); // render straight away without waiting for animationFrame
		this.saveGame();		
	}
}

// Global export

export var gameManager = new GameManager();    // global scope
Object.defineProperty(window, 'gameManager', { value: gameManager, writable: true });
