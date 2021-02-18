import { Game } from './game.js'
import { Login } from './login.js'
import { Register } from './register.js'

const config = {
  type: Phaser.AUTO,
  
  scale: {
    mode: Phaser.Scale.FIT,
    //autoCenter: Phaser.Scale.CENTER_VERTICALLY,
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
  scene: [Login, Register, Game]
};

const startGame = new Phaser.Game(config)
