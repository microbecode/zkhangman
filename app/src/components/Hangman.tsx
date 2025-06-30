import { useState, useCallback } from "react";
import { Noir } from "@noir-lang/noir_js";
import { UltraPlonkBackend } from "@aztec/bb.js";
import circuit from "../circuit.json";
import "./Hangman.css";
import { verifyProof } from "../verify";
import { WORDS } from "../words";

export const WORD_LENGTH = 7;

// Maximum number of incorrect guesses before game over
const MAX_WRONG_GUESSES = 6;

export function Hangman() {
  // Game state
  const [word, setWord] = useState(() =>
    WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase()
  );
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );

  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Calculate number of wrong guesses
  const wrongGuesses = guessedLetters.filter(
    (letter) => !word.includes(letter)
  ).length;

  // Generate proof that the word was correctly guessed
  const generateProof = async (targetWord: string) => {
    try {
      setIsGeneratingProof(true);
      setError(null);
      setVerificationStatus("Generating proof...");

      const noir = new Noir(circuit as any);
      const backend = new UltraPlonkBackend(circuit.bytecode);

      // Convert words to byte arrays
      const targetWordBytes = new Array(WORD_LENGTH).fill(0);
      const guessedWordBytes = new Array(WORD_LENGTH).fill(0);

      for (let i = 0; i < targetWord.length; i++) {
        targetWordBytes[i] = targetWord.charCodeAt(i);
        guessedWordBytes[i] = targetWord.charCodeAt(i); // Since we won, guessed word = target word
      }

      // Generate witness
      const { witness } = await noir.execute({
        target_word: targetWordBytes,
        guessed_word: guessedWordBytes,
      });

      // Generate proof
      const proofResult = await backend.generateProof(witness);

      const vk = await backend.getVerificationKey();

      const verificationResult = await verifyProof(proofResult, vk, (status) =>
        setVerificationStatus(status)
      );

      if (verificationResult.success) {
        setVerificationStatus("✅ Verification ready!");
      } else {
        setVerificationStatus(`❌ ${verificationResult.status}`);
      }
    } catch (err) {
      console.error("Error generating proof:", err);
      setError(err instanceof Error ? err.message : "Failed to generate proof");
      setVerificationStatus("❌ Error occurred");
    } finally {
      setIsGeneratingProof(false);
    }
  };

  // Handle letter guess
  const handleGuess = useCallback(
    (letter: string) => {
      if (gameStatus !== "playing" || guessedLetters.includes(letter)) return;

      const newGuessedLetters = [...guessedLetters, letter];
      setGuessedLetters(newGuessedLetters);

      // Check if the new guess makes the player win
      const isNewWinner = word
        .split("")
        .every((letter) => newGuessedLetters.includes(letter));
      const isNewGameOver =
        newGuessedLetters.filter((letter) => !word.includes(letter)).length >=
        MAX_WRONG_GUESSES;

      // Check game status
      if (isNewWinner) {
        setGameStatus("won");
        generateProof(word);
      } else if (isNewGameOver) {
        setGameStatus("lost");
      }
    },
    [guessedLetters, gameStatus, word]
  );

  // Reset game
  const resetGame = () => {
    // Don't allow reset while verification is in progress
    if (
      isGeneratingProof ||
      (verificationStatus &&
        !verificationStatus.includes("✅") &&
        !verificationStatus.includes("❌"))
    ) {
      return;
    }

    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessedLetters([]);
    setGameStatus("playing");
    setVerificationStatus("");
    setError(null);
  };

  // Render the word with blanks and guessed letters
  const renderWord = () => {
    return word.split("").map((letter, index) => (
      <span key={index} className="letter">
        {guessedLetters.includes(letter) ? letter : "_"}
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
        <div className="ropenoose" />
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

      <div className="word-display">{renderWord()}</div>

      <div className="game-status">
        {gameStatus === "won" && (
          <div className="message won">
            <h2>🎉 Congratulations! 🎉</h2>
            <p>
              You saved the hangman! The word was: <strong>{word}</strong>
            </p>
            <div className="verification-status">
              <h3>🔐 Zero Knowledge Verification</h3>
              {verificationStatus ? (
                <p className="status-message">{verificationStatus}</p>
              ) : (
                <p>Proving you know the word without revealing it...</p>
              )}
              {error && <p className="error">Error: {error}</p>}
            </div>
          </div>
        )}
        {gameStatus === "lost" && (
          <div className="message lost">
            <h2>💀 Game Over! 💀</h2>
            <p>
              The word was: <strong>{word}</strong>
            </p>
            <p>Better luck next time!</p>
          </div>
        )}
        {(gameStatus === "won" || gameStatus === "lost") && (
          <button
            onClick={resetGame}
            className={`reset-button ${
              isGeneratingProof ||
              (verificationStatus &&
                !verificationStatus.includes("✅") &&
                !verificationStatus.includes("❌"))
                ? "disabled"
                : ""
            }`}
            disabled={
              isGeneratingProof ||
              Boolean(
                verificationStatus &&
                  !verificationStatus.includes("✅") &&
                  !verificationStatus.includes("❌")
              )
            }
          >
            {isGeneratingProof ||
            (verificationStatus &&
              !verificationStatus.includes("✅") &&
              !verificationStatus.includes("❌"))
              ? "⏳ Please wait..."
              : "Play Again"}
          </button>
        )}
      </div>

      <div className="keyboard">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
          <button
            key={letter}
            onClick={() => handleGuess(letter)}
            disabled={
              guessedLetters.includes(letter) || gameStatus !== "playing"
            }
            className={`key ${
              guessedLetters.includes(letter) ? "guessed" : ""
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
