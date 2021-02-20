class Global {
  constructor() {
    this.storeData
    this.socket;
    this.connectionEstablished = false;
    this.coordinates = {
      x: Math.floor(Math.random() * 500) + 40,
      y: Math.floor(Math.random() * 600) + 50
    };
    this.playersList = {}
    this.getStoreData()
  }
  
   getStoreData = async () => {
    this.storeData = await $.ajax(`/stores`, { method: 'GET' })
    return Array.from(this.storeData)
  }


  getSocket = () => {
    return this.socket
  }

  getCoordinates = () => {
    return this.coordinates
  }
}

export { Global }