import { Game } from './game.js'
import { Login } from './login.js'

const config = {
  type: Phaser.AUTO,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_VERTICALLY,
    width: 1280,
    height: 960,
    parent: "#game-container"
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
  scene: [Login, Game]
};

const startGame = new Phaser.Game(config)
