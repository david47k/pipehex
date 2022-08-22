
import { GameManager } from './game-manager.js';

document.gameManager = new GameManager();

document.getElementById("restart_button").addEventListener('click', function() {
    document.gameManager.restart({restart_solved:true});
});

document.getElementById('prev_puzzle').addEventListener('click', function() {
    document.gameManager.prev_puzzle();
});

let nps = document.getElementsByClassName('next_puzzle');
for(let i=0; i<nps.length; i++) {
    nps.item(i).addEventListener('click', function() {
        document.gameManager.next_puzzle();
    });
};

document.getElementById("pause").addEventListener('click', function(ev) {
    const paused = document.gameManager.game.pause(document.gameManager.game.last_ts);
    ev.target.setAttribute('aria-pressed', paused);
});

document.getElementById('show_fps').addEventListener('click', function(ev) {
    const show = !document.gameManager.showFPS;
    let fpsElement = document.getElementById('menu_fps');
    document.gameManager.showFPS = show;
    ev.target.setAttribute('aria-pressed', show);
    if(show) {
        fpsElement.classList.remove('hide');
    } else {
        fpsElement.classList.add('hide');
    }    
});

document.getElementById('show_timer').addEventListener('click', function(ev) {
    const show = !document.gameManager.showTimer;
    const timerElement = document.getElementById('menu_time');
    document.gameManager.showTimer = show;
    ev.target.setAttribute('aria-pressed', show);
    if(show) {
        timerElement.classList.remove('hide');
    } else {
        timerElement.classList.add('hide');
    }    
    
});

document.getElementById("settings_button").addEventListener('click', function (ev) {
    const pressed = ev.target.getAttribute('aria-pressed') === 'true';
    ev.target.setAttribute('aria-pressed', !pressed);
    let settings_menu = document.getElementById("settings_menu");
    if(settings_menu.classList.contains("hide")) {
        settings_menu.classList.remove("hide");
    } else {
        settings_menu.classList.add("hide");
    }    
});

document.getElementById("stats_button").addEventListener('click', function (ev) {
    let settings_menu = document.getElementById("stats");
    if(document.gameManager.showStats == false) {
        document.gameManager.updateStats();
        document.gameManager.showStats = true;
        settings_menu.classList.remove("hide");
        ev.target.setAttribute('aria-pressed', true);
    } else {
        document.gameManager.showStats = false;
        settings_menu.classList.add("hide");
        ev.target.setAttribute('aria-pressed', false);
    }    
});

let sgs = document.getElementById("settings_game_size");
Array.prototype.forEach.call(sgs.children, (el) => {
    el.addEventListener('click', function (ev) {
        let s = Number.parseInt(el.getAttribute('data'));
        document.gameManager.setSize(s,s);
    });
});


;(function () {
    function main(ts) {
        document.gameManager.stopMain = window.requestAnimationFrame(main);
        document.gameManager.render(ts);
    }
    main(0);
})();
