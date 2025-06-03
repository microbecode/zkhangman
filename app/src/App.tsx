import { useState, useRef } from 'react'
import { UltraHonkBackend } from '@aztec/bb.js'
import { Noir } from '@noir-lang/noir_js'
import circuit from "../circuit/target/circuit.json"
import './App.css'

function App(): JSX.Element {
  const [logs, setLogs] = useState<string[]>([])
  const [proof, setProof] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const ageInputRef = useRef<HTMLInputElement>(null)

  const addLog = (message: string): void => {
    setLogs(prev => [...prev, message])
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      setLogs([])
      setProof('')

      const noir = new Noir(circuit)
      const backend = new UltraHonkBackend(circuit.bytecode)
      const age = ageInputRef.current?.value

      if (!age) {
        throw new Error('Please enter an age')
      }

      addLog("Generating witness... ⏳")
      const { witness } = await noir.execute({ age })
      addLog("Generated witness... ✅")
      addLog("Generating proof... ⏳")
      const proofResult = await backend.generateProof(witness)
      addLog("Generated proof... ✅")
      setProof(proofResult.proof)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      addLog("Oh 💔")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="main">
      <h1>Noir app</h1>
      <div className="input-area">
        <input
          ref={ageInputRef}
          type="number"
          placeholder="Enter age"
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit Age'}
        </button>
      </div>
      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}
      <div className="outer">
        <div className="inner">
          <h2>Logs</h2>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
        <div className="inner">
          <h2>Proof</h2>
          {proof}
        </div>
      </div>
    </main>
  )
}

export default App 