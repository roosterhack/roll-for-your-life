import React, { useState, useEffect } from "react";
import { render } from "react-dom";
import axios from "axios";
import "./index.scss";

// ideas for improvment:

// - Using a context api and reducer (or redux) to manage game states for scalability and better state management.
// - Add more playfulness to the game to better provide user engagement. E.G.  animation on dice rolling, score added, winner celebrations etc..
// - Provided better error and loading state handling.
// - Testing cases:
//     - Check if the correct data is returning from the API
//     - Check if the first player goes first
//     - Check if players turn is correct, after one round and no player has reach the winning score, it should be player 1's turn again.
//     - Check all msg is display correctly, when a winner has assigned, after the post call to the API, a congrats message should be displayed.

const url = "http://localhost:8000/api/game";

const App = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState({});
  const [gameState, setGameState] = useState({});
  const [winner, setWinner] = useState({});
  const [submittedWinner, setSubmittedWinner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // create player obj
  const createPlayers = (playerArr) => {
    return playerArr.map((player) => {
      return {
        id: player.id,
        imageUrl: player.imageUrl,
        name: player.name,
        score: 0,
      };
    });
  };

  // get game info from api
  const getGameInfo = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(url);
      setPlayers(createPlayers(res.data?.players));
      setGameState({
        players: res.data?.players.length,
        whoseTurn: 0,
        gameOver: false,
        matchId: res.data?.matchId,
        scoreToWin: res.data?.scoreToWin,
      });

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setError(err);
      setIsLoading(false);
    }
  };

  // roll the dice
  const rollDice = () => Math.ceil(Math.random() * 6);

  // check player is a winner
  const checkWinner = (player) => {
    return player.score >= gameState.scoreToWin;
  };

  // check whose turn is it
  const handleTurn = (index) => {
    if (index < gameState.players - 1) {
      setCurrentPlayer(players[index + 1]);
    } else {
      setCurrentPlayer(players[0]);
    }
  };

  // handle someone who won
  const handleWinner = async (player) => {
    if (player) {
      setIsLoading(true);
      try {
        const res = await axios.post(url, {
          matchId: gameState.matchId,
          winnerId: player.id,
        });
        if (res.data.success) {
          setSubmittedWinner(true);
          setIsLoading(false);
        }
      } catch (err) {
        setError(err);
        console.log(err);
        setIsLoading(false);
      }
    }
  };

  // handle roll on click
  const handleRoll = (playerIndex) => {
    const dice = rollDice();
    setCurrentPlayer({
      ...currentPlayer,
      score: currentPlayer.score + dice,
    });
    players[playerIndex].score = players[playerIndex].score + dice;

    if (checkWinner(players[playerIndex])) {
      setWinner(players[playerIndex]);
      handleWinner(players[playerIndex]);
    } else {
      handleTurn(playerIndex);
    }
  };

  // reset the game
  const handleRestart = () => {
    setCurrentPlayer({});
    setPlayers([]);
    setGameState({});
    setWinner({});
    setSubmittedWinner(false);
    getGameInfo();
  };

  useEffect(() => {
    getGameInfo();
  }, []);

  // set the first player to start
  useEffect(() => {
    setCurrentPlayer(players[0]);
  }, [gameState]);

  const canShowPlayer = players && currentPlayer && !isLoading && !error;

  return (
    <div className="game">
      <div className="container">
        <div className="match-id">Match ID: {gameState.matchId}</div>
        <div className="main">
          <h1>Roll for your life</h1>
          <h4 className="score-to-win">
            Score to win <span>{gameState.scoreToWin}</span>
          </h4>

          {submittedWinner && (
            <div className="congrats">
              <h2>{winner.name}, you are the winner!!!</h2>
              <button onClick={handleRestart}>Play again?</button>
            </div>
          )}
        </div>
        {isLoading && <h2>Loading....</h2>}
        {error && <h2>Something went wrong sorry...</h2>}
        <div className="players">
          {canShowPlayer &&
            players.map((player, index) => {
              const isWinner = player.id === winner.id;
              const isDisabled = player.id !== currentPlayer.id || isWinner;

              return (
                <div
                  className={`player-card ${
                    !isDisabled && !isWinner && "active-player"
                  } ${isWinner && "winner"}`}
                  key={player.id}
                >
                  <div className="player-name-img-wrapper">
                    <span className="name">{player.name}</span>
                    <div className="avatar">
                      <img src={player.imageUrl} alt={player.name} />
                    </div>
                  </div>
                  <div className="score-wrapper">
                    <span className="score">
                      Score: <span>{player.score}</span>
                    </span>
                    <button
                      onClick={() => handleRoll(index)}
                      className="roll"
                      disabled={isDisabled}
                    >
                      Roll
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

render(<App />, document.getElementById("app"));
