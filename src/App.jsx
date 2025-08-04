// src/App.jsx (Finale Version mit "Enter to Submit")

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [userInput, setUserInput] = useState('');
    const [command, setCommand] = useState('');
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        // Diese Funktion bleibt unverändert
        e.preventDefault();
        if (!userInput.trim()) return; // Verhindert leere Anfragen

        setIsLoading(true);
        setCommand('');
        setExplanation('');
        setError('');

        try {
            const response = await axios.post('/api/command', {
                userInput: userInput,
            });
            setCommand(response.data.command);
            setExplanation(response.data.explanation);
        } catch (err) {
            setError('Fehler beim Abrufen des Befehls. Server prüfen und erneut versuchen.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // === NEUE FUNKTION ===
    // Diese Funktion wird bei jedem Tastendruck in der Textarea aufgerufen.
    const handleKeyDown = (e) => {
      // Prüfen: Wurde die Enter-Taste gedrückt UND die Shift-Taste NICHT?
      if (e.key === 'Enter' && !e.shiftKey) {
        // 1. Verhindere das Standardverhalten (eine neue Zeile einfügen).
        e.preventDefault();
        // 2. Rufe die gleiche Funktion auf, als ob wir den Button geklickt hätten.
        handleSubmit(e);
      }
      // Wenn eine andere Taste gedrückt wird (oder Shift+Enter), passiert nichts
      // und die Standardaktion (z.B. neue Zeile bei Shift+Enter) wird ausgeführt.
    };

    return (
        <div className="App">
            <main className="main-content">
                <h1>
                    <span role="img" aria-label="Zauberstab">🪄</span> Shell Command Assistant
                </h1>
                <p className="subtitle">
                    Beschreiben Sie eine Aufgabe in natürlicher Sprache. Die KI generiert den passenden Terminal-Befehl für Sie.
                </p>

                <form onSubmit={handleSubmit} className="command-form">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        // === NEUE EIGENSCHAFT HINZUGEFÜGT ===
                        onKeyDown={handleKeyDown}
                        placeholder="z.B. 'Finde alle .log Dateien in diesem Ordner und lösche sie'"
                        rows="3"
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Generiere...' : 'Befehl generieren'}
                    </button>
                </form>

                {error && <p className="error-message">{error}</p>}

                {command && (
                    <div className="result-container">
                        <h3>Vorgeschlagener Befehl</h3>
                        <pre className="command-output">{command}</pre>

                        <h3>Erklärung</h3>
                        <p className="explanation-text">{explanation}</p>
                    </div>
                )}
            </main>

            <footer className="footer">
                Erstellt mit React & Google Gemini
            </footer>
        </div>
    );
}

export default App;
