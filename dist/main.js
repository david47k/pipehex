(()=>{"use strict";function t(e,i){return Array.isArray(e)&&Array.isArray(i)?e.length===i.length&&e.every(((e,s)=>t(e,i[s]))):e===i}function e(t,e){t instanceof HTMLButtonElement&&t.setAttribute("aria-pressed",e.toString())}function i(t,e){e?t.classList.remove("hide"):t.classList.add("hide")}function s(){return Math.trunc(2*Math.random())}const n=[[0,0,0,0,0,0],[1,0,0,0,0,0],[1,1,0,0,0,0],[1,0,1,0,0,0],[1,0,0,1,0,0],[1,1,1,0,0,0],[1,0,1,1,0,0],[1,0,0,1,1,0],[1,0,1,0,1,0],[1,1,1,1,0,0],[1,0,1,1,1,0],[1,1,0,1,1,0],[1,1,1,1,1,0],[1,1,1,1,1,1]];function h(e,i){for(var s=i,n=0;n<6;n++){if(t(s,e))return{m:!0,a:n};s=[s[5],s[0],s[1],s[2],s[3],s[4]]}return{m:!1,a:0}}function r(t){let e=0,i=0,s=0;for(let n=0;n<6;n++)1==t[n]&&(e++,s||(i=n,s=1));let r=0;if(1==e)r=1;else if(e>=2&&e<=5)for(let e=2;e<=12;e++){const s=h(t,n[e]);if(1==s.m){r=e,i=s.a;break}}else 6==e&&(r=13);return{s:r,a:i}}class a{constructor({conns:t=[s(),s(),s(),s(),s(),s()],color:e=f,isolated:i=!0,locked:n=!1,looped:h=!1}={}){this.conns=t;let a=r(this.conns);this.shape=a.s,this.angle=a.a,this.color=e,this.isolated=i,this.locked=n,this.looped=h}rotate(t=!1){t?(this.conns=[this.conns[1],this.conns[2],this.conns[3],this.conns[4],this.conns[5],this.conns[0]],this.angle--,-1==this.angle&&(4==this.shape?this.angle=2:8==this.shape?this.angle=1:11==this.shape?this.angle=2:13==this.shape?this.angle=0:this.angle=5)):(this.conns=[this.conns[5],this.conns[0],this.conns[1],this.conns[2],this.conns[3],this.conns[4]],this.angle++,6==this.angle&&(this.angle=0),(4==this.shape&&3==this.angle||8==this.shape&&2==this.angle||11==this.shape&&3==this.angle||13==this.shape)&&(this.angle=0))}setup(t){this.conns=t;const e=r(this.conns);this.shape=e.s,this.angle=e.a}equal(t){this.conns.every(((e,i)=>e==t.conns[i]))}}function l(t){let e=Math.trunc(t/1e3);const i=Math.trunc(e/60);e-=60*i;let s=e.toString();return s.length<2&&(s="0"+s),i.toString()+":"+s}class o{constructor({time:t=0}={}){this.time=t,this.timestamp=0,this.running=!1}start(t){this.running?this.update(t):(this.timestamp=t,this.running=!0)}stop(t){this.running&&(this.update(t),this.running=!1)}reset(){this.running=!1,this.time=0}update(t){if(this.running){const e=t-this.timestamp;e>=0?this.time+=e:console.log("time has gone backwards"),this.timestamp=t}}getMillis(){return this.time}timestring(){return l(this.time)}}class d{constructor(t={}){this.width=0,this.height=0,this.grid=null,this.solvedGrid=null,this.won=!1,this.title="(puzzle title)",this.timer=new o,this.wintime="";for(const[e,i]of Object.entries(t))t.hasOwnProperty(e)&&Object.defineProperty(this,e,{value:Object.getOwnPropertyDescriptor(t,e).value,writable:!0});this.grid=this.newGrid(this.grid),this.timer=new o(this.timer),this.tileW=56,this.tileH=64,this.tileVO=3*this.tileH/4,this.tsPrior=0,this.ts=0,this.winningAnimation={started:!1,start_ts:0}}tileFromIdx(t){let e=~~(t/this.width),i=t%this.width;return this.grid[e][i]}xyFromIdx(t){let e=~~(t/this.width);return[t%this.width,e]}idxFromXy(t,e){return e*this.width+t}newGrid(t=null){let e=[];for(let i=0;i<this.height;i++){let s=[];for(let e=0;e<this.width;e++)null==t?s.push(new a):s.push(new a(t[i][e]));e.push(s)}return e}newGridFromPuzstr(t){let e=this.newGrid(),i=t.split("");for(let t=0;t<this.height;t++)for(let s=0;s<this.width;s++){let n=[0,0,0,0,0,0],h=i[t*this.width+s],r="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-".indexOf(h);1==(1&r)&&(n[0]=1),2==(2&r)&&(n[1]=1),4==(4&r)&&(n[2]=1),8==(8&r)&&(n[3]=1),16==(16&r)&&(n[4]=1),32==(32&r)&&(n[5]=1),e[t][s].setup(n)}return e}haveWinCondition(){if(!Array.isArray(this.solvedGrid))return!1;for(let e=0;e<this.height;e++)for(let i=0;i<this.width;i++)if(!t(this.grid[e][i].conns,this.solvedGrid[e][i].conns))return!1;return this.won=!0,!0}pause(t){return this.timer.running?(this.timer.stop(t),!0):(this.timer.start(t),!1)}loadLevelString(t){let[e,i,s,n,h]=t.split(",");this.title=e,this.width=parseInt(i),this.height=parseInt(s),this.grid=this.newGridFromPuzstr(n),this.solvedGrid=this.newGridFromPuzstr(h)}xyFromPixelCoords(t,e){let i=Math.floor(e/this.tileVO),s=e%this.tileVO/this.tileVO,n=0;i%2==1&&(n=this.tileW/2);let h=Math.floor((t-n)/this.tileW),r=(t-n)%this.tileW/this.tileW;if(s<1/3){let t=3*s;r<.5?2*r<1-t&&(i%2==0&&(h-=1),i-=1):2*(r-.5)>t&&(i%2==0&&(h-=1),i-=1,h+=1)}return[h,i]}inBounds(t,e){return t>=0&&t<this.width&&e>=0&&e<this.height}invertAngle(t){return t>2?t-3:t+3}xyAtAngle(t,e,i){let s=t,n=e;return 0==i?s++:1==i?(e%2==0||s++,n++):2==i?e%2==0?(s--,n++):n++:3==i?s--:4==i?e%2==0?(s--,n--):n--:5==i&&(e%2==0||s++,n--),s<0||s>this.width-1||n<0||n>this.height-1?null:[s,n]}isIsolated(t,e){for(let i=0;i<6;i++){if(!this.grid[e][t].conns[i])continue;let s=this.xyAtAngle(t,e,i);if(null==s)continue;let[n,h]=s;if(this.grid[h][n].conns[this.invertAngle(i)])return!1}return!0}getSurroundingTiles(t,e){let i=[];for(let s=0;s<6;s++){let n=this.xyAtAngle(t,e,s);if(null==n)continue;let[h,r]=n,a=this.idxFromXy(h,r);i.push(a)}return i}getConnectedTiles(t,e,i){class s{constructor(t,e,i,s){this.x=t,this.y=e,this.fromangle=i,this.angle=s}}let n=[new s(t,e,null,0)],h=new Set;h.add(e*this.width+t);let r=new Set;for(;n.length>0;){let t=n.pop(),e=t.x,a=t.y,l=t.fromangle,o=t.angle;if(o>5)continue;if(n.push(new s(e,a,l,o+1)),null!=l&&l==o)continue;if(!this.grid[a][e].conns[o])continue;let d=this.xyAtAngle(e,a,o);if(null==d)continue;let[g,m]=d;if(this.grid[m][g].conns[this.invertAngle(o)])if(h.has(m*this.width+g)){let t=0;for(t=0;t<n.length&&(n[t].x!=g||n[t].y!=m);t++);if(t==n.length);else for(let e=t;e<n.length;e++)r.add(n[e].y*this.width+n[e].x)}else h.add(m*this.width+g),i&&n.push(new s(g,m,this.invertAngle(o),0))}return[h,r]}}function g(t,e){return e instanceof Map?{dataType:"Map",val:Array.from(e.entries())}:e}function m(t,e){return"object"==typeof e&&null!==e&&"Map"===e.dataType?new Map(e.val):e}const u={save:function(t,e){localStorage.setItem("phex_"+t,e)},saveInt:function(t,e){this.save(t,e)},saveStr:function(t,e){this.save(t,e)},saveMap:function(t,e){localStorage.setItem("phex_"+t,JSON.stringify(e,g))},loadMap:function(t,e){var i=localStorage.getItem("phex_"+t);return null==i?e:JSON.parse(i,m)},loadInt:function(t,e){var i=parseInt(localStorage.getItem("phex_"+t));return isNaN(i)?e:i},loadStr:function(t,e){let i=localStorage.getItem("phex_"+t);return null==i?e:i},saveObj:function(t,e){localStorage.setItem("phex_"+t,JSON.stringify(e))},loadObj:function(t,e){var i=localStorage.getItem("phex_"+t);return null==i?e:JSON.parse(i)}},c=[[0,1,0,1,0,2,3,2,3,2,4,5,4,5,4,6,7,6,7,6,8,9,8,9,8],[0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4],[3,2,2,2,3,2,1,1,2,3,2,1,0,1,2,2,1,1,2,3,3,2,2,2,3],[0,1,1,1,0,1,2,2,1,0,1,2,3,2,1,1,2,2,1,0,0,1,1,1,0],[0,1,2,3,4,1,2,3,4,5,1,2,3,4,5,2,3,4,5,6,2,3,4,5,6],[0,9,9,9,0,9,0,0,9,0,9,0,0,0,9,9,0,0,9,0,0,9,9,9,0],[0,1,2,3,4,19,18,17,16,15,1,2,3,4,5,0,19,18,17,16,2,3,4,5,6],[0,1,2,3,4,15,16,17,18,5,14,3,4,19,6,13,2,1,0,7,12,11,10,9,8],[0,8,0,8,0,0,0,0,0,0,8,0,0,0,8,8,0,0,8,0,0,8,8,8,0],[17,17,1,17,17,17,2,2,17,17,17,3,3,3,17,4,4,4,4,17,5,5,5,5,5]],p=["#d99a94","#da9d80","#d4a46e","#cbab5d","#bfb351","#b5b94e","#a6bf5a","#92c477","#83c596","#7ec4a5","#79c3b6","#77c0c8","#7dbbd8","#89b4e1","#9aade4","#aea4e2","#bc9fd8","#ca9ac8","#cf98bf","#d798a4"],f=20,w=["#a0a0a0","#555555","#333333","#000000"];class v{constructor(t,e){this.gameWidth=t,this.gameHeight=e,this.container=document.getElementById("container"),this.drawMethod=1,this.alwaysRenderAll=0,this.canvasCache=new Map,this.hexTileMask=null,this.tileH=64,this.tileVO=48,this.tileW=56,this.setUp(t,e)}setUp(t,e){if(!y)return void setTimeout((()=>{this.setUp(t,e)}),10);console.log("setting up..."),this.renderButtons(),this.gameWidth=t,this.gameHeight=e;let{width:i,height:s}=this.container.getBoundingClientRect();s=document.documentElement.clientHeight-15;const[n]=this.container.children;n&&this.container.removeChild(n);let h=t*this.tileW+Math.floor(this.tileW/2),r=(e+1)*this.tileVO-this.tileH/2;const a=document.createElement("canvas");this.container.appendChild(a),this.context=a.getContext("2d",{alpha:!1}),a.setAttribute("width",""+h),a.setAttribute("height",""+r),this.renderStats()}renderButtons(){e(document.getElementById("show_fps"),y.showFPS),i(document.getElementById("menu_fps"),y.showFPS),e(document.getElementById("show_timer"),y.showTimer),i(document.getElementById("menu_time"),y.showTimer)}renderFromCanvas(t,e,i,s){s%2==1&&(i+=.5),e&&e.drawImage(t,0,0,this.tileW,this.tileH,Math.floor(this.tileW*i),this.tileVO*s,this.tileW,this.tileH)}getHexCanvas(t=f+2){const e=t+65536;if(this.canvasCache.has(e))return this.canvasCache.get(e);let i=document.createElement("canvas"),s=i.getContext("2d"),n=this.tileW,h=this.tileH;i.setAttribute("width",n.toString()),i.setAttribute("height",h.toString()),s.fillStyle=t>=f?w[t-f]:p[t],s.strokeStyle=w[3],s.lineWidth=1,s.translate(.5,.5),s.beginPath();let r=h-1,a=n-1;return s.moveTo(a/2,0),s.lineTo(a,r/4),s.lineTo(a,3*r/4),s.lineTo(a/2,r),s.lineTo(0,3*r/4),s.lineTo(0,r/4),s.lineTo(a/2,0),s.fill(),s.stroke(),s.translate(0,0),this.canvasCache.set(e,i),i}applyHexTileMask(t){null==this.hexTileMask&&this.generateHexTileMask();let e=t.getImageData(0,0,this.tileW,this.tileH);for(let t=0;t<this.tileW*this.tileH;t++){const i=4*t+3;e.data[i]=this.hexTileMask[t]}t.putImageData(e,0,0)}applyHexTileBorderMask(t){null==this.hexTileMask&&this.generateHexTileMask();let e=t.getImageData(0,0,this.tileW,this.tileH);for(let t=0;t<this.tileW*this.tileH;t++){const i=4*t+3;0===this.hexTileMask[t]&&(e.data[i]=0)}t.putImageData(e,0,0)}generateHexTileMask(){let t=Array();for(let e=0;e<this.tileW*this.tileH;e++)t.push(0);let e=25;for(let i=1;i<=15;i++){i%4==0&&(e+=1);for(let s=e;s<this.tileW-e;s++)t[i*this.tileW+s]=255,t[(this.tileH-1-i)*this.tileW+s]=255;e-=2}for(let e=16;e<this.tileH-16;e++)for(let i=0;i<this.tileW;i++)t[e*this.tileW+i]=255;this.hexTileMask=t}getLineCanvas(t,e){let i=0;for(let e=0;e<6;e++)t[e]&&(i|=1<<e);if(i|=e<<6,this.canvasCache.has(i))return this.canvasCache.get(i);let s=document.createElement("canvas"),n=s.getContext("2d"),h=this.tileW,r=this.tileH;s.setAttribute("width",h.toString()),s.setAttribute("height",r.toString()),n.lineCap="butt",n.lineJoin="bevel",n.clearRect(0,0,h,r),e>=f?(n.fillStyle=w[e-f],n.strokeStyle=w[e-f]):(n.fillStyle=p[e],n.strokeStyle=p[e]),n.lineWidth=r/8;let a=0,l=r,o=h;for(let e=0;e<t.length;e++){if(!t[e])continue;a++,n.beginPath(),n.moveTo(o/2,l/2);let i=o/2,s=l/2,h=0,r=4*h/7;0==e?i=o:1==e?(s=7*l/8+h,i=3*o/4+r):2==e?(s=7*l/8+h,i=1*o/4-r):3==e?i=0:4==e?(s=1*l/8-h,i=1*o/4-r):5==e&&(s=1*l/8-h,i=3*o/4+r),n.lineTo(i,s),n.stroke()}let d=r/16;return 1==a&&(d=r/8),n.beginPath(),n.moveTo(o/2,l/2),n.arc(o/2,l/2,d,0,2*Math.PI,!0),n.fill(),this.canvasCache.set(i,s),s}renderStats(){if(y&&y.stats){const t=y.stats;document.getElementById("stats_size").innerHTML=t.puztype,document.getElementById("stats_num").innerHTML=t.num,document.getElementById("stats_best").innerHTML=t.best,document.getElementById("stats_best3").innerHTML=t.best3,document.getElementById("stats_best5").innerHTML=t.best5,document.getElementById("stats_best10").innerHTML=t.best10}}render(){let t=y;if(!t)return void console.log("view::render() called with no gamemanager initialised");if(!this.context)return;let e=y.game,i=y.game.ts;(this.alwaysRenderAll||t.game.winningAnimation.started)&&t.paintAll();for(const s of t.renderSet){const[n,h]=t.game.xyFromIdx(s);if(0==this.drawMethod);else if(1==this.drawMethod){let s=null;if(t.game.winningAnimation.started&&5==this.gameWidth&&5==this.gameHeight){let e=t.puzzleIdx%c.length,r=Math.floor((i-t.game.winningAnimation.start_ts)/100)+c[e][h*this.gameWidth+n];r=Math.floor(r)%p.length,s=this.getHexCanvas(r)}else if(t.game.winningAnimation.started){let e=Math.floor((i-t.game.winningAnimation.start_ts)/100)+h;e=Math.floor(e)%p.length,s=this.getHexCanvas(e)}else s=e.grid[h][n].looped?this.getHexCanvas(f+1):this.getHexCanvas(f+2);this.renderFromCanvas(s,this.context,n,h);let r=t.game.grid[h][n].color,a=this.getLineCanvas(e.grid[h][n].conns,r);this.renderFromCanvas(a,this.context,n,h)}}if(t.renderSet.clear(),y.showFPS){let t=Math.floor(1e3/(i-e.tsPrior));document.getElementById("fps_text").innerHTML=""+t}e.tsPrior=i,document.getElementById("puzzle_title").innerHTML=e.title,document.getElementById("timer_text").innerHTML=e.timer.timestring(),e.won?(document.getElementById("wintime").innerHTML=e.wintime,document.getElementById("winner").classList.remove("hide"),this.renderStats()):document.getElementById("winner").classList.add("hide");const s=!y.game.timer.running;document.getElementById("pause").setAttribute("aria-pressed",s.toString())}}function z(t,e){const i=new XMLHttpRequest;i.open("GET",t,!0),i.responseType="text",i.onload=function(s){const n=i.response;console.log("puzzle file loaded: ",t);let h=[],r=n.split("\n");for(let t of r)t.length>8&&h.push(t);e(h)},i.send(null)}var y=new class{constructor(){this.PUZZLES=new Map,this.puzzleType=u.loadStr("puzzleType","5"),this.puzzleIdx=u.loadInt("puzzleIdx"+this.puzzleType,0),this.showStats=!1,this.showFPS=!1,this.showTimer=!0,this.showSettings=!1,this.renderSet=new Set,z("/puzzles5.csv",(t=>this.PUZZLES.set("5",t))),z("/puzzles10.csv",(t=>this.PUZZLES.set("10",t))),z("/puzzles15.csv",(t=>this.PUZZLES.set("15",t))),z("/puzzles20.csv",(t=>this.PUZZLES.set("20",t))),z("/puzzles30.csv",(t=>this.PUZZLES.set("30",t))),z("/puzzles40.csv",(t=>this.PUZZLES.set("40",t))),this.game=this.loadGame(parseInt(this.puzzleType)),this.updateStats(),this.view=new v(this.game.width,this.game.height),this.restart({restartSolved:!1,restartGame:!1}),this.view.container.addEventListener("contextmenu",(function(t){return t.preventDefault(),!1})),this.view.container.addEventListener("click",(function(t){return t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),!1})),this.view.container.addEventListener("mouseup",(function(t){return t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),!1})),this.view.container.addEventListener("mousedown",(function(t){t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation();var e=y,[i,s]=e.game.xyFromPixelCoords(t.offsetX,t.offsetY);return e.game.inBounds(i,s)&&e.click(i,s,t.buttons),!1}))}prevPuzzle(){this.puzzleIdx<=0?console.log("No previous puzzles!"):(this.puzzleIdx--,u.saveInt("puzzleIdx"+this.puzzleType,this.puzzleIdx),this.restart())}nextPuzzle(){this.puzzleIdx+1>=this.PUZZLES.get(this.puzzleType).length?console.log("Ran out of puzzles!"):(this.puzzleIdx++,u.saveInt("puzzleIdx"+this.puzzleType,this.puzzleIdx),this.restart())}restart({restartSolved:t=!1,restartGame:e=!0}={}){if(this.PUZZLES.has(this.puzzleType)){if(e||0==this.game.width){const t=parseInt(this.puzzleType);this.game=new d({width:t,height:t}),this.game.loadLevelString(this.PUZZLES.get(this.puzzleType)[this.puzzleIdx])}if(!t){let t=u.loadMap("highscore"+this.puzzleType,new Map),e=parseInt(t.get(this.puzzleIdx));Number.isInteger(e)&&(this.game.grid=this.game.solvedGrid,this.game.timer=new o({time:e}),this.game.haveWinCondition()&&this.onWin())}this.view&&(this.view.setUp(this.game.width,this.game.height),this.paintAll()),this.saveGame()}else setTimeout((()=>y.restart({restartSolved:t,restartGame:e})),100)}setSize(t){this.puzzleType=t.toString(),u.saveStr("puzzleType",this.puzzleType),this.puzzleIdx=u.loadInt("puzzleIdx"+this.puzzleType,0),this.updateStats(),this.restart()}updateLoopSet(t=-1,e=[-1]){let i=new Set,s=new Set,n=[];if(-1==t)for(let t=0;t<this.game.height*this.game.width;t++)n.push(t);else{n.push(t);for(let t=0;t<e.length;t++)n.push(e[t]);for(let t=0;t<this.game.height;t++)for(let e=0;e<this.game.width;e++)this.game.grid[t][e].looped&&i.add(this.game.idxFromXy(e,t))}for(;n.length>0;){let t=n.pop();if(-1==t)continue;let[e,i]=this.game.xyFromIdx(t),[h,r]=this.game.getConnectedTiles(e,i,!0);for(const t of h){let e=n.findIndex((e=>e===t));-1!=e&&(n[e]=-1)}for(const t of r){s.add(t);let[e,i]=this.game.xyFromIdx(t);this.game.grid[i][e].looped=!0}}for(const t of i)if(!s.has(t)){let[e,i]=this.game.xyFromIdx(t);this.game.grid[i][e].looped=!1,this.renderSet.add(t)}for(const t of s)i.has(t)||this.renderSet.add(t)}render(t){this.game.ts=t,this.game.timer.update(t),this.view.render()}paintAll(){this.renderSet=new Set,this.updateLoopSet();for(let t=0;t<this.game.height*this.game.width;t++)this.renderSet.add(t)}saveGame(){u.saveObj("savegame",this.game)}loadGame(t){this.showTimer="true"===u.loadStr("showTimer","true"),this.showFPS="true"===u.loadStr("showFPS","false");let e=u.loadObj("savegame",{width:0,height:0});return new d(e)}speedTest(){this.setSize(30),this.puzzleIdx=0,this.restart({restartSolved:!0}),Date.now();for(let t=0;t<6;t++)for(let t=0;t<30;t++)this.click(t,t,0),this.render(this.game.tsPrior);let t=Date.now();for(let t=0;t<6;t++)for(let t=0;t<30;t++)this.click(t,t,0),this.render(this.game.tsPrior);let e=Date.now(),i=u.loadObj("speedTest",[0,0,0]),s=e-t,n=(i[0]+i[1]+i[2])/3;console.log("Last 3 avg (ms): ",n),console.log("This test  (ms): ",s),console.log("Difference (ms): ",s-n),i.shift(),i.push(s),u.saveObj("speedTest",i)}updateStats(){let t=[...u.loadMap("highscore"+this.puzzleType,new Map).values()];t.sort(((t,e)=>t-e));let e=this.puzzleType+"x"+this.puzzleType,i="tbd",s="tbd",n="tbd",h="tbd";t.length>=1&&(i=l(t[0])),t.length>=3&&(s=l(t.slice(0,3).reduce(((t,e)=>t+e),0)/3)),t.length>=5&&(n=l(t.slice(0,5).reduce(((t,e)=>t+e),0)/5)),t.length>=10&&(h=l(t.slice(0,10).reduce(((t,e)=>t+e),0)/10)),this.stats={puztype:e,num:t.length.toString(),best:i,best3:s,best5:n,best10:h}}onWin(){this.game.timer.stop(this.game.tsPrior),this.game.wintime=this.game.timer.timestring(),document.getElementById("wintime").innerHTML=this.game.wintime;let t=u.loadMap("highscore"+this.puzzleType,new Map);t.set(this.puzzleIdx,Math.trunc(this.game.timer.getMillis())),u.saveMap("highscore"+this.puzzleType,t),this.updateStats(),0==this.game.winningAnimation.started&&(this.game.winningAnimation.started=!0,this.game.winningAnimation.start_ts=this.game.ts)}click(t,e,i){if(!this.game.won){0==i||1==i?this.game.grid[e][t].rotate():2==i&&this.game.grid[e][t].rotate(!0),this.renderSet.add(this.game.idxFromXy(t,e)),this.game.timer.start(this.game.tsPrior);let s=this.game.getSurroundingTiles(t,e);for(;s.length>0;){let t=s.pop(),[e,i]=this.game.xyFromIdx(t);this.game.isIsolated(e,i)?0==this.game.grid[i][e].isolated&&(this.game.grid[i][e].isolated=!0,this.game.grid[i][e].color=f,this.renderSet.add(this.game.idxFromXy(e,i))):1==this.game.grid[i][e].isolated&&(this.renderSet.add(this.game.idxFromXy(e,i)),this.game.grid[i][e].isolated=!1)}this.updateLoopSet(e*this.game.width+t,s);let[n,h]=this.game.getConnectedTiles(t,e,!0),r=this.game.grid[e][t].color;if(n.size<=1)this.game.grid[e][t].isolated=!0,r=f;else{this.game.grid[e][t].isolated=!1;let i=n.values();i.next();let s=i.next().value;r=this.game.tileFromIdx(s).color,r==f&&(r=(e*this.game.width+t)%p.length)}for(let t of n){let e=Math.trunc(t/this.game.width),i=t%this.game.width;this.game.grid[e][i].color!=r&&(this.game.grid[e][i].color=r,this.renderSet.add(t))}this.game.haveWinCondition()&&this.onWin()}this.render(this.game.ts),this.saveGame()}};Object.defineProperty(window,"gameManager",{value:y,writable:!0}),document.getElementById("restart_button").addEventListener("click",(function(){y.restart({restartSolved:!0})})),document.getElementById("prev_puzzle").addEventListener("click",(function(){y.prevPuzzle()}));let S=document.getElementsByClassName("next_puzzle");for(let t=0;t<S.length;t++)S.item(t).addEventListener("click",(function(){y.nextPuzzle()}));document.getElementById("pause").addEventListener("click",(function(t){const i=y.game.pause(y.game.tsPrior);e(t.target,i)})),document.getElementById("show_fps").addEventListener("click",(function(t){y.showFPS=!y.showFPS;const s=y.showFPS;let n=document.getElementById("menu_fps");e(document.getElementById("show_fps"),s),i(n,s),u.saveStr("showFPS",s.toString())})),document.getElementById("show_timer").addEventListener("click",(function(t){y.showTimer=!y.showTimer;const s=y.showTimer;let n=document.getElementById("menu_time");e(document.getElementById("show_timer"),s),i(n,s),u.saveStr("showTimer",s.toString())})),document.getElementById("settings_button").addEventListener("click",(function(t){y.showSettings=!y.showSettings;const s=y.showSettings;let n=document.getElementById("settings_menu");e(t.target,s),i(n,s)})),document.getElementById("stats_button").addEventListener("click",(function(t){y.showStats=!y.showStats;const s=y.showStats;let n=document.getElementById("stats");e(t.target,s),i(n,s)}));let x=document.getElementById("settings_game_size");Array.prototype.forEach.call(x.children,(t=>{t.addEventListener("click",(function(e){const i=Number.parseInt(t.getAttribute("data"));y.setSize(i)}))})),function t(e){window.requestAnimationFrame(t),y.render(e)}(0)})();