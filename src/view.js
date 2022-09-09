/* view.js
 * The view of the game, rendered to the HTML document / DOM.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

import { Tile }  from './tile.js';
import { gameManager } from './game-manager.js';
import { Game } from './game.js';
import { setAriaPressed, setHideClass } from './util.js';
import Storage from './storage.js';
import { PATTERNS5 } from './patterns.js';


// Munsell C8V7 palette, 20 colours
const PALETTE_MC8V7 = [ 
'#d99a94', '#da9d80', '#d4a46e', '#cbab5d', '#bfb351', '#b5b94e', '#a6bf5a', '#92c477', '#83c596', '#7ec4a5', 
'#79c3b6', '#77c0c8', '#7dbbd8', '#89b4e1', '#9aade4', '#aea4e2', '#bc9fd8', '#ca9ac8', '#cf98bf', '#d798a4'
];

export const PALETTE = PALETTE_MC8V7;
export const PALETTE_ANNEX = 20;
export const PALETTE_B = [ '#a0a0a0', '#555555', '#333333', '#000000' ];


export class View {
	/** @param {number} gameWidth
	 *  @param {number} gameHeight */
	constructor(gameWidth, gameHeight) {
		this.gameWidth = gameWidth;
		this.gameHeight = gameHeight;
		this.container = document.getElementById('container');
		//this.scoreboard = document.getElementById('scoreboard');
		this.drawMethod = 1;
		this.alwaysRenderAll = 0;
		this.canvasCache = new Map();
		this.hexTileMask = null;
		
		this.tileH = 64;
		this.tileVO = 48;
		this.tileW = 56;

		this.setUp(gameWidth, gameHeight); // this function will start the image loading process
	}
	/** @param {number} gameWidth
	 *  @param {number} gameHeight */
	setUp(gameWidth, gameHeight) {	// gameWidth and gameHeight are in grid units			
		// some things cannot be done until the gameManager object is fully initialised
		if(!gameManager) {
			setTimeout(() => { this.setUp(gameWidth, gameHeight); }, 10);
			return;
		}
		console.log('setting up...')
		this.renderButtons();

		this.gameWidth = gameWidth;
		this.gameHeight = gameHeight;

		let { width, height } = this.container.getBoundingClientRect();
		height = document.documentElement.clientHeight - 15; // override the above height estimate: 10px padding 2px border 3px unknown

		// remove the old canvas, if it exists
		const [child] = this.container.children;
		if(child) {
			this.container.removeChild(child);
		}
		
		// calculate width and height of canvas
		let canvasWidth = gameWidth * this.tileW + Math.floor(this.tileW/2);
		let canvasHeight = (gameHeight + 1) * this.tileVO - (this.tileH/2);
		
		// create a new canvas
		const canvas = document.createElement('canvas');
		this.container.appendChild(canvas);
		this.context = canvas.getContext('2d', {alpha:false});
		canvas.setAttribute('width',''+canvasWidth);
		canvas.setAttribute('height',''+canvasHeight);
		
		// render (update stats display) with current stats
		this.renderStats();
	}
	renderButtons() {
		// update state of showFPS button
		setAriaPressed(document.getElementById('show_fps'), gameManager.showFPS);
		setHideClass(document.getElementById('menu_fps'), gameManager.showFPS);
		
		// update state of showTimer button
		setAriaPressed(document.getElementById('show_timer'), gameManager.showTimer);
		setHideClass(document.getElementById('menu_time'), gameManager.showTimer);
	}	
	/** @param {HTMLCanvasElement} srcCanvas
	 *  @param {CanvasRenderingContext2D} ctx
	 *  @param {number} dx
	 *  @param {number} dy */
	renderFromCanvas(srcCanvas, ctx, dx, dy) {
		if(dy%2==1) dx += 0.5;
		if(ctx) {
			ctx.drawImage(srcCanvas, 0, 0, this.tileW, this.tileH,
				Math.floor(this.tileW * dx),
				this.tileVO * dy,
				this.tileW,this.tileH);
		}
	}
	/** @returns {HTMLCanvasElement} */
	getHexCanvas(colorIdx = PALETTE_ANNEX+2) {
		const key = colorIdx+65536;	// allowing 16 bits for line tile cache
		if(this.canvasCache.has(key)) {
			return this.canvasCache.get(key);
		}
		
		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');		
		let width = this.tileW;
		let height = this.tileH;
		canvas.setAttribute('width',width.toString());
		canvas.setAttribute('height',height.toString());
		//ctx.clearRect(0,0,width,height);
		if(colorIdx >= PALETTE_ANNEX) ctx.fillStyle = PALETTE_B[colorIdx - PALETTE_ANNEX];
		else ctx.fillStyle = PALETTE[colorIdx];
		ctx.strokeStyle = PALETTE_B[3];
		ctx.lineWidth = 1;
		ctx.translate(0.5,0.5);		// middle of the pixel, avoids antialiasing
		ctx.beginPath();
		let hh = height - 1;
		let ww = width - 1;
		ctx.moveTo(ww/2, 0);
		ctx.lineTo(ww, hh/4);
		ctx.lineTo(ww, hh*3/4);
		ctx.lineTo(ww/2, hh);
		ctx.lineTo(0, hh*3/4);
		ctx.lineTo(0, hh/4);
		ctx.lineTo(ww/2, 0);
 		ctx.fill();
 		ctx.stroke();
		ctx.translate(0,0);
		//this.applyHexTileMask(ctx);
		// cache the result
		this.canvasCache.set(key,canvas);
		return canvas;
	}
	/** @param {CanvasRenderingContext2D} ctx */
	applyHexTileMask(ctx) {			// apply non-anti-aliased mask
		if(this.hexTileMask == null) this.generateHexTileMask();
		let data = ctx.getImageData(0, 0, this.tileW, this.tileH);
		for(let i=0; i<this.tileW*this.tileH; i++) {
			const offset = i*4+3;
			data.data[offset] = this.hexTileMask[i];
		}
		ctx.putImageData(data,0,0);		
	}
	/** @param {CanvasRenderingContext2D} ctx */
	applyHexTileBorderMask(ctx) {	// apply mask only to force transparent border corners
		if(this.hexTileMask == null) this.generateHexTileMask();
		let data = ctx.getImageData(0, 0, this.tileW, this.tileH);
		for(let i=0; i<this.tileW*this.tileH; i++) {
			const offset = i*4+3;
			if(this.hexTileMask[i]===0) data.data[offset] = 0;
		}
		ctx.putImageData(data,0,0);				
	}
	generateHexTileMask() {	// apply mask to avoid anti-aliasing artifacts
		let mask = Array();
		for(let i=0;i<this.tileW*this.tileH;i++) {
			mask.push(0);
		}
		let x1 = 25;
		// top and bottom triangles
		for(let y=1;y<=15;y++) {
			if(y%4 == 0) x1 += 1;
			for(let x=x1; x<this.tileW-x1; x++) {
				mask[y*this.tileW+x] = 255;
/*				if(x+1<this.tileW-x1-1) {	// bottom triangle is slightly narrower, honestly not sure
											// we're going to get this looking good unless we split base
											// and line layers
					mask[(this.tileH-1-y)*this.tileW+x+1] = 255;
				}*/
				mask[(this.tileH-1-y)*this.tileW+x] = 255;
			}
			x1 -= 2;
		}
		// rect
		for(let y=16; y<this.tileH-16; y++) {
			for(let x=0; x<this.tileW; x++) {
				mask[y*this.tileW+x] = 255;
			}
		}
		this.hexTileMask = mask;
	}
	/** @param {number[]} conns
	 *  @param {number} colorIdx
	 *  @returns {HTMLCanvasElement} */
	getLineCanvas(conns, colorIdx) {
		// Use 2d context line drawing functions.
		// check if it is in cache
		// create key
		let key = 0;
		for(let i=0;i<6;i++) {
			if(conns[i]) key |= 1 << i;
		}
		key |= colorIdx << 6;
		if(this.canvasCache.has(key)) {
			return this.canvasCache.get(key);
		}

		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		let width = this.tileW;
		let height = this.tileH;
		canvas.setAttribute('width',width.toString());
		canvas.setAttribute('height',height.toString());
		ctx.lineCap = 'butt';
		ctx.lineJoin = 'bevel';
		ctx.clearRect(0,0,width,height);
		if (colorIdx >= PALETTE_ANNEX) {
			ctx.fillStyle = PALETTE_B[colorIdx - PALETTE_ANNEX];
			ctx.strokeStyle = PALETTE_B[colorIdx - PALETTE_ANNEX];
		} else {
			ctx.fillStyle = PALETTE[colorIdx];
			ctx.strokeStyle = PALETTE[colorIdx];
		}
		ctx.lineWidth = height / 8;
		// For each angle:
		let count = 0;
		let hh = height;
		let ww = width;
		for(let i=0; i<conns.length; i++) {
			if(!conns[i]) continue;
			count++;
			ctx.beginPath();
			ctx.moveTo(ww/2,hh/2);
			let dx = ww/2;
			let dy = hh/2;
			let ddy = 0; //let ddy = 0.2;	//4:7 ratio. this doesn't work great because our mask isn't great
			let ddx = ddy*4/7;
			if(i==0) dx = ww;
			else if(i==1) { dy = hh * 7 / 8 + ddy; dx = ww * 3 / 4 + ddx; }
			else if(i==2) { dy = hh * 7 / 8 + ddy; dx = ww * 1 / 4 - ddx; }
			else if(i==3) dx = 0;
			else if(i==4) { dy = hh * 1 / 8 - ddy; dx = ww * 1 / 4 - ddx; }
			else if(i==5) { dy = hh * 1 / 8 - ddy; dx = ww * 3 / 4 + ddx; }
			ctx.lineTo(dx,dy);
			ctx.stroke();
		}
		// If it's a single, draw a larger hub circle
		let r = height/16;
		if(count==1) r = height/8;
		ctx.beginPath();
		ctx.moveTo(ww/2,hh/2);
		ctx.arc(ww/2,hh/2,r,0,2*Math.PI,true);
		ctx.fill(); // automatically closes the path
		//this.applyHexTileBorderMask(ctx);
		// cache the result
		this.canvasCache.set(key,canvas);

		return canvas;
	}
	renderStats() {
		if(gameManager && gameManager.stats) {
			const stats = gameManager.stats;
			document.getElementById('stats_size').innerHTML = stats.puztype;
			document.getElementById('stats_num').innerHTML = stats.num;
			document.getElementById('stats_best').innerHTML = stats.best;
			document.getElementById('stats_best3').innerHTML = stats.best3;
			document.getElementById('stats_best5').innerHTML = stats.best5;
			document.getElementById('stats_best10').innerHTML = stats.best10;
		}
	}
	render() {
		let gm = gameManager;
		if(!gm) {
			console.log('view::render() called with no gamemanager initialised');
			return;
		}
		if(!this.context) {
			//console.log('view::render() called with no context initialised');
			return;
		}
		let game = gameManager.game;
		let ts = gameManager.game.ts;
		
		if(this.alwaysRenderAll || gm.game.winningAnimation.started) {
			gm.paintAll(); // will update gm.renderSet appropriately
		}
				
		for (const idx of gm.renderSet) {
			const [x,y] = gm.game.xyFromIdx(idx);
			if(this.drawMethod == 0) {
			} else if(this.drawMethod == 1) {
				let hexCanvas = null;
				if(gm.game.winningAnimation.started && this.gameWidth == 5 && this.gameHeight == 5) {
					let patternIdx = gm.puzzleIdx % PATTERNS5.length;
					let palIdx = Math.floor((ts - gm.game.winningAnimation.start_ts)/100) + PATTERNS5[patternIdx][y*this.gameWidth+x];
					palIdx = Math.floor(palIdx)%(PALETTE.length);
					hexCanvas = this.getHexCanvas(palIdx);					
				} else if(gm.game.winningAnimation.started) {
					let palIdx = Math.floor((ts - gm.game.winningAnimation.start_ts)/100) + y;
					palIdx = Math.floor(palIdx)%(PALETTE.length);
					hexCanvas = this.getHexCanvas(palIdx);					
				} else if(game.grid[y][x].looped) {
					hexCanvas = this.getHexCanvas(PALETTE_ANNEX+1);
				} else {
					hexCanvas = this.getHexCanvas(PALETTE_ANNEX+2);
				}
				
				this.renderFromCanvas(hexCanvas, this.context, x, y);
				let colorIdx = gm.game.grid[y][x].color;
				let srcCanvas = this.getLineCanvas(game.grid[y][x].conns,colorIdx);
				this.renderFromCanvas(srcCanvas, this.context, x, y);
			} else {
				// unimplemented draw method
			}
		};
		
		// clear the render set, now we've rendered all the tiles
		gm.renderSet.clear();
		
		// update fps
		if(gameManager.showFPS) {
			let fps = Math.floor(1000.0 / (ts - game.tsPrior));
			document.getElementById("fps_text").innerHTML = '' + fps;
		}
		
		// update cached timestamp
		game.tsPrior = ts;

		// update puzzle title
		document.getElementById("puzzle_title").innerHTML = game.title;
		
		// update timer
		document.getElementById("timer_text").innerHTML = game.timer.timestring();

		// update win screen
		if(game.won) {
			document.getElementById('wintime').innerHTML = game.wintime;
			document.getElementById('winner').classList.remove('hide');
			this.renderStats();	// update statistics
		} else {
			document.getElementById("winner").classList.add("hide");
		}
		
		// update paused button
		const paused = !gameManager.game.timer.running;
		document.getElementById('pause').setAttribute('aria-pressed', paused.toString());
	}
}
