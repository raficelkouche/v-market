import { Game } from './game.js'
import { Login } from './login.js'
import { Register } from './register.js'
import { Store } from './store.js'

const config = {
  type: Phaser.AUTO,
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER,
    width: 1280,
    height: 960,
    parent: "game-container"
  },
  dom: {
    createContainer: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  fps: {
    target: 30,
    forceSetTimeOut: true
  },
  scene: [Login, Register, Game, Store]
};

const startGame = new Phaser.Game(config)
