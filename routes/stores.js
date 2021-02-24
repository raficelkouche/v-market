const express = require('express');
const router = express.Router();
const db = require('../db/helper');

module.exports = () => {
  //load more products based on how many times the function was called
  router.get('/:store_id/:call_count', (req, res) => {
    const store_id = Number(req.params.store_id);
    const call_count = Number(req.params.call_count);
    db.getMoreProducts(store_id, call_count)
      .then(products => {
        res.json(products);
      });
  })

  router.get('/:store_id/products/:product_id', (req, res) => {
    const product_id = Number(req.params.product_id);
    db.getProduct(product_id)
      .then(product => {
        res.json(product);
      });
  })

  router.get('/', (req, res) => {
    db.getAllStores()
      .then(stores => {
        res.json(stores);
      });
  })
  return router;
}







