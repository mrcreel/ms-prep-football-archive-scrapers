const axios = require('axios')
const cheerio = require('cheerio')

const {
  cleanText,
  divider,
  writeArrayToJson,
} = require('./functions')

const BASE_URL = `http://misshsfootball.com`

const pages = [
  `/Teams/index.htm`,
  `/Teams/Inactive.htm`,
]


const getData = async (page) => {
  try {
    const html = await axios.get(`${BASE_URL}/${page}`)
    const $ = await cheerio.load(html.data)
    return $
  } catch (error) {
    console.log(error)
  }
}

const getSchools = async () => {
  const schoolsArray = []
  for (const page of pages) {
    const $ = await getData(page);
    console.log(`${BASE_URL}${page}`)

    const schoolCells = $('td[colspan=8] a')

    for (let i = 0; i < schoolCells.length ; i++) {
      const schoolSlug = cleanText($(schoolCells[i]).attr('href').split('.')[0])
      console.log(schoolSlug)
      schoolsArray.push(schoolSlug)
    }
    divider()

  }
  console.log(schoolsArray)
  writeArrayToJson(schoolsArray, `schools`)
};
getSchools();