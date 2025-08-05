// /api/command.js (Finale Produktionsversion)

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
    // 1. Nur POST-Anfragen erlauben
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Only POST requests allowed' });
    }

    try {
        // 2. Benutzereingabe aus der Anfrage holen
        const { userInput } = request.body;
        if (!userInput) {
            return response.status(400).json({ error: 'Bitte geben Sie eine Anfrage ein.' });
        }

        // 3. Google AI initialisieren (mit dem jetzt korrekten API-Schlüssel)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // <-- Wichtige Korrektur!

        // 4. Das gewünschte Modell auswählen (wir nehmen das schnelle & moderne)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // 5. Den Prompt für die KI formulieren
        const prompt = `Du bist ein Experte für Shell-Befehle. Dein einziges Ziel ist es, eine JSON-Antwort zu generieren. Antworte NUR mit einem validen JSON-Objekt, das exakt folgendes Format hat: {"command": "der_befehl", "explanation": "eine_kurze_erklaerung"}. Die Anfrage des Benutzers lautet: "${userInput}"`;

        // 6. Die Anfrage an die KI senden
        const result = await model.generateContent(prompt);
        const geminiResponse = await result.response;
        const text = geminiResponse.text();

        // 7. Die saubere JSON-Antwort an das Frontend zurücksenden
        return response.status(200).json(JSON.parse(text));

    } catch (error) {
        // 8. Im Fehlerfall den genauen Fehler in den Vercel-Logs ausgeben
        console.error('Fehler in der API-Funktion:', error);
        return response.status(500).json({ error: 'Ein interner Serverfehler ist aufgetreten.' });
    }
}
