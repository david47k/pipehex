/* unused.ts
 * Unused methods / data that may come in handy in future.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

/* from view.js */

const TILE_SIZES = [ [ 56, 64, 48 ], [ 42, 48, 36 ], [ 28, 32, 24 ] ];

// Original palette, 12 colours, purple is a bit dark
const PALETTE_ORIGINAL = [ '#f51a3c','#a92393','#623297','#0060b3','#0078c5','#02b2b5',
	'#24bb4e','#add73c','#ffdd00','#ffc110','#fc9b1e','#f97625',];

// Modified original palette that brightens up the dark colours and seperates the blues
const PALETTE_SHARP = [ '#f51a3c','#a92393','#743bb2','#0067c2','#00a7c5','#02b597',
	'#24bb4e','#add73c','#ffdd00','#ffc110','#fc9b1e','#f97625',];

const drawMethods = ['img','canvas_ctx2d','manual_mask'];

// From View() constructor for loading images

/*		this.srcImage = new Image();   // Create new img element
		this.srcImage.loading = "eager";
		this.srcImage.addEventListener('load', function() {
			console.log("image loaded"); 
			gameManager.view.setUp(gameManager.game.width, gameManager.game.puzzle_h);
		}); */
		
		// the resize event will need fixing so it redraws everything
		// i.e. gm.paintAll();
		/* window.addEventListener('resize', () => {
			this.setUp(gameManager.game.width, gameManager.game.puzzle_h);
		}); */

// From View::setup()
		//this.unitOnScreen = Math.floor(Math.min( width / gameWidth,	height / gameHeight ));
		//this.unitOnScreen = ( Math.floor(this.unitOnScreen / 4) * 4 );	// canvas drawImage is crappy, reduce aliasing artifacts
		//if(this.unitOnScreen > 256) this.unitOnScreen = 256; // reducing aliasing artifacts - can also split src into individual sprites
		//console.log("screen unit:", this.tileW, " ", this.tileH, " ", this.tileVO);

		// Because ImageBitmap options & imageSmoothingQuality aren't yet widely supported, and OffscreenCanvas isn't widely supported,
		// we are using pre-sized images. we can scale down and it looks OK, but we can't scale up.
		// blocksizes 64, 128, 192, 256
		// we return because this method will get called again once the image is loaded
/*		if(this.srcBlockH != 64) {
			this.srcBlockH = 64;
			this.srcBlockW = 56;
			this.srcImage.src = 'tiles_56x64.png';
			console.log('loading src image');
			return; 
		} */

	/** @param {number} dx
	 *  @param {number} dy
	 *  @param {number} sx
	 *  @param {number} sy */
/*	renderImg(dx, dy, sx, sy) {
		sx = sx * this.srcBlockW;
		sy = sy * this.srcBlockH;
		if(dy%2==1) dx += 0.5;
		
		if(this.srcImage.complete && this.context) { 
			this.context.drawImage(this.srcImage,
				sx,sy,
				this.srcBlockW,this.srcBlockH,
				Math.floor(this.tileW * dx),
				this.tileVO * dy,
				this.tileW,this.tileH);
		} 
	} */
