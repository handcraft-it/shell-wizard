// /api/command.js (Temporärer Diagnose-Code)

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
    // Temporär erlauben wir auch GET-Anfragen für die Diagnose
    if (request.method !== 'POST' && request.method !== 'GET') {
        return response.status(405).json({ message: 'Only POST and GET requests allowed' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

        // Temporäre Funktion: Liste alle verfügbaren Modelle auf
        const modelInfo = [];
        for await (const model of genAI.listModels()) {
            modelInfo.push({
                name: model.name,
                displayName: model.displayName,
                supportedGenerationMethods: model.supportedGenerationMethods,
            });
        }

        // Gib die Liste der Modelle als Antwort zurück
        return response.status(200).json(modelInfo);

    } catch (error) {
        console.error('Fehler beim Abrufen der Modell-Liste:', error);
        return response.status(500).json({ error: 'Ein interner Serverfehler ist aufgetreten.' });
    }
}
