'use strict'
const fetch = require('node-fetch')
const mongoose = require('mongoose')
require('dotenv').config({ path: 'ENV_FILENAME' })
const path = require('path')
const { response } = require('../server')
const MONGODB_URI = process.env.MONGO_DB

// Use connect method to the server
mongoose.connect(
  MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  },

  err => {
    console.log(err)
  }
)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection:error:'))
db.once('open', () => {
  console.log('we are connected!')
})

const stockSchema = new mongoose.Schema({
  stock: String,
  likes: Number,
  ip: [String]
})
const Stock = mongoose.model('Stock', stockSchema)

let responseObj = {
  stockData: {
    stock: String,
    price: Number
  }
}

const stockSave = (stockName, reqIp) => {
  let newStock = new Stock({ stock: stockName, likes: 1, ip: [reqIp] })
  newStock.save()
}

module.exports = app => {
  app.set('trust proxy', true)

  app.route('/api/stock-prices').get(async (req, res) => {
    let stock = req.query.stock
    let isMultiple = false
    let firstStock
    let secondStock
    console.log('stock', stock)
    if (Array.isArray(stock)) {
      firstStock = stock[0]
      secondStock = stock[1]
      isMultiple = true
    } else {
      stock = stock.toLowerCase()
    }
    if (!isMultiple) {
      const stockURI = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
      await fetch(stockURI)
        .then(res => res.json())
        .then(data => {
          responseObj['stockData']['stock'] = stock
          responseObj['stockData']['price'] = data.latestPrice
        })
        .catch(err => console.log(err))
    } else {
      await Promise.all([
        fetch(
          `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${firstStock}/quote`
        ),
        fetch(
          `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${secondStock}/quote`
        )
      ])
        .then(responses => {
          return Promise.all(responses.map(response => response.json()))
        })
        .then(data => {
          responseObj['stockData'] = []
          responseObj['stockData'].push({
            stock: firstStock,
            price: data[0].latestPrice
          })
          responseObj['stockData'].push({
            stock: secondStock,
            price: data[1].latestPrice
          })
        })
        .catch(err => console.log(err))
    }
    if (!req.query.like) {
      return res.json(responseObj)
    } else {
      if (isMultiple) {
        let firstLikes
        let secondLikes
        await Stock.findOne({ stock: firstStock }, (err, doc) => {
          if (err) console.log(err)
          if (!doc) {
            stockSave(firstStock, req.clientIp)
            firstLikes = 1
          } else {
            firstLikes = doc.likes
          }
        })
        await Stock.findOne({ stock: secondStock }, (err, doc) => {
          if (err) console.log(err)
          if (!doc) {
            stockSave(secondStock, req.clientIp)
            secondLikes = 1
          } else {
            secondLikes = doc.likes
          }
        })
        responseObj['stockData'][0]['rel-likes'] = firstLikes - secondLikes
        responseObj['stockData'][1]['rel-likes'] = secondLikes - firstLikes
        return res.json(responseObj)
      } else {
        Stock.findOne({ stock: stock }, (err, doc) => {
          if (err) console.log(err)
          if (!doc) {
            stockSave(stock, req.clientIp)
            responseObj['stockData']['likes'] = 1
            return res.json(responseObj)
          } else {
            if (!doc.ip.includes(req.clientIp)) {
              Stock.update(
                { stock: stock },
                { $push: { ip: req.clientIp }, $inc: { likes: 1 } },
                (err, doc) => {
                  if (err) console.log(err)
                  responseObj['stockData']['likes'] = doc.likes
                  return res.json(responseObj)
                }
              )
            } else {
              responseObj['stockData']['likes'] = doc.likes
              return res.json(responseObj)
            }
          }
        })
      }
    }
  })
}
