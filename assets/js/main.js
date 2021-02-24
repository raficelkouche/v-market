import { Game } from './game.js'
import { Login } from './login.js'
import { Register } from './register.js'
import { Store } from './store.js'
import { Global } from './global.js'

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
    target: 60,
    forceSetTimeOut: true
  },

  scene: [Login, Register, Game, Store]
};

class NewGame extends Phaser.Game {
  constructor() {
    super(config);
    const globalVars = new Global()
    this.globals = { globalVars }
  }
}


const startGame = new NewGame();