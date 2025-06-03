import { useState, useCallback } from 'react';
import './Hangman.css';

// List of words to guess
const WORDS = [

  'NOIR',

];

// Maximum number of incorrect guesses before game over
const MAX_WRONG_GUESSES = 6;

export function Hangman() {
  // Game state
  const [word, setWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  // Calculate number of wrong guesses
  const wrongGuesses = guessedLetters.filter(letter => !word.includes(letter)).length;

  // Check if game is over
  const isGameOver = wrongGuesses >= MAX_WRONG_GUESSES;
  const isWinner = word.split('').every(letter => guessedLetters.includes(letter));

  // Handle letter guess
  const handleGuess = useCallback((letter: string) => {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter)) return;

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    // Check if the new guess makes the player win
    const isNewWinner = word.split('').every(letter => newGuessedLetters.includes(letter));
    const isNewGameOver = newGuessedLetters.filter(letter => !word.includes(letter)).length >= MAX_WRONG_GUESSES;

    // Check game status
    if (isNewWinner) {
      setGameStatus('won');
    } else if (isNewGameOver) {
      setGameStatus('lost');
    }
  }, [guessedLetters, gameStatus, word]);

  // Reset game
  const resetGame = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessedLetters([]);
    setGameStatus('playing');
  };

  // Render the word with blanks and guessed letters
  const renderWord = () => {
    return word.split('').map((letter, index) => (
      <span key={index} className="letter">
        {guessedLetters.includes(letter) ? letter : '_'}
      </span>
    ));
  };

  // Render the hangman drawing
  const renderHangman = () => {
    return (
      <div className="hangman-drawing">
        {/* Base */}
        <div className="base" />
        {/* Vertical pole */}
        <div className="pole" />
        {/* Top beam */}
        <div className="beam" />
        {/* Rope */}
        <div className="rope" />
        {/* Head */}
        {wrongGuesses >= 1 && <div className="head" />}
        {/* Body */}
        {wrongGuesses >= 2 && <div className="body" />}
        {/* Left arm */}
        {wrongGuesses >= 3 && <div className="left-arm" />}
        {/* Right arm */}
        {wrongGuesses >= 4 && <div className="right-arm" />}
        {/* Left leg */}
        {wrongGuesses >= 5 && <div className="left-leg" />}
        {/* Right leg */}
        {wrongGuesses >= 6 && <div className="right-leg" />}
      </div>
    );
  };

  return (
    <div className="hangman-game">
      <h1>Hangman</h1>
      
      {renderHangman()}
      
      <div className="word-display">
        {renderWord()}
      </div>

      <div className="game-status">
        {gameStatus === 'won' && (
          <div className="message won">
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You saved the hangman! The word was: <strong>{word}</strong></p>
            <p>Want to try another word?</p>
          </div>
        )}
        {gameStatus === 'lost' && (
          <div className="message lost">
            <h2>💀 Game Over! 💀</h2>
            <p>The word was: <strong>{word}</strong></p>
            <p>Better luck next time!</p>
          </div>
        )}
        {(gameStatus === 'won' || gameStatus === 'lost') && (
          <button onClick={resetGame} className="reset-button">
            Play Again
          </button>
        )}
      </div>

      <div className="keyboard">
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
          <button
            key={letter}
            onClick={() => handleGuess(letter)}
            disabled={guessedLetters.includes(letter) || gameStatus !== 'playing'}
            className={`key ${guessedLetters.includes(letter) ? 'guessed' : ''}`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
} 