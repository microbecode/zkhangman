# zkhangman

A zero-knowledge proof-powered Hangman game that demonstrates how to use Zero Knowledge proofs for game verification. When you win the game, it generates a cryptographic proof that you correctly guessed the word without revealing what the word was.

## 🎯 What is zkhangman?

zkhangman is an educational project that combines:

- **Classic Hangman Game**: A familiar word-guessing game with a modern UI
- **Zero-Knowledge Proofs**: Cryptographic verification using Noir circuits
- **Real-time Verification**: Background proof generation and verification via [Horizen Labs API](https://horizenlabs.io/)

### How it Works

1. **Game Play**: You play Hangman normally, guessing letters to reveal a 7-letter word
2. **Proof Generation**: When you win, the app generates a zero-knowledge proof that you correctly guessed the word
3. **Verification**: The proof is submitted to a verification service to confirm your victory
4. **Privacy**: The proof proves you won without revealing the actual word

### Live Demo

🎮 **Play the game live**: [https://zkhangman.vercel.app/](https://zkhangman.vercel.app/)

## Local setup

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (for Noir circuit compilation)
- **Noir** (install via `curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash`)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd zkhangman
```

### 2. Circuit Setup

The Noir circuit verifies that your guessed word matches the target word:

```bash
cd circuit
nargo check
nargo compile
```

### 3. App Setup

```bash
cd app
npm i
```

### 4. Environment Variables

Create a `.env` file in the `app` directory:

```env
VITE_HORIZEN_API_KEY=your_horizen_api_key_here
```

Get your API key by talking with the people at [Horizen Labs](https://horizenlabs.io/).

### 5. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🎮 How to Play

1. **Start the Game**: The app randomly selects a 7-letter word from a tech-themed dictionary
2. **Guess Letters**: Click on the virtual keyboard to guess letters
3. **Win Condition**: Reveal all letters in the word before the hangman is complete
4. **Proof Generation**: Upon winning, a zero-knowledge proof is automatically generated
5. **Verification**: The proof is verified in the background using Horizen Labs API
6. **Continue Playing**: You can start a new game while verification runs in the background

## Technical Details

### Zero-Knowledge Proof Flow

1. **Witness Generation**: When you win, the app creates a witness with the target word and your guessed word
2. **Proof Creation**: Using the Noir circuit, a cryptographic proof is generated
3. **API Submission**: The proof is submitted to Horizen Labs verification service
4. **Background Verification**: The service verifies the proof without learning the word
5. **Result Display**: Verification results are shown via toast notifications

### Key Technologies

- **Frontend**: React + TypeScript + Vite
- **ZK Framework**: Noir (zero-knowledge circuit language)
- **Proof System**: UltraPlonk (via Aztec's bb.js)
- **Verification**: Horizen Labs API
- **Deployment**: Vercel

## 🌐 Deployment

The live version is deployed on [Vercel](https://vercel.com/) and available at:
**https://zkhangman.vercel.app/**

## 🔍 Verification Queue

The app includes a real-time verification queue that shows:

- **Proof Status**: Pending → Generating → Verifying → Completed/Failed
- **Word Information**: Which word was verified
- **Timestamps**: When each verification occurred
- **Toast Notifications**: Real-time updates on verification results

---

**Happy proving! 🎯🔐**
