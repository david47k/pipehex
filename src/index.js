/* Copyright 2022 David Atkinson */

import { GameManager, gameManager } from './game-manager.js';


document.getElementById("restart_button").addEventListener('click', function() {
    gameManager.restart({restart_solved:true});
});

document.getElementById('prev_puzzle').addEventListener('click', function() {
    gameManager.prev_puzzle();
});

let nps = document.getElementsByClassName('next_puzzle');
for(let i=0; i<nps.length; i++) {
    nps.item(i).addEventListener('click', function() {
        gameManager.next_puzzle();
    });
};

document.getElementById("pause").addEventListener('click', 
    /** @param { Event } ev */
    function(ev) {
    const paused = gameManager.game.pause(gameManager.game.last_ts);
    const target = ev.target; // as HTMLInputElement
    if(target instanceof HTMLInputElement) {
        target.setAttribute('aria-pressed', paused.toString());
    }
});

document.getElementById('show_fps').addEventListener('click', function(ev) {
    const show = !gameManager.showFPS;
    let fpsElement = document.getElementById('menu_fps');
    gameManager.showFPS = show;
    const target = ev.target; // as HTMLInputElement
    if(target instanceof HTMLInputElement) {
        target.setAttribute('aria-pressed', show.toString());
    }
    if(show) {
        fpsElement.classList.remove('hide');
    } else {
        fpsElement.classList.add('hide');
    }    
});

document.getElementById('show_timer').addEventListener('click', function(ev) {
    const show = !gameManager.showTimer;
    const timerElement = document.getElementById('menu_time');
    gameManager.showTimer = show;
    const target = ev.target; // as HTMLInputElement
    if(target instanceof HTMLInputElement) {
        target.setAttribute('aria-pressed', show.toString());
    }
    if(show) {
        timerElement.classList.remove('hide');
    } else {
        timerElement.classList.add('hide');
    }    
    
});

document.getElementById("settings_button").addEventListener('click', function (ev) {
    const target = ev.target; // as HTMLInputElement
    if(target instanceof HTMLInputElement) {
        const pressed = target.getAttribute('aria-pressed') === 'true';
        target.setAttribute('aria-pressed', (!pressed).toString());
    }
    let settings_menu = document.getElementById("settings_menu");
    if(settings_menu.classList.contains("hide")) {
        settings_menu.classList.remove("hide");
    } else {
        settings_menu.classList.add("hide");
    }    
});

document.getElementById("stats_button").addEventListener('click', function (ev) {
    let settings_menu = document.getElementById("stats");
    const target = ev.target; // as HTMLInputElement
    if(gameManager.showStats == false) {
        gameManager.updateStats();
        gameManager.showStats = true;
        settings_menu.classList.remove("hide");
        if(target instanceof HTMLInputElement) {
            target.setAttribute('aria-pressed', 'true');
        }
    } else {
        gameManager.showStats = false;
        settings_menu.classList.add("hide");
        if(target instanceof HTMLInputElement) {
            target.setAttribute('aria-pressed', 'false');
        }
    }    
});

let sgs = document.getElementById("settings_game_size");
Array.prototype.forEach.call(sgs.children, (el) => {
    el.addEventListener('click', 
        /** @param {Event} ev */
        function (ev) {
        const s = Number.parseInt(el.getAttribute('data'));
        gameManager.setSize(s);
    });
});


;(function () {
    /** @param {number} ts */
    function main(ts) {
        //gameManager.stopMain = window.requestAnimationFrame(main);
        window.requestAnimationFrame(main);
        gameManager.render(ts);
    }
    main(0);
})();
