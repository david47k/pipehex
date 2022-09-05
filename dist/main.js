(()=>{"use strict";function t(t,e){return e instanceof Map?{dataType:"Map",val:Array.from(e.entries())}:e}function e(t,e){return"object"==typeof e&&null!==e&&"Map"===e.dataType?new Map(e.val):e}const i={save:function(t,e){localStorage.setItem("phex_"+t,e)},saveInt:function(t,e){this.save(t,e)},saveStr:function(t,e){this.save(t,e)},saveMap:function(e,i){localStorage.setItem("phex_"+e,JSON.stringify(i,t))},loadMap:function(t,i){var s=localStorage.getItem("phex_"+t);return null==s?i:JSON.parse(s,e)},loadInt:function(t,e){var i=parseInt(localStorage.getItem("phex_"+t));return isNaN(i)?e:i},loadStr:function(t,e){let i=localStorage.getItem("phex_"+t);return null==i?e:i},saveObj:function(t,e){localStorage.setItem("phex_"+t,JSON.stringify(e))},loadObj:function(t,e){var i=localStorage.getItem("phex_"+t);return null==i?e:JSON.parse(i)}},s=["#bbbbbb","#f51a3c","#a92393","#623297","#0060b3","#0078c5","#02b2b5","#24bb4e","#add73c","#ffdd00","#ffc110","#fc9b1e","#f97625"];class n{constructor(t,e){this.gameWidth=t,this.gameHeight=e,this.container=document.getElementById("container"),this.drawMethod=1,this.alwaysRenderAll=0,this.canvasCache=new Map,this.unitOnScreenH=64,this.unitOnScreenVO=48,this.unitOnScreenW=56,this.setUp(t,e)}setUp(t,e){console.log("setting up...");let{width:i,height:s}=this.container.getBoundingClientRect();s=document.documentElement.clientHeight-15,64!=this.srcBlockH&&(this.srcBlockH=64,this.srcBlockW=56);const[n]=this.container.children;n&&this.container.removeChild(n);const r=document.createElement("canvas");this.container.appendChild(r),this.context=r.getContext("2d"),r.setAttribute("width",""+(t*this.unitOnScreenW+Math.floor(this.unitOnScreenW/2))),r.setAttribute("height",""+((e+1)*this.unitOnScreenVO-this.unitOnScreenH/2)),this.renderStats()}renderImg(t,e,i,s){}renderFromCanvas(t,e,i){i%2==1&&(e+=.5),this.context&&this.context.drawImage(t,0,0,this.unitOnScreenW,this.unitOnScreenH,Math.floor(this.unitOnScreenW*e),this.unitOnScreenVO*i,this.unitOnScreenW,this.unitOnScreenH)}getHexCanvas(t=13){const e=t+65536;if(this.canvasCache.has(e))return this.canvasCache.get(e);let i=document.createElement("canvas"),n=i.getContext("2d"),r=this.unitOnScreenW,h=this.unitOnScreenH;return i.setAttribute("width",r.toString()),i.setAttribute("height",h.toString()),n.clearRect(0,0,r,h),n.fillStyle=13==t?"#333333":14==t?"#555555":s[t],n.strokeStyle="#000000",n.lineWidth=1,n.beginPath(),n.moveTo(r/2,0),n.lineTo(r,h/4),n.lineTo(r,3*h/4),n.lineTo(r/2,h),n.lineTo(0,3*h/4),n.lineTo(0,h/4),n.lineTo(r/2,0),n.fill(),n.stroke(),this.canvasCache.set(e,i),i}getLineCanvas(t,e){let i=0;for(let e=0;e<6;e++)t[e]&&(i|=1<<e);if(i|=e<<6,this.canvasCache.has(i))return this.canvasCache.get(i);let n=document.createElement("canvas"),r=n.getContext("2d"),h=this.unitOnScreenW,o=this.unitOnScreenH;n.setAttribute("width",h.toString()),n.setAttribute("height",o.toString()),r.lineCap="butt",r.lineJoin="bevel",r.clearRect(0,0,h,o),r.fillStyle=s[e],r.strokeStyle=s[e],r.lineWidth=o/8;let a=0;for(let e=0;e<t.length;e++){if(!t[e])continue;a++,r.beginPath(),r.moveTo(h/2,o/2);let i=h/2,s=o/2;0==e?i=h:1==e?(s=7*o/8,i=3*h/4):2==e?(s=7*o/8,i=1*h/4):3==e?i=0:4==e?(s=1*o/8,i=1*h/4):5==e&&(s=1*o/8,i=3*h/4),r.lineTo(i,s),r.stroke()}let l=o/16;return 1==a&&(l=o/8),r.beginPath(),r.moveTo(h/2,o/2),r.arc(h/2,o/2,l,0,2*Math.PI,!0),r.fill(),this.canvasCache.set(i,n),n}renderStats(){if(p&&p.stats){const t=p.stats;document.getElementById("stats_size").innerHTML=t.puztype,document.getElementById("stats_num").innerHTML=t.num,document.getElementById("stats_best").innerHTML=t.best,document.getElementById("stats_best3").innerHTML=t.best3,document.getElementById("stats_best5").innerHTML=t.best5,document.getElementById("stats_best10").innerHTML=t.best10}}render(){let t=p;if(!t)return void console.log("view::render() called with no gamemanager initialised");if(!this.context)return;let e=p.game,i=p.game.ts;(this.alwaysRenderAll||t.game.winningAnimation.started)&&t.paintAll();for(const s of t.renderSet){const[n,r]=t.game.xyFromIdx(s);if(0==this.drawMethod)this.renderImg(n,r,0,0),this.renderImg(n,r,e.grid[r][n].angle,e.grid[r][n].shape);else if(1==this.drawMethod){let h=null;if(t.game.winningAnimation.started){let e=Math.floor((i-t.game.winningAnimation.start_ts)/100)+n;e=1+Math.floor(e)%11,h=this.getHexCanvas(e)}else h=t.loopedSet.has(s)?this.getHexCanvas(14):this.getHexCanvas();this.renderFromCanvas(h,n,r);let o=t.game.grid[r][n].color,a=this.getLineCanvas(e.grid[r][n].conns,o);this.renderFromCanvas(a,n,r)}}if(t.renderSet.clear(),p.showFPS){let t=Math.floor(1e3/(i-e.tsPrior));document.getElementById("fps_text").innerHTML=""+t}e.tsPrior=i,document.getElementById("puzzle_title").innerHTML=e.title,document.getElementById("timer_text").innerHTML=e.timer.timestring(),e.won?(document.getElementById("wintime").innerHTML=e.wintime,document.getElementById("winner").classList.remove("hide"),this.renderStats()):document.getElementById("winner").classList.add("hide");const s=!p.game.timer.running;document.getElementById("pause").setAttribute("aria-pressed",s.toString())}}function r(t){let e=Math.trunc(t/1e3);const i=Math.trunc(e/60);e-=60*i;let s=e.toString();return s.length<2&&(s="0"+s),i.toString()+":"+s}class h{constructor({time:t=0}={}){this.time=t,this.timestamp=0,this.running=!1}start(t){this.running?this.update(t):(this.timestamp=t,this.running=!0)}stop(t){this.running&&(this.update(t),this.running=!1)}reset(){this.running=!1,this.time=0}update(t){if(this.running){const e=t-this.timestamp;e>=0?this.time+=e:console.log("time has gone backwards"),this.timestamp=t}}getMillis(){return this.time}timestring(){return r(this.time)}}function o(t,e){return Array.isArray(t)&&Array.isArray(e)?t.length===e.length&&t.every(((t,i)=>o(t,e[i]))):t===e}function a(){return Math.trunc(2*Math.random())}const l=[[0,0,0,0,0,0],[1,0,0,0,0,0],[1,1,0,0,0,0],[1,0,1,0,0,0],[1,0,0,1,0,0],[1,1,1,0,0,0],[1,0,1,1,0,0],[1,0,0,1,1,0],[1,0,1,0,1,0],[1,1,1,1,0,0],[1,0,1,1,1,0],[1,1,0,1,1,0],[1,1,1,1,1,0],[1,1,1,1,1,1]];function d(t,e){for(var i=e,s=0;s<6;s++){if(o(i,t))return{m:!0,a:s};i=[i[5],i[0],i[1],i[2],i[3],i[4]]}return{m:!1,a:0}}function c(t){let e=0,i=0,s=0;for(let n=0;n<6;n++)1==t[n]&&(e++,s||(i=n,s=1));let n=0;if(1==e)n=1;else if(e>=2&&e<=5)for(let e=2;e<=12;e++){const s=d(t,l[e]);if(1==s.m){n=e,i=s.a;break}}else 6==e&&(n=13);return{s:n,a:i}}class g{constructor({conns:t=[a(),a(),a(),a(),a(),a()],color:e=0,isolated:i=!0,locked:s=!1,looped:n=!1}={}){this.conns=t;let r=c(this.conns);this.shape=r.s,this.angle=r.a,this.color=e,this.isolated=i,this.locked=s,this.looped=n}rotate(t=!1){t?(this.conns=[this.conns[1],this.conns[2],this.conns[3],this.conns[4],this.conns[5],this.conns[0]],this.angle--,-1==this.angle&&(4==this.shape?this.angle=2:8==this.shape?this.angle=1:11==this.shape?this.angle=2:13==this.shape?this.angle=0:this.angle=5)):(this.conns=[this.conns[5],this.conns[0],this.conns[1],this.conns[2],this.conns[3],this.conns[4]],this.angle++,6==this.angle&&(this.angle=0),(4==this.shape&&3==this.angle||8==this.shape&&2==this.angle||11==this.shape&&3==this.angle||13==this.shape)&&(this.angle=0))}setup(t){this.conns=t;const e=c(this.conns);this.shape=e.s,this.angle=e.a}equal(t){this.conns.every(((e,i)=>e==t.conns[i]))}}class u{constructor(t={}){this.width=0,this.height=0,this.grid=null,this.solvedGrid=null,this.won=!1,this.title="(puzzle title)",this.timer=new h,this.wintime="";for(const[e,i]of Object.entries(t))t.hasOwnProperty(e)&&Object.defineProperty(this,e,{value:Object.getOwnPropertyDescriptor(t,e).value,writable:!0});this.grid=this.newGrid(this.grid),this.timer=new h(this.timer),this.tileW=56,this.tileH=64,this.tileVO=3*this.tileH/4,this.tsPrior=0,this.ts=0,this.winningAnimation={started:!1,start_ts:0}}tileFromIdx(t){let e=~~(t/this.width),i=t%this.width;return this.grid[e][i]}xyFromIdx(t){let e=~~(t/this.width);return[t%this.width,e]}idxFromXy(t,e){return e*this.width+t}newGrid(t=null){let e=[];for(let i=0;i<this.height;i++){let s=[];for(let e=0;e<this.width;e++)null==t?s.push(new g):s.push(new g(t[i][e]));e.push(s)}return e}newGridFromPuzstr(t){let e=this.newGrid(),i=t.split("");for(let t=0;t<this.height;t++)for(let s=0;s<this.width;s++){let n=[0,0,0,0,0,0],r=i[t*this.width+s],h="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-".indexOf(r);1==(1&h)&&(n[0]=1),2==(2&h)&&(n[1]=1),4==(4&h)&&(n[2]=1),8==(8&h)&&(n[3]=1),16==(16&h)&&(n[4]=1),32==(32&h)&&(n[5]=1),e[t][s].setup(n)}return e}haveWinCondition(){if(!Array.isArray(this.solvedGrid))return!1;for(let t=0;t<this.height;t++)for(let e=0;e<this.width;e++)if(!o(this.grid[t][e].conns,this.solvedGrid[t][e].conns))return!1;return this.won=!0,!0}pause(t){return this.timer.running?(this.timer.stop(t),!0):(this.timer.start(t),!1)}loadLevelString(t){let[e,i,s,n,r]=t.split(",");this.title=e,this.width=parseInt(i),this.height=parseInt(s),this.grid=this.newGridFromPuzstr(n),this.solvedGrid=this.newGridFromPuzstr(r)}xyFromPixelCoords(t,e){let i=Math.floor(e/this.tileVO),s=e%this.tileVO/this.tileVO,n=0;i%2==1&&(n=this.tileW/2);let r=Math.floor((t-n)/this.tileW),h=(t-n)%this.tileW/this.tileW;if(s<1/3){let t=3*s;h<.5?2*h<1-t&&(i%2==0&&(r-=1),i-=1):2*(h-.5)>t&&(i%2==0&&(r-=1),i-=1,r+=1)}return[r,i]}inBounds(t,e){return t>=0&&t<this.width&&e>=0&&e<this.height}invertAngle(t){return t>2?t-3:t+3}xyAtAngle(t,e,i){let s=t,n=e;return 0==i?s++:1==i?(e%2==0||s++,n++):2==i?e%2==0?(s--,n++):n++:3==i?s--:4==i?e%2==0?(s--,n--):n--:5==i&&(e%2==0||s++,n--),s<0||s>this.width-1||n<0||n>this.height-1?null:[s,n]}isIsolated(t,e){for(let i=0;i<6;i++){if(!this.grid[e][t].conns[i])continue;let s=this.xyAtAngle(t,e,i);if(null==s)continue;let[n,r]=s;if(this.grid[r][n].conns[this.invertAngle(i)])return!1}return!0}getSurroundingTiles(t,e){let i=[];for(let s=0;s<6;s++){let n=this.xyAtAngle(t,e,s);if(null==n)continue;let[r,h]=n;i.push([r,h])}return i}getConnectedTiles(t,e,i){class s{constructor(t,e,i,s){this.x=t,this.y=e,this.fromangle=i,this.angle=s}}let n=[new s(t,e,null,0)],r=new Set;r.add(e*this.width+t);let h=new Set;for(;n.length>0;){let t=n.pop(),e=t.x,o=t.y,a=t.fromangle,l=t.angle;if(l>5)continue;if(n.push(new s(e,o,a,l+1)),null!=a&&a==l)continue;if(!this.grid[o][e].conns[l])continue;let d=this.xyAtAngle(e,o,l);if(null==d)continue;let[c,g]=d;if(this.grid[g][c].conns[this.invertAngle(l)])if(r.has(g*this.width+c)){let t=0;for(t=0;t<n.length&&(n[t].x!=c||n[t].y!=g);t++);if(t==n.length);else for(let e=t;e<n.length;e++)h.add(n[e].y*this.width+n[e].x)}else r.add(g*this.width+c),i&&n.push(new s(c,g,this.invertAngle(l),0))}return[r,h]}}function m(t,e){const i=new XMLHttpRequest;i.open("GET",t,!0),i.responseType="text",i.onload=function(s){const n=i.response;console.log("puzzle file loaded: ",t);let r=[],h=n.split("\n");for(let t of h)t.length>8&&r.push(t);e(r)},i.send(null)}var p=new class{constructor(){this.PUZZLES=new Map,this.puzzleType=i.loadStr("puzzleType","5"),this.puzzleIdx=i.loadInt("puzzleIdx"+this.puzzleType,0),this.showStats=!1,this.showFPS=!1,this.showTimer=!0,this.showSettings=!1,m("/puzzles5.csv",(t=>this.PUZZLES.set("5",t))),m("/puzzles10.csv",(t=>this.PUZZLES.set("10",t))),m("/puzzles15.csv",(t=>this.PUZZLES.set("15",t))),m("/puzzles20.csv",(t=>this.PUZZLES.set("20",t))),m("/puzzles30.csv",(t=>this.PUZZLES.set("30",t))),m("/puzzles40.csv",(t=>this.PUZZLES.set("40",t))),this.renderSet=new Set,this.loopedSet=new Set,this.game=this.loadGame(parseInt(this.puzzleType)),this.updateStats(),this.view=new n(this.game.width,this.game.height),this.restart({restartSolved:!1,restartGame:!1}),this.view.container.addEventListener("contextmenu",(function(t){return t.preventDefault(),!1})),this.view.container.addEventListener("click",(function(t){return t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),!1})),this.view.container.addEventListener("mouseup",(function(t){return t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),!1})),this.view.container.addEventListener("mousedown",(function(t){t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation();var e=p,[i,s]=e.game.xyFromPixelCoords(t.offsetX,t.offsetY);return e.game.inBounds(i,s)&&e.click(i,s,t.buttons),!1}))}prevPuzzle(){this.puzzleIdx<=0?console.log("No previous puzzles!"):(this.puzzleIdx--,i.saveInt("puzzleIdx"+this.puzzleType,this.puzzleIdx),this.restart())}nextPuzzle(){this.puzzleIdx+1>=this.PUZZLES.get(this.puzzleType).length?console.log("Ran out of puzzles!"):(this.puzzleIdx++,i.saveInt("puzzleIdx"+this.puzzleType,this.puzzleIdx),this.restart())}restart({restartSolved:t=!1,restartGame:e=!0}={}){if(this.PUZZLES.has(this.puzzleType)){if(e||0==this.game.width){const t=parseInt(this.puzzleType);this.game=new u({width:t,height:t}),this.game.loadLevelString(this.PUZZLES.get(this.puzzleType)[this.puzzleIdx])}if(!t){let t=i.loadMap("highscore"+this.puzzleType,new Map),e=parseInt(t.get(this.puzzleIdx));Number.isInteger(e)&&(this.game.grid=this.game.solvedGrid,this.game.timer=new h({time:e}),this.game.haveWinCondition()&&this.onWin())}this.view&&(this.view.setUp(this.game.width,this.game.height),this.paintAll()),this.saveGame()}else setTimeout((()=>p.restart({restartSolved:t,restartGame:e})),100)}setSize(t){this.puzzleType=t.toString(),i.saveStr("puzzleType",this.puzzleType),this.puzzleIdx=i.loadInt("puzzleIdx"+this.puzzleType,0),this.updateStats(),this.restart()}updateLoopSet(){const t=this.loopedSet;this.loopedSet=new Set;let e=[];for(let t=0;t<this.game.height*this.game.width;t++)e.push(t);for(;e.length>0;){let t=e.pop();if(-1==t)continue;let[i,s]=this.game.xyFromIdx(t),[n,r]=this.game.getConnectedTiles(i,s,!0);for(const t of n){let i=e.findIndex((e=>e===t));-1!=i&&(e[i]=-1)}for(const t of r)this.loopedSet.add(t)}for(const e of t)this.loopedSet.has(e)||this.renderSet.add(e);for(const e of this.loopedSet)t.has(e)||this.renderSet.add(e)}render(t){this.game.ts=t,this.game.timer.update(t),this.renderSet.size>0&&this.updateLoopSet(),this.view.render()}paintAll(){this.renderSet=new Set,this.loopedSet=new Set,this.updateLoopSet();for(let t=0;t<this.game.height*this.game.width;t++)this.renderSet.add(t)}saveGame(){i.saveObj("savegame",this.game)}loadGame(t){let e=i.loadObj("savegame",{width:0,height:0});return new u(e)}updateStats(){let t=[...i.loadMap("highscore"+this.puzzleType,new Map).values()];t.sort(((t,e)=>t-e));let e=this.puzzleType+"x"+this.puzzleType,s="tbd",n="tbd",h="tbd",o="tbd";t.length>=1&&(s=r(t[0])),t.length>=3&&(n=r(t.slice(0,3).reduce(((t,e)=>t+e),0)/3)),t.length>=5&&(h=r(t.slice(0,5).reduce(((t,e)=>t+e),0)/5)),t.length>=10&&(o=r(t.slice(0,10).reduce(((t,e)=>t+e),0)/10)),this.stats={puztype:e,num:t.length.toString(),best:s,best3:n,best5:h,best10:o}}onWin(){this.game.timer.stop(this.game.tsPrior),this.game.wintime=this.game.timer.timestring(),document.getElementById("wintime").innerHTML=this.game.wintime;let t=i.loadMap("highscore"+this.puzzleType,new Map);t.set(this.puzzleIdx,Math.trunc(this.game.timer.getMillis())),i.saveMap("highscore"+this.puzzleType,t),this.updateStats(),0==this.game.winningAnimation.started&&(this.game.winningAnimation.started=!0,this.game.winningAnimation.start_ts=this.game.ts)}click(t,e,i){if(!this.game.won){0==i||1==i?this.game.grid[e][t].rotate():2==i&&this.game.grid[e][t].rotate(!0),this.renderSet.add(this.game.idxFromXy(t,e)),this.game.timer.start(this.game.tsPrior);let s=this.game.getSurroundingTiles(t,e);for(;s.length>0;){let[t,e]=s.pop();this.game.isIsolated(t,e)?0==this.game.grid[e][t].isolated&&(this.game.grid[e][t].isolated=!0,this.game.grid[e][t].color=0,this.renderSet.add(this.game.idxFromXy(t,e))):1==this.game.grid[e][t].isolated&&(this.renderSet.add(this.game.idxFromXy(t,e)),this.game.grid[e][t].isolated=!1)}let[n,r]=this.game.getConnectedTiles(t,e,!0),h=this.game.grid[e][t].color;if(n.size<=1)this.game.grid[e][t].isolated=!0,h=0;else{this.game.grid[e][t].isolated=!1;let i=n.values();i.next();let s=i.next().value;h=this.game.tileFromIdx(s).color,0==h&&(h=1+(e*this.game.width+t)%12)}for(let t of n){let e=Math.trunc(t/this.game.width),i=t%this.game.width;this.game.grid[e][i].color!=h&&(this.game.grid[e][i].color=h,this.renderSet.add(t))}this.game.haveWinCondition()&&this.onWin()}this.render(this.game.ts),this.saveGame()}};document.getElementById("restart_button").addEventListener("click",(function(){p.restart({restartSolved:!0})})),document.getElementById("prev_puzzle").addEventListener("click",(function(){p.prevPuzzle()}));let f=document.getElementsByClassName("next_puzzle");for(let t=0;t<f.length;t++)f.item(t).addEventListener("click",(function(){p.nextPuzzle()}));function w(t,e){t instanceof HTMLButtonElement&&t.setAttribute("aria-pressed",e.toString())}function S(t,e){e?t.classList.remove("hide"):t.classList.add("hide")}document.getElementById("pause").addEventListener("click",(function(t){const e=p.game.pause(p.game.tsPrior);w(t.target,e)})),document.getElementById("show_fps").addEventListener("click",(function(t){p.showFPS=!p.showFPS;const e=p.showFPS;let i=document.getElementById("menu_fps");w(t.target,e),S(i,e)})),document.getElementById("show_timer").addEventListener("click",(function(t){p.showTimer=!p.showTimer;const e=p.showTimer;let i=document.getElementById("menu_time");w(t.target,e),S(i,e)})),document.getElementById("settings_button").addEventListener("click",(function(t){p.showSettings=!p.showSettings;const e=p.showSettings;let i=document.getElementById("settings_menu");w(t.target,e),S(i,e)})),document.getElementById("stats_button").addEventListener("click",(function(t){p.showStats=!p.showStats;const e=p.showStats;let i=document.getElementById("stats");w(t.target,e),S(i,e)}));let z=document.getElementById("settings_game_size");Array.prototype.forEach.call(z.children,(t=>{t.addEventListener("click",(function(e){const i=Number.parseInt(t.getAttribute("data"));p.setSize(i)}))})),function t(e){window.requestAnimationFrame(t),p.render(e)}(0)})();