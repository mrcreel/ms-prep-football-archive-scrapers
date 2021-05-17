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

const divider = async () => {
  console.log('-------------------------------------------------------')
}

const getTeamGames = async (teamSlug, teamSeasons) => {
  const url = `${BASE_URL}/Teams/${teamSlug}_Scores.htm`
  const teamGames = []

  divider()
  console.log('=====================Getting Games=====================')

  const html = await axios.get(url)
  const $ = await cheerio.load(html.data)

  rawSeasonRows = $('tr')
  console.log(`Seasons: ${seasonsList.length}`)
  console.log(`ScoreRows: ${rawSeasonRows.length}`)
  console.log(`SeasonGroups: ${(rawSeasonRows.length - 9) / 20}`)

  console.log(`=======================================================`)


  for(let group = 0; group < (rawSeasonRows.length - 9) / 20; group++){

    const team_season = {}

    for(let szn = 1; szn < 5; szn++){
      teamSeason = parseInt($($(rawSeasonRows[(group * 20) + 6]).find('td')[szn]).text())

      if(!isNaN(teamSeason)){

        var result = teamSeasons.filter(obj => {
          return obj.season === teamSeason
        })

        team_season.teamSeason = teamSeason
        team_season.teamSeasonName = cleanText($($(rawSeasonRows[(group * 20) + 7]).find('td')[szn]).text())
        team_season.teamSeasonMascot = cleanText($($(rawSeasonRows[(group * 20) + 8]).find('td')[szn]).text())
        team_season.teamSeasonDivision = result[0].division

        console.log(team_season)
        divider()

        for (let gm_wk = 0; gm_wk < 16; gm_wk++){

         const raw_game=[]
         for(let c = 1; c <=7; c++){
            const cell_data = $($(rawSeasonRows[(group * 20) + 10 + gm_wk]).find('td')[c + ((szn-1)*7)]).text()
            raw_game.push(cell_data)
          }

          const team_game = {
            teamSlug,
            teamGameName: cleanText($($(rawSeasonRows[(group * 20) + 7]).find('td')[szn]).text()),
            teamSeasonMascot: cleanText($($(rawSeasonRows[(group * 20) + 8]).find('td')[szn]).text()),
            gameSeason: teamSeason,
            gameWeek: gm_wk + 1,
            gameDate: cleanText(raw_game[0]),
            gameLoc: cleanText(raw_game[1]) == ' ' ? '' : cleanText(raw_game[1]),
            gameOpponent: cleanText(raw_game[2]) == ' ' ? '' : cleanText(raw_game[2]),
            gameDivision: cleanText(raw_game[3]) == ' ' ? false : true,
            gameResult: cleanText(raw_game[4]) == ' ' ? '' : cleanText(raw_game[4]),
            gamePF: parseInt(raw_game[5]),
            gamePA: parseInt(raw_game[6]),
          }
          if((team_game.gameOpponent !== '' && team_game.gameOpponent !== 'open' )){

            teamGames.push(team_game)

          }

        }

      }

    }
    // console.log(teamGames)



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
    teamSeason.season = parseInt(seasonsList[i])
    teamSeason.division = cleanText(divisionsList[i])

    teamSeasons.push(teamSeason)
  }

  divider()
  const teamGames = await getTeamGames(teamSlug, teamSeasons)

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
    const teamSlug = `Hickoryflat`

    teamData.teamSlug = teamSlug

    const schoolInfo = await getSchoolInfo(teamSlug)
    teamData.push(schoolInfo)

    const teamSeasons = await getTeamSeasons(teamSlug)
    teamData.push(teamSeasons)

    teams.push(teamData)
  }
}

getTeams()
