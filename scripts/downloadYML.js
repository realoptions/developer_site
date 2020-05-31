const path = require('path')
const { https } = require('follow-redirects')
const fs = require('fs')
const process = require('process')
const cwd = process.cwd()
const jsonPath = path.join(cwd, 'scripts', 'releases.json')
const { assets } = require(jsonPath)
const { access_token } = process.env
const assetName = 'openapi_v2.yml'
asset = assets.find(val => val.name === assetName)
const writePath = path.join(cwd, 'public', 'swaggerspec', assetName)
const file = fs.createWriteStream(writePath)
https.get(`${asset.browser_download_url}?access_token=${access_token}`, (response, err) => {
    if (err) {
        return console.log(err)
    }
    response.pipe(file)
    file.on('finish', () => file.close())
}).on('error', function (err) { // Handle errors
    fs.unlink(writePath); // Delete the file async. (But we don't check the result)
    console.log(err)
})