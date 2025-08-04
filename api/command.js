 // /api/command.js (Die neue, korrekte Vercel-Funktion)

import { GoogleGenerativeAI } from "@google/generative-ai";

// Das ist die von Vercel erwartete Funktion.
// Sie nimmt eine Anfrage (request) und eine Antwort (response) entgegen.
export default async function handler(request, response) {
    // Wir erlauben nur POST-Anfragen
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Only POST requests allowed' });
    }

    try {
        const { userInput } = request.body;
        if (!userInput) {
            return response.status(400).json({ error: 'Bitte geben Sie eine Anfrage ein.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.0-pro",
        });

        const prompt = `Du bist ein Experte für Shell-Befehle... Antworte immer mit einem JSON-Objekt... Benutzeranfrage: "${userInput}"`;

        const result = await model.generateContent(prompt);
        const geminiResponse = await result.response;
        const text = geminiResponse.text();

        // Sende die erfolgreiche Antwort an das Frontend
        return response.status(200).json(JSON.parse(text));

    } catch (error) {
        // Logge den ECHTEN Fehler auf dem Server (dies wird jetzt in den Logs erscheinen!)
        console.error('Fehler in der API-Funktion:', error);

        // Sende eine generische Fehlermeldung an das Frontend
        return response.status(500).json({ error: 'Ein interner Serverfehler ist aufgetreten.' });
    }
}
