/*
  model-test.js

  This file is optional, but is strongly recommended. It tests the `getData` function to ensure its translating
  correctly.
*/

const test = require('tape')
const Model = require('../Salesforce')
const model = new Model()
const nock = require('nock')
const config = require('config')

test('should properly fetch from the API and translate features', t => {
  nock(config.Salesforce.url)
    .post('/services/oauth2/token')
    .reply(200, require('./fixtures/auth.json'))

  nock(config.Salesforce.url)
    .get('/services/data/v30.0/query')
    .reply(200, require('./fixtures/input.json'))

  model.getData({}, (err, geojson) => {
    t.error(err)
    t.equal(geojson.type, 'FeatureCollection', 'creates a feature collection object')
    t.ok(geojson.features, 'has features')
    const feature = geojson.features[0]
    t.equal(feature.type, 'Feature', 'has proper type')
    t.equal(feature.geometry.type, 'Point', 'creates point geometry')
    t.deepEqual(feature.geometry.coordinates, [-90.5017, 38.8085], 'translates geometry correctly')
    t.ok(feature.properties, 'creates attributes')
    t.end()
  })
})
