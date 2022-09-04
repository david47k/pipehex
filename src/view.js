/* view.js
 * The view of the game, rendered to the HTML document / DOM.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

import { Tile }  from './tile.js';
import { gameManager } from './game-manager.js';
import { Game } from './game.js';
import Storage from './storage.js';


/* Palette based on Munsell colors */

const mpalette_c8v7_names = [
'5R', '10R', '5YR', '10YR', '5Y', '10Y', '5GY', '10GY', '5G', '10G',
'5BG', '10BG', '5B', '10B', '5PB', '10PB', '5P', '10P', '5RP', '10RP'
];

const mpalette_c8v7 = [ 
'#d99a94', '#da9d80', '#d4a46e', '#cbab5d', '#bfb351', '#b5b94e', '#a6bf5a', '#92c477', '#83c596', '#7ec4a5', 
'#79c3b6', '#77c0c8', '#7dbbd8', '#89b4e1', '#9aade4', '#aea4e2', '#bc9fd8', '#ca9ac8', '#cf98bf', '#d798a4'
];
// grey APPROXIMATELY a9a9a9

export const PALETTE_SIZE = 13;
export const PALETTE = ['#bbbbbb', '#f51a3c','#a92393','#623297','#0060b3','#0078c5','#02b2b5',
	'#24bb4e','#add73c','#ffdd00','#ffc110','#fc9b1e','#f97625',];

export const palette_dark = ['#cd1031','#8e107c','#51227e','#025197','#0064a3','#009797',
	'#1a9b43','#8eb330','#e3c100','#d9a10f','#d68115','#d3621a',];

const drawMethods = ['img','canvas_ctx2d','manual_mask'];

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
		
/*		this.srcImage = new Image();   // Create new img element
		this.srcImage.loading = "eager";
		this.srcImage.addEventListener('load', function() {
			console.log("image loaded"); 
			gameManager.view.setUp(gameManager.game.puzzle_w, gameManager.game.puzzle_h);
		}); */
		
		// the resize event will need fixing so it redraws everything
		// i.e. gm.paintAll();
		/* window.addEventListener('resize', () => {
			this.setUp(gameManager.game.puzzle_w, gameManager.game.puzzle_h);
		}); */
		this.unitOnScreenH = 64;
		this.unitOnScreenVO = 48;
		this.unitOnScreenW = 56;

		this.setUp(gameWidth, gameHeight); // this function will start the image loading process
	}
	/** @param {number} gameWidth
	 *  @param {number} gameHeight */
	setUp(gameWidth, gameHeight) {	// gameWidth and gameHeight are in grid units
		console.log('setting up...')

		let { width, height } = this.container.getBoundingClientRect();
		height = document.documentElement.clientHeight - 15; // override the above height estimate: 10px padding 2px border 3px unknown

		//this.unitOnScreen = Math.floor(Math.min( width / gameWidth,	height / gameHeight ));
		//this.unitOnScreen = ( Math.floor(this.unitOnScreen / 4) * 4 );	// canvas drawImage is crappy, reduce aliasing artifacts
		//if(this.unitOnScreen > 256) this.unitOnScreen = 256; // reducing aliasing artifacts - can also split src into individual sprites
		//console.log("screen unit:", this.unitOnScreenW, " ", this.unitOnScreenH, " ", this.unitOnScreenVO);

		// Because ImageBitmap options & imageSmoothingQuality aren't yet widely supported, and OffscreenCanvas isn't widely supported,
		// we are using pre-sized images. we can scale down and it looks OK, but we can't scale up.
		// blocksizes 64, 128, 192, 256
		// we return because this method will get called again once the image is loaded
		if(this.srcBlockH != 64) {
			this.srcBlockH = 64;
			this.srcBlockW = 56;
/*			this.srcImage.src = 'tiles_56x64.png';
			console.log('loading src image');
			return; */
		}

		// remove the old canvas, if it exists
		const [child] = this.container.children;
		if(child) {
			this.container.removeChild(child);
		}
		
		// create a new canvas
		const canvas = document.createElement('canvas');
		this.container.appendChild(canvas);
		this.context = canvas.getContext('2d');
		canvas.setAttribute('width',''+(gameWidth * this.unitOnScreenW + Math.floor(this.unitOnScreenW/2)));
		canvas.setAttribute('height',''+((gameHeight + 1) * this.unitOnScreenVO - (this.unitOnScreenH/2)));
		//console.log('new canvas created');
		
		// render (update stats display) with current stats
		this.renderStats();
	}
	
	/** @param {number} dx
	 *  @param {number} dy
	 *  @param {number} sx
	 *  @param {number} sy */
	renderImg(dx, dy, sx, sy) {
/*		sx = sx * this.srcBlockW;
		sy = sy * this.srcBlockH;
		if(dy%2==1) dx += 0.5;
		
//		if(this.srcImage.complete && this.context) { 
		if(this.context) {
			this.context.drawImage(this.srcImage,
				sx,sy,
				this.srcBlockW,this.srcBlockH,
				Math.floor(this.unitOnScreenW * dx),
				this.unitOnScreenVO * dy,
				this.unitOnScreenW,this.unitOnScreenH);
		} */
	}
	/** @param {HTMLCanvasElement} srcCanvas
	 *  @param {number} dx
	 *  @param {number} dy */
	renderFromCanvas(srcCanvas, dx, dy) {
		if(dy%2==1) dx += 0.5;
		if(this.context) {
			this.context.drawImage(srcCanvas, 0, 0, this.unitOnScreenW, this.unitOnScreenH,
				Math.floor(this.unitOnScreenW * dx),
				this.unitOnScreenVO * dy,
				this.unitOnScreenW,this.unitOnScreenH);
		}
	}
	/** @returns {HTMLCanvasElement} */
	getHexCanvas(colorIdx = PALETTE_SIZE) {
		const key = colorIdx+65536;	// allowing 16 bits for line tile cache
		if(this.canvasCache.has(key)) {
			return this.canvasCache.get(key);
		}
		
		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');		
		let width = this.unitOnScreenW;
		let height = this.unitOnScreenH;
		canvas.setAttribute('width',width.toString());
		canvas.setAttribute('height',height.toString());
		//this.unitOnScreenH = 64;
		//this.unitOnScreenVO = 48;
		//this.unitOnScreenW = 56;
		ctx.clearRect(0,0,width,height);
		if(colorIdx == PALETTE_SIZE) ctx.fillStyle = '#333333';
		else if(colorIdx == PALETTE_SIZE+1) ctx.fillStyle = '#555555';
		else ctx.fillStyle = PALETTE[colorIdx];
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(width/2, 0);
		ctx.lineTo(width, height/4);
		ctx.lineTo(width, height*3/4);
		ctx.lineTo(width/2, height);
		ctx.lineTo(0, height*3/4);
		ctx.lineTo(0, height/4);
		ctx.lineTo(width/2, 0);
		ctx.fill();
		ctx.stroke();

		// cache the result
		this.canvasCache.set(key,canvas);
		return canvas;
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
		let width = this.unitOnScreenW;
		let height = this.unitOnScreenH;
		canvas.setAttribute('width',width.toString());
		canvas.setAttribute('height',height.toString());
		ctx.lineCap = 'butt';
		ctx.lineJoin = 'bevel';					// will this help with Safari-iOS ugly butts?
		//ctx.imageSmoothingQuality = 'high'; 
		ctx.clearRect(0,0,width,height);
		ctx.fillStyle = PALETTE[colorIdx];
		ctx.strokeStyle = PALETTE[colorIdx];
		ctx.lineWidth = height / 8;
		// For each angle:
		let count = 0;
		for(let i=0; i<conns.length; i++) {
			if(!conns[i]) continue;
			count++;
			ctx.beginPath();
			ctx.moveTo(width/2,height/2);
			let dx = width/2;
			let dy = height/2;
			if(i==0) dx = width;
			else if(i==1) { dy = height * 7 / 8; dx = width * 3 / 4; }
			else if(i==2) { dy = height * 7 / 8; dx = width * 1 / 4; }
			else if(i==3) dx = 0;
			else if(i==4) { dy = height * 1 / 8; dx = width * 1 / 4; }
			else if(i==5) { dy = height * 1 / 8; dx = width * 3 / 4; }
			ctx.lineTo(dx,dy);
			ctx.stroke();
		}
		// If it's a single, draw a larger hub circle
		let r = height/16;
		if(count==1) r = height/8;
		ctx.beginPath();
		ctx.moveTo(width/2,height/2);
		ctx.arc(width/2,height/2,r,0,2*Math.PI,true);
		ctx.fill(); // automatically closes the path

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
			const [x,y] = gm.game.xy_from_idx(idx);
			if(this.drawMethod == 0) {	// old draw method for using an image as a source
				this.renderImg(x,y,0,0);		// background hexagon
				this.renderImg(x,y,game.grid[y][x].angle,game.grid[y][x].shape);	// line shape
			} else if(this.drawMethod == 1) {
				let hexCanvas = null;
				if(gm.game.winningAnimation.started) {
					let palidx = Math.floor((ts - gm.game.winningAnimation.start_ts)/100) + x;
					palidx = 1 + Math.floor(palidx)%(PALETTE_SIZE-2);
					hexCanvas = this.getHexCanvas(palidx);
				} else if(gm.loopedSet.has(idx)) {
					hexCanvas = this.getHexCanvas(PALETTE_SIZE+1);
				} else {
					hexCanvas = this.getHexCanvas();
				}
				
				this.renderFromCanvas(hexCanvas, x, y);
				let colorIdx = gm.game.grid[y][x].color;
				let srcCanvas = this.getLineCanvas(game.grid[y][x].conns,colorIdx);
				this.renderFromCanvas(srcCanvas, x, y);
			} else {
				// unimplemented draw method
			}
		};
		
		// clear the render set, now we've rendered all the tiles
		gm.renderSet.clear();
		
		// update fps
		if(gameManager.showFPS) {
			let fps = Math.floor(1000.0 / (ts - game.last_ts));
			document.getElementById("fps_text").innerHTML = '' + fps;
		}
		
		// update cached timestamp
		game.last_ts = ts;

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
