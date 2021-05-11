const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const fs = require('fs')
const { clear } = require('console')

const cleanText = (string) => {
  return string.replace('\n', '').replace('  ', ' ')
}

const footballData = []
const BASE_URL = `http://misshsfootball.com`

const textBetweenParens = (string) => {
  const re = /\((.*)\)/
  return string.match(re)[1]
}

const divider = async () => {
  console.log('-------------------------------------------------------')
}

const getTeamGames = async (teamSlug) => {
  const url = `${BASE_URL}/Teams/${teamSlug}_Scores.htm`
  console.log(url)
  divider()
  console.log('=====================Getting Games=====================')

  const teamGames = []

  const html = await axios.get(url)
  const $ = await cheerio.load(html.data)

  rawSeasonRows = $('tr')
  console.log(`Seasons: ${seasonsList.length}`)
  console.log(`ScoreRows: ${rawSeasonRows.length}`)

  // console.log('rawSeasonRows:',(rawSeasonRows.length-9)/20)
  console.log(`=======================================================`)

  const games = []

  const c = 1

  for (season_group = 0; season_group < (rawSeasonRows.length - 9) / 20; season_group++) {
    for (let season_col = 1; season_col < 5; season_col++) {

      const season = parseInt($(
        $(rawSeasonRows[6 + season_group * 20 + 0]).find('td')[season_col]
      ).text())

      if(!isNaN(season)){

        teamName = cleanText(
          $($(rawSeasonRows[6 + season_group * 20 + 1]).find('td')[season_col]).text()
        )
        teamMascot = cleanText(
          $($(rawSeasonRows[6 + season_group * 20 + 2]).find('td')[season_col]).text()
        )

        const teamGames = {
          teamSlug,
          season,
          teamName,
          teamMascot
        }
        gamesData = []
        console.log(`Season: ${season}`)
        for(let week=1; week<21; week++){
          console.log(`[season_group: ${season_group}, season_col: ${season_col}, week: ${week}]`)
          const teamGameData = {}
          teamGameData.teamSlug = teamSlug
          teamGameData.season = season
          teamGameData.gameWeek = week


          console.log(`==> Week: ${week}`)
          console.log(teamGameData)

          divider()




        }
        console.log(`=======================================================`)
      }

    }
  }
}

const getTeamSeasons = async (teamSlug) => {
  const url = `${BASE_URL}/Teams/${teamSlug}_Standings.htm`
  const teamSeasons = []

  const html = await axios.get(url)
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

    teamSeasons.push(teamSeason)
  }

  divider()
  const teamGames = await getTeamGames(teamSlug, seasonsList)

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

  const html = await axios.get(`${BASE_URL}/Teams/index.htm`)
  // const html = await axios.get(`${BASE_URL}/Teams/Inactive.htm`)
  let $ = await cheerio.load(html.data)

  let teamsList = $('td[colspan=8] a')

  /* DELETE THIS! */
  for (let i = 0; i < 1 /* teamsList.length */; i++) {
    let teamData = []
    // const teamSlug = cleanText($(teamsList[i]).attr('href').split('.')[0])
    const teamSlug = `Aberdeen`

    teamData.teamSlug = teamSlug

    const schoolInfo = await getSchoolInfo(teamSlug)
    teamData.push(schoolInfo)

    const teamSeasons = await getTeamSeasons(teamSlug)
    teamData.push(teamSeasons)

    teams.push(teamData)
  }

}

getTeams()
