/* index.ts
 * Entry point. Initialise event handlers, initialise gameManager.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

import { GameManager, gameManager } from './game-manager.js';
import Storage from './storage.js';
import { setAriaPressed, setHideClass } from './util.js';

document.getElementById("restart_button").addEventListener('click', function() {
    gameManager.restart({restartSolved:true});
});

document.getElementById('prev_puzzle').addEventListener('click', function() {
    gameManager.prevPuzzle();
});


let nps = document.getElementsByClassName('next_puzzle');
for(let i=0; i<nps.length; i++) {
    nps.item(i).addEventListener('click', function() {
        gameManager.nextPuzzle();
    });
};


document.getElementById("pause").addEventListener('click', function(ev) {
    const paused = gameManager.game.pause(gameManager.game.tsPrior);
    setAriaPressed(ev.target, paused);
});

document.getElementById('show_fps').addEventListener('click', function(ev) {
    gameManager.showFPS = !gameManager.showFPS;
    const active = gameManager.showFPS;
    let element = document.getElementById('menu_fps');
    let target = document.getElementById('show_fps');
    setAriaPressed(target, active);
    setHideClass(element, active);
    Storage.saveStr('showFPS',active.toString());});

document.getElementById('show_timer').addEventListener('click', function(ev) {
    gameManager.showTimer = !gameManager.showTimer;
    const active = gameManager.showTimer;
    let element = document.getElementById('menu_time');
    let target = document.getElementById('show_timer');
    setAriaPressed(target, active);
    setHideClass(element, active);
    Storage.saveStr('showTimer',active.toString());
});

document.getElementById("settings_button").addEventListener('click', function (ev) {
    gameManager.showSettings = !gameManager.showSettings;
    const active = gameManager.showSettings;
    let element = document.getElementById('settings_menu');
    setAriaPressed(ev.target, active);
    setHideClass(element, active);
});

document.getElementById("stats_button").addEventListener('click', function (ev) {
    gameManager.showStats = !gameManager.showStats;
    const active = gameManager.showStats;
    let element = document.getElementById('stats');
    setAriaPressed(ev.target, active);
    setHideClass(element, active);
});

let sgs = document.getElementById("settings_game_size");
Array.prototype.forEach.call(sgs.children, (el) => {
    el.addEventListener('click', 
        function (ev: Event) {
        const s = Number.parseInt(el.getAttribute('data'));
        gameManager.setSize(s);
    });
});


;(function () {
    function main(ts: number) {
        //gameManager.stopMain = window.requestAnimationFrame(main);
        window.requestAnimationFrame(main);
        gameManager.render(ts);
    }
    main(0);
})();
