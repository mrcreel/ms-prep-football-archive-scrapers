const fetch = require('node-fetch')
const cheerio = require(`cheerio`)
const { default: axios } = require('axios')

const BASE_URL = `http://misshsfootball.com`

const cleanText = (string) => {
  return string.replace('\n', '').replace('  ', ' ')
}

const textBetweenParens = (string) => {
  const re = /\((.*)\)/
  return string.match(re)[1]
}

const getSchoolLocation = async (teamSlug) => {
  const html = await axios.get(`${BASE_URL}/Teams/${teamSlug}.htm`)
  return html
}

const teamSlug = `Stone`
getSchoolLocation(teamSlug).then((body) => {
  const $ = cheerio.load(body.data)
  const $elements = $(`td[colspan=56]`)

  const schoolInfo = {}

  schoolInfo.teamSlug = teamSlug
  schoolInfo.schoolAffiliation = cleanText($($elements[0]).text())
  schoolInfo.schoolLocation = cleanText($($elements[1]).text())
  schoolInfo.schoolType = cleanText($($elements[2]).text())

  const paren = /\(/g
  if (schoolInfo.schoolType.match(paren) != null) {
    schoolInfo.schoolDistrict = textBetweenParens(schoolInfo.schoolType)
  }

  console.log(schoolInfo)
})
