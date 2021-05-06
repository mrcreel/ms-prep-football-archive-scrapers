const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const fs = require('fs')

const cleanText = (string) => {
  return string.replace('\n', '').replace('  ', ' ')
}

const footballData = []
const BASE_URL = `http://misshsfootball.com`

const textBetweenParens = (string) => {
  const re = /\((.*)\)/
  return string.match(re)[1]
}

const getTeamSeasons = async (teamSlug) => {
  const teamSeasons = []
  console.log(`${BASE_URL}/Teams/${teamSlug}_Standings.htm`)

  const html = await axios.get(`${BASE_URL}/Teams/${teamSlug}_Standings.htm`)
  const $ = await cheerio.load(html.data)

  const seasonsRaw = $('td[colspan=4]')

  seasonsList = []
  for (let i = 0; i < seasonsRaw.length; i++) {
    const season = $(seasonsRaw[i]).text()
    if (!isNaN(season)) {
      seasonsList.push(season)
    }
  }

  const divisionsRaw = $('td[colspan=6]')
  const divisionsList = []

  for (let i = 3; i < divisionsRaw.length; i++) {
    const division = cleanText($(divisionsRaw[i]).text())
    if (division.match('Pts') == null) {
      divisionsList.push(division)
    }
  }

  for (let i = 0; i < seasonsList.length; i++) {
    let teamSeason = {}
    teamSeason.teamSlug = teamSlug
    teamSeason.season = seasonsList[i]
    teamSeason.division = divisionsList[i]
    console.log(teamSeason)
    teamSeasons.push(teamSeason)
  }

  return teamSeasons
}

const getSchoolInfo = async (teamSlug) => {
  const schoolInfo = {}

  schoolInfo.teamSlug = teamSlug
  schoolInfo.schoolLink = `${BASE_URL}/Teams/${teamSlug}.htm`

  const html = await axios.get(`${BASE_URL}/Teams/${teamSlug}.htm`)
  const $ = await cheerio.load(html.data)

  schoolInfo.schoolAffiliation = cleanText($($(`td[colspan=56]`)[0]).text())
  schoolInfo.schoolLocation = cleanText($($(`td[colspan=56]`)[1]).text())
  schoolInfo.schoolTown = cleanText($($(`td[colspan=56]`)[1]).text()).split(
    ','
  )[0]
  schoolInfo.schoolCounty = cleanText($($(`td[colspan=56]`)[1]).text())
    .split(',')[1]
    .trim()
    .replace(' County', '')
  schoolInfo.schoolType = cleanText($($(`td[colspan=56]`)[2]).text())

  const paren = /\(/g
  if (schoolInfo.schoolType.match(paren) != null) {
    schoolInfo.schoolDistrict = textBetweenParens(schoolInfo.schoolType)
  }

  return schoolInfo
}

const getTeams = async () => {
  let teams = []

  // const html = await axios.get(`${BASE_URL}/Teams/index.htm`)
  const html = await axios.get(`${BASE_URL}/Teams/Inactive.htm`)
  let $ = await cheerio.load(html.data)

  let teamsList = $('td[colspan=8] a')

  /* DELETE THIS! */
  for (let i = 0; i < 1 /* teamsList.length */; i++) {
    let teamData = []
    const teamSlug = cleanText($(teamsList[i]).attr('href').split('.')[0])
    teamData.teamSlug = teamSlug

    const schoolInfo = await getSchoolInfo(teamSlug)
    teamData.push(schoolInfo)

    const teamSeasons = await getTeamSeasons(teamSlug)
    teamData.push(teamSeasons)

    teams.push(teamData)
  }
  console.log(teams)

  /*
  teamsList.each((idx, ele) => {
    let team = {}

    team.teamSlug = cleanText($(ele).attr('href').split('.')[0])
    teams.push(team)
  })
  console.log(typeof teamsList[0])
  */

  const data = JSON.stringify(teams)

  // write file to disk
  fs.writeFile('data.json', data, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      console.log(`File is written successfully!`)
    }
  })
}

getTeams()
