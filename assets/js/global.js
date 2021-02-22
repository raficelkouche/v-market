class Global {
  constructor() {
    this.storeData
    this.connectionEstablished = false;
    this.playersList = {}
    this.getStoreData()
  }
  
   getStoreData = async () => {
    this.storeData = await $.ajax(`/stores`, { method: 'GET' })
    return Array.from(this.storeData)
  }
}

export { Global }