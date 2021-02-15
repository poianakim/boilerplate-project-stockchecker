const chaiHttp = require('chai-http')
const chai = require('chai')
const assert = chai.assert
const server = require('./server')
const { expect } = require('chai')

chai.use(chaiHttp)

suite('Functional Tests', function () {
  suite('Tests', () => {
    suite('GET /api/stock-prices', () => {
      test('GET /api/stock-prices?stock=[symbol] getting an object with the properth stockData', done => {
        chai
          .request(server)
          .get('/api/stock-prices')
          .query({ stock: 'goog' })
          .end((err, res) => {
            if (err) console.log(err)
            assert.equal(res.status, 200)
            assert.isObject(res.body, 'response should be an object')
            assert.property(res.body['stockData'], 'stock')
            assert.property(res.body['stockData'], 'price')
            assert.equal(res.body['stockData']['stock'], 'goog')
            assert.isNumber(
              res.body['stockData']['price'],
              'price should be a number'
            )
            done()
          })
      })
      test('GET /api/stock-prices?stock=[symbol]&like=true pass likes as true(Bool)', done => {
        chai
          .request(server)
          .get('/api/stock-prices')
          .query({ stock: 'goog', like: true })
          .end((err, res) => {
            if (err) console.log(err)
            assert.equal(res.status, 200)
            assert.isObject(res.body, 'response should be an object')
            assert.property(res.body['stockData'], 'stock')
            assert.property(res.body['stockData'], 'price')
            assert.property(res.body['stockData'], 'likes')
            assert.equal(res.body['stockData']['stock'], 'goog')
            assert.isNumber(res.body['stockData']['likes'])
            assert.isNumber(
              res.body['stockData']['price'],
              'price should be a number'
            )
            done()
          })
      })
      test('GET /api/stock-prices?stock=[symbol]&like=true one like per one IP adress', done => {
        chai
          .request(server)
          .get('/api/stock-prices')
          .query({ stock: 'goog', like: true })
          .end((err, res) => {
            if (err) console.log(err)
            assert.equal(res.status, 200)
            assert.isObject(res.body, 'response should be an object')
            assert.property(res.body['stockData'], 'stock')
            assert.property(res.body['stockData'], 'price')
            assert.property(res.body['stockData'], 'likes')
            assert.equal(res.body['stockData']['stock'], 'goog')
            assert.isNumber(res.body['stockData']['likes'])
            assert.isNumber(
              res.body['stockData']['price'],
              'price should be a number'
            )
            done()
          })
      })
      test('GET /api/stock-prices?stock=[symbol1]&stock=[symbol2] get data of both stock', done => {
        chai
          .request(server)
          .get('/api/stock-prices?stock=mstf&stock=tsla')
          .end((err, res) => {
            if (err) console.log(err)
            assert.equal(res.status, 200)
            assert.isObject(res.body, 'response should be an object')
            assert.property(res.body, 'stockData')
            assert.isArray(
              res.body['stockData'],
              'it should be an array with two objects'
            )
            assert.equal(res.body['stockData'].length, 2)
            done()
          })
      })
      test('GET /api/stock-prices?stock=[symbol1]&stock=[symbol2]&like=true get data of both stock with rel-like value', done => {
        chai
          .request(server)
          .get('/api/stock-prices?stock=mstf&stock=tsla&like=true')
          .end((err, res) => {
            if (err) console.log(err)
            assert.equal(res.status, 200)
            assert.isObject(res.body)
            assert.property(res.body, 'stockData')
            assert.isArray(
              res.body['stockData'],
              'it should be an array with two objects'
            )
            assert.property(res.body['stockData'][0], 'stock')
            assert.property(res.body['stockData'][0], 'price')
            assert.property(res.body['stockData'][0], 'rel-likes')
            assert.property(res.body['stockData'][1], 'stock')
            assert.property(res.body['stockData'][1], 'price')
            assert.property(res.body['stockData'][1], 'rel-likes')
            assert.equal(res.body['stockData'].length, 2)
            done()
          })
      })
    })
  })
})
