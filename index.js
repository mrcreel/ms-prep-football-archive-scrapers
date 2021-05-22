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
    let $ = await getData(page)

    const schoolCells = $('td[colspan=8] a')

    for (let i = 0; i < 5  /*schoolCells.length*/   ; i++) {
      const schoolInfo = {}
      const schoolSlug = cleanText($(schoolCells[i]).attr('href').split('.')[0])
      schoolInfo.schoolSlug = schoolSlug

      const schoolInfoArray = await getSchoolInfo(schoolSlug)

      schoolInfo.schoolAffiliation = schoolInfoArray[0]
      schoolInfo.schoolCity = schoolInfoArray[1]
      console.log(schoolInfo)
      schoolsArray.push(schoolInfo)
    }
    divider()

  }
  console.log(schoolsArray)
  writeArrayToJson(schoolsArray, `schools`)
}

const getSchoolInfo = async (schoolSlug) => {
  const schoolInfoArray = []
  const page = `/Teams/${schoolSlug}.htm`

  const $ = await getData(page)

  const schoolLocation = cleanText($($(`td[colspan=56]`)[1]).text())
  console.log(schoolLocation)
  const schoolCity = cleanText(schoolLocation.split(',')[0])
  console.log(schoolCity)

  schoolInfoArray.push(cleanText($($(`td[colspan=56]`)[0]).text().split(' (')[0]))
  schoolInfoArray.push(schoolCity)
  console.log(schoolInfoArray)

  return schoolInfoArray

}


getSchools();