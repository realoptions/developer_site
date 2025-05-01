const path = require('path')
const { https } = require('follow-redirects')
const fs = require('fs')
const process = require('process')
const cwd = process.cwd()
const releasePath = path.join(cwd, 'scripts', 'releases.json')
const { assets } = require(releasePath)
const { access_token } = process.env
const assetName = 'openapi_gcp.yml'
const yaml = require('js-yaml')

asset = assets.find(val => val.name === assetName)
const writePath = path.join(cwd, assetName)
const jsonPath = path.join(cwd, 'src', 'swagger_spec.json')
const file = fs.createWriteStream(writePath)
https.get(
    asset.browser_download_url,
    {
        headers: {
            Authorization: `token ${access_token}`
        }
    }, (response, err) => {
        if (err) {
            return console.log(err)
        }
        response.pipe(file)
        file.on('finish', () => {
            file.close()
            const jsobj = yaml.load(fs.readFileSync(writePath, 'utf8'))
            fs.writeFile(jsonPath, JSON.stringify(jsobj), 'utf8', err => {
                if (err) console.log(err)
                fs.unlink(writePath, () => console.log("done"))
            })
        })
    }).on('error', function (err) { // Handle errors
        fs.unlink(writePath, () => console.log("deleted")) // Delete the file async. (But we don't check the result)
        console.log(err)
    })