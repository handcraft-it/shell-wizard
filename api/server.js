// api/server.js (Version für Vercel)

// WICHTIG: Das Express-Paket muss im Frontend installiert sein
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// HINWEIS: dotenv und cors werden nicht mehr benötigt.
// Vercel behandelt Umgebungsvariablen und CORS-Header anders.

const app = express();

// Middleware
app.use(express.json());

// Google AI Client initialisieren
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// API-Endpunkt definieren
app.post('/api/command', async (req, res) => {
    try {
        const { userInput } = req.body;
        if (!userInput) {
            return res.status(400).json({ error: 'Bitte geben Sie eine Anfrage ein.' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: { response_mime_type: "application/json" }
        });

        const prompt = `Du bist ein Experte für Shell-Befehle... Antworte immer mit einem JSON-Objekt... Benutzeranfrage: "${userInput}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // CORS-Header manuell setzen für die Entwicklung (Vercel macht das im Produktivbetrieb automatisch)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        res.json(JSON.parse(text));
    } catch (error) {
        console.error('Fehler bei der Anfrage an Google AI:', error);
        res.status(500).json({ error: 'Ein Fehler ist auf dem Server aufgetreten.' });
    }
});

// WICHTIG: Die app.listen Zeile wird entfernt. Vercel startet den Server selbst.
// Exportieren der App für Vercel
module.exports = app;
