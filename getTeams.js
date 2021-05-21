const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const fs = require('fs')

const writeJson = () => {}

require('./aws')

const cleanText = (string) => {
  return string.replace('\n', '').replace('\r', '').replace('  ', ' ')
}

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

  console.log('-------------------------------------------------------')
  console.log(`______________________getTeamGame______________________`)

  const html = await axios.get(url)
  const $ = await cheerio.load(html.data)

  rawSeasonRows = $('tr')
  console.log(`Seasons: ${seasonsList.length}`)
  console.log(`ScoreRows: ${rawSeasonRows.length}`)
  console.log(`SeasonGroups: ${(rawSeasonRows.length - 9) / 20}`)

  console.log(`=======================================================`)

  const seasons = []

  for (let group = 0; group < (rawSeasonRows.length - 9) / 20; group++) {
    for (let szn = 1; szn < 5; szn++) {
      const team_season = {}

      teamSeason = parseInt(
        $($(rawSeasonRows[group * 20 + 6]).find('td')[szn]).text()
      )

      if (!isNaN(teamSeason)) {
        var result = teamSeasons.filter((obj) => {
          return obj.season === teamSeason
        })

        team_season.teamSeason = teamSeason

        console.log(teamSeason)

        team_season.teamSeasonName = cleanText(
          $($(rawSeasonRows[group * 20 + 7]).find('td')[szn]).text()
        )
        team_season.teamSeasonMascot = cleanText(
          $($(rawSeasonRows[group * 20 + 8]).find('td')[szn]).text()
        )
        team_season.teamSeasonDivision = result[0].division

        seasons.push(team_season)

        for (let gm_wk = 0; gm_wk < 16; gm_wk++) {
          const raw_game = []
          for (let c = 1; c <= 7; c++) {
            const cell_data = $(
              $(rawSeasonRows[group * 20 + 10 + gm_wk]).find('td')[
                c + (szn - 1) * 7
              ]
            ).text()
            raw_game.push(cell_data)
          }

          const team_game = {
            teamSlug,
            teamGameName: cleanText(
              $($(rawSeasonRows[group * 20 + 7]).find('td')[szn]).text()
            ),
            teamSeasonMascot: cleanText(
              $($(rawSeasonRows[group * 20 + 8]).find('td')[szn]).text()
            ),
            gameSeason: teamSeason,
            gameWeek: gm_wk + 1,
            gameDate: cleanText(raw_game[0]) == ' ' ? '' : cleanText(raw_game[0]),
            gameLoc:
              cleanText(raw_game[1]) == ' ' ? '' : cleanText(raw_game[1]),
            gameOpponent:
              cleanText(raw_game[2]) == ' ' ? '' : cleanText(raw_game[2]),
            gameDivision: cleanText(raw_game[3]) == ' ' ? false : true,
            gameResult:
              cleanText(raw_game[4]) == ' ' ? '' : cleanText(raw_game[4]),
            gamePF: parseInt(raw_game[5]),
            gamePA: parseInt(raw_game[6]),
          }
          if (
            team_game.gameOpponent !== '' &&
            team_game.gameOpponent !== 'open'
          ) {
            teamGames.push(team_game)
          }
        }
      }
    }
  }

  // convert JSON object to a string
  const seasonsData = JSON.stringify(seasons)

  fs.writeFile('data/seasons.json', seasonsData, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      // console.log(seasonsData)
      console.log(`File is written successfully!`)
    }
  })

  const gamesData = JSON.stringify(teamGames)

  fs.writeFile('data/games.json', gamesData, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      // console.log(gamesData)
      console.log(`File is written successfully!`)
    }
  })
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

  const html = await axios.get(`${BASE_URL}/Teams/${teamSlug}.htm`)
  const $ = await cheerio.load(html.data)

  schoolInfo.schoolAffiliation = cleanText($($(`td[colspan=56]`)[0]).text())
  schoolInfo.schoolTown = cleanText($($(`td[colspan=56]`)[1]).text()).split(
    ','
  )[0]
  schoolInfo.schoolCounty = cleanText($($(`td[colspan=56]`)[1]).text())
    .split(',')[1]
    .trim()
    .replace(' County', '')


 const schoolType = cleanText($($(`td[colspan=56]`)[2]).text())

  const paren = /\(/g
  if (schoolType.match(paren) != null) {
    schoolInfo.schoolDistrict = textBetweenParens(schoolType)
  }

  return schoolInfo
}

const getTeams = async () => {
  let teams = []

  const html = await axios.get(`${BASE_URL}/Teams/index.htm`)
  // const html = await axios.get(`${BASE_URL}/Teams/Inactive.htm`)
  let $ = await cheerio.load(html.data)

  let teamsList = $('td[colspan=8] a')

  const schoolsData = []

  /* DELETE THIS! */
  for (let i = 0; i < 10 /* teamsList.length */; i++) {
    let teamData = []
    const teamSlug = cleanText($(teamsList[i]).attr('href').split('.')[0])
    // const teamSlug = `Stone`

    const schoolInfo = await getSchoolInfo(teamSlug)
    schoolsData.push(schoolInfo)


    // const teamSeasons = await getTeamSeasons(teamSlug)
    // teamData.push(teamSeasons)


    teams.push(teamData)
  }

  const schools_data = JSON.stringify(schoolsData)

  fs.writeFile('data/schools.json', schools_data, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      console.log(schools_data)
      console.log(`File is written successfully!`)
    }
  })

}

getTeams()
