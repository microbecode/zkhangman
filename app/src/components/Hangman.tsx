import { useState, useCallback, useEffect } from "react";
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import circuit from "../../public/circuit.json";
/* import vk from '../../public/vk';
import vkey from '../../public/vkey.json'; */
import "./Hangman.css";
import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import fs from "fs";

// List of words to guess
const WORDS = ["NOIR"];

// Maximum number of incorrect guesses before game over
const MAX_WRONG_GUESSES = 6;

export function Hangman() {
  // Game state
  const [word, setWord] = useState(
    () => WORDS[Math.floor(Math.random() * WORDS.length)]
  );
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [proof, setProof] = useState<string>("");
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const doit = async () => {
      async () => {
        const bufvk = fs.readFileSync("../../public/vk");
        /* const bufproof = fs.readFileSync("../target/proof");
const base64Proof = bufproof.toString("base64"); */
        const base64Vk = bufvk.toString("base64");

        const session = await zkVerifySession
          .start()
          .Volta()
          .withAccount("seed-phrase");
        //const vkey2 = fs.readFileSync(vkey);
        const vkey = fs.readFileSync("../../public/vkey.json");

        session.subscribe([
          {
            event: ZkVerifyEvents.NewAggregationReceipt,
            callback: async (eventData: any) => {
              console.log("New aggregation receipt:", eventData);
              /*   let statementpath = await session.getAggregateStatementPath(
            eventData.blockHash,
            parseInt(eventData.data.domainId),
            parseInt(eventData.data.aggregationId),
            statement
          );
          console.log("Statement path:", statementpath);
          const statementproof = {
            ...statementpath,
            domainId: parseInt(eventData.data.domainId),
            aggregationId: parseInt(eventData.data.aggregationId),
          };
          // fs.writeFile("aggregation.json", JSON.stringify(statementproof));
          console.log("aggregation", JSON.stringify(statementproof)); */
            },
            options: { domainId: 0 },
          },
        ]);
      };
    };

    doit();
  }, []);

  // Calculate number of wrong guesses
  const wrongGuesses = guessedLetters.filter(
    (letter) => !word.includes(letter)
  ).length;

  // Generate proof that the word was correctly guessed
  const generateProof = async (targetWord: string) => {
    try {
      setIsGeneratingProof(true);
      setError(null);

      const noir = new Noir(circuit);
      const backend = new UltraHonkBackend(circuit.bytecode);

      // Convert words to byte arrays
      const targetWordBytes = new Array(10).fill(0);
      const guessedWordBytes = new Array(10).fill(0);

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

      // Convert proof to hex string for display
      const proofHex = Buffer.from(proofResult.proof).toString("hex");
      setProof(proofHex);

      // Verify the proof
      const isValid = await backend.verifyProof(
        proofResult.proof,
        vkey.verification_key
      );
      if (!isValid) {
        throw new Error("Proof verification failed");
      }
    } catch (err) {
      console.error("Error generating proof:", err);
      setError(err instanceof Error ? err.message : "Failed to generate proof");
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
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessedLetters([]);
    setGameStatus("playing");
    setProof("");
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
            {isGeneratingProof ? (
              <p>Generating proof... ⏳</p>
            ) : error ? (
              <p className="error">Error generating proof: {error}</p>
            ) : proof ? (
              <div className="proof-container">
                <h3>🎯 Zero Knowledge Proof</h3>
                <p>You've proven you know the word without revealing it!</p>
                <div className="proof">{proof}</div>
              </div>
            ) : null}
            <p>Want to try another word?</p>
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
    </div>
  );
}
