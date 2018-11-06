/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/specs/provider/
*/
const request = require('request').defaults({ gzip: true, json: true })
const config = require('config')

function Salesforce (koop) {}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Salesforce.prototype.getData = function (req, callback) {
  const clientSecret = config.Salesforce.clientSecret
  const clientId = config.Salesforce.clientId
  const securityToken = config.Salesforce.securityToken
  const url = config.Salesforce.url

  const username = (req.query && req.query.username) ? req.query.username : ''
  const password = (req.query && req.query.password) ? req.query.password : ''

  request.post({
    url: url + '/oauth2/token',
    form: {
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password + securityToken
    }
  }, function (err, httpResponse, body) {
    if (err) {
      console.log('auth request failed: ' + err)
      return
    }

    console.log(body)

    var accessToken = body.access_token

    var requestOptions = {
      url: url + '/services/data/v30.0/query',
      form: {
        q: 'SELECT+Name,+BillingLatitude,+BillingLongitude+from+Account'
      },
      auth: {
        bearer: accessToken
      }
    }

    request.get(requestOptions, (err, httpResponse, body) => {
      if (err) {
        console.log('query request failed: ' + err)
        return
      }
      const geojson = translate(body)
      callback(null, geojson)
    })
  })
}

function translate (input) {
  return {
    type: 'FeatureCollection',
    features: input.records.map(formatFeature)
  }
}

function formatFeature (inputFeature) {
  // Most of what we need to do here is extract the longitude and latitude
  const feature = {
    type: 'Feature',
    properties: inputFeature,
    geometry: {
      type: 'Point',
      coordinates: [inputFeature.BillingLongitude, inputFeature.BillingLatitude]
    }
  }
  return feature
}

module.exports = Salesforce

/* Example provider API:
   - needs to be converted to GeoJSON Feature Collection
{
  "resultSet": {
  "queryTime": 1488465776220,
  "vehicle": [
    {
      "tripID": "7144393",
      "signMessage": "Red Line to Beaverton",
      "expires": 1488466246000,
      "serviceDate": 1488441600000,
      "time": 1488465767051,
      "latitude": 45.5873117,
      "longitude": -122.5927705,
    }
  ]
}

Converted to GeoJSON:

{
  "type": "FeatureCollection",
  "features": [
    "type": "Feature",
    "properties": {
      "tripID": "7144393",
      "signMessage": "Red Line to Beaverton",
      "expires": "2017-03-02T14:50:46.000Z",
      "serviceDate": "2017-03-02T08:00:00.000Z",
      "time": "2017-03-02T14:42:47.051Z",
    },
    "geometry": {
      "type": "Point",
      "coordinates": [-122.5927705, 45.5873117]
    }
  ]
}
*/
