const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// return all the players in the player table
app.get('/players/', async (request, response) => {
  const playerQuery = `
    SELECT * FROM player_details ORDER BY player_id;`
  const playerArray = await db.all(playerQuery)
  const changingSnakeCaseToCamelCase = dbObject => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    }
  }
  response.send(
    playerArray.map(eachPlayer => changingSnakeCaseToCamelCase(eachPlayer)),
  )
})

// return particular player by playerId
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId};`
  const playerArray = await db.get(playerQuery)
  const changingSnakeCaseToCamelCase = dbObject => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    }
  }
  response.send(changingSnakeCaseToCamelCase(playerArray))
})

// update the player details by playerId
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const playerName = playerDetails
  const playerQuery = `
    UPDATE player_details SET player_name='${playerName}'
    WHERE player_id=${playerId};`
  const playerArray = await db.run(playerQuery)
  response.send('Player Details Updated')
})

// returns match details of a specific match.
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const playerQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId};`
  const playerArray = await db.get(playerQuery)
  const changingSnakeCaseToCamelCase = dbObject => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    }
  }
  response.send(changingSnakeCaseToCamelCase(playerArray))
})

//
app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const query = `
  SELECT * FROM player_match_score NATURAL JOIN match_details
  WHERE player_id=${playerId};`
  const dbResponse = await db.all(query)
  const changingSnakeCaseToCamelCase = dbObject => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    }
  }
  response.send(
    dbResponse.map(eachMatch => changingSnakeCaseToCamelCase(eachMatch)),
  )
})

//
app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`
  const dbResponse = await db.all(getMatchPlayersQuery)
  response.send(dbResponse)
  // const changingSnakeCaseToCamelCase = dbObject => {
  //   return {
  //     playerId: dbObject.player_id,
  //     playerName: dbObject.player_name,
  //   }
  // }
  // response.send(
  //   dbResponse.map(eachMatch => changingSnakeCaseToCamelCase(eachMatch)),
  // )
})

//
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const dbResponse = await db.get(getPlayerScored)
  response.send(dbResponse)
})
module.exports = app
