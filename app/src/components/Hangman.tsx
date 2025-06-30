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

// Interface for verification queue items
interface VerificationItem {
  id: string;
  word: string;
  status: "pending" | "generating" | "verifying" | "completed" | "failed";
  message: string;
  timestamp: Date;
}

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

  // Background verification queue
  const [verificationQueue, setVerificationQueue] = useState<
    VerificationItem[]
  >([]);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" }>
  >([]);

  // Calculate number of wrong guesses
  const wrongGuesses = guessedLetters.filter(
    (letter) => !word.includes(letter)
  ).length;

  // Add toast notification
  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Generate proof that the word was correctly guessed
  const generateProof = async (targetWord: string) => {
    const verificationId = Date.now().toString();

    // Add to verification queue
    const newVerificationItem: VerificationItem = {
      id: verificationId,
      word: targetWord,
      status: "pending",
      message: "Queued for verification",
      timestamp: new Date(),
    };

    setVerificationQueue((prev) => [...prev, newVerificationItem]);

    // Start background verification
    verifyProofInBackground(verificationId, targetWord);
  };

  // Background verification function
  const verifyProofInBackground = async (
    verificationId: string,
    targetWord: string
  ) => {
    try {
      // Update status to generating
      setVerificationQueue((prev) =>
        prev.map((item) =>
          item.id === verificationId
            ? { ...item, status: "generating", message: "Generating proof..." }
            : item
        )
      );

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

      // Update status to verifying
      setVerificationQueue((prev) =>
        prev.map((item) =>
          item.id === verificationId
            ? { ...item, status: "verifying", message: "Verifying proof..." }
            : item
        )
      );

      const verificationResult = await verifyProof(
        proofResult,
        vk,
        (status) => {
          setVerificationQueue((prev) =>
            prev.map((item) =>
              item.id === verificationId ? { ...item, message: status } : item
            )
          );
        }
      );

      // Update final status
      const finalStatus = verificationResult.success ? "completed" : "failed";
      const finalMessage = verificationResult.success
        ? "✅ Verification complete!"
        : `❌ ${verificationResult.status}`;

      setVerificationQueue((prev) =>
        prev.map((item) =>
          item.id === verificationId
            ? { ...item, status: finalStatus, message: finalMessage }
            : item
        )
      );

      // Show toast notification
      if (verificationResult.success) {
        addToast(`Verification succeeded for "${targetWord}"! 🎉`, "success");
      } else {
        addToast(`Verification failed for "${targetWord}"`, "error");
      }
    } catch (err) {
      console.error("Error in background verification:", err);

      setVerificationQueue((prev) =>
        prev.map((item) =>
          item.id === verificationId
            ? { ...item, status: "failed", message: "❌ Error occurred" }
            : item
        )
      );

      addToast(`Verification error for "${targetWord}"`, "error");
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
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase());
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
              <p>
                Proof queued for background verification - you can continue
                playing!
              </p>
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
          <button onClick={resetGame} className="reset-button">
            Play Again
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

      {/* Verification Queue */}
      {verificationQueue.length > 0 && (
        <div className="verification-queue">
          <h3>🔍 Verification Queue</h3>
          <div className="queue-items">
            {verificationQueue
              .slice()
              .reverse()
              .map((item) => (
                <div key={item.id} className={`queue-item ${item.status}`}>
                  <div className="queue-item-header">
                    <span className="word">{item.word}</span>
                    <span className="status">{item.status}</span>
                  </div>
                  <div className="queue-item-message">{item.message}</div>
                  <div className="queue-item-time">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
