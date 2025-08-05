// /api/command.js (Fixed Version)
import { GoogleGenerativeAI } from "@google/generative-ai"

export default async function handler(request, response) {
  // Add CORS headers
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return response.status(200).end()
  }

  // 1. Only allow POST requests
  if (request.method !== "POST") {
    return response.status(405).json({ message: "Only POST requests allowed" })
  }

  try {
    // 2. Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY
    console.log("API Key exists:", !!apiKey)
    console.log("API Key length:", apiKey ? apiKey.length : 0)
    console.log("API Key starts with:", apiKey ? apiKey.substring(0, 10) + "..." : "undefined")

    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      return response.status(500).json({
        error: "API key not configured",
        debug: "GEMINI_API_KEY environment variable is missing",
      })
    }

    // 3. Get user input from request
    const { userInput } = request.body
    if (!userInput) {
      return response.status(400).json({ error: "Bitte geben Sie eine Anfrage ein." })
    }

    console.log("User input received:", userInput)

    // 4. Initialize Google AI with explicit error handling
    let genAI
    try {
      genAI = new GoogleGenerativeAI(apiKey)
      console.log("GoogleGenerativeAI initialized successfully")
    } catch (initError) {
      console.error("Failed to initialize GoogleGenerativeAI:", initError)
      return response.status(500).json({
        error: "Failed to initialize AI service",
        debug: initError.message,
      })
    }

    // 5. Get the model
    let model
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Use stable version
      console.log("Model initialized successfully")
    } catch (modelError) {
      console.error("Failed to get model:", modelError)
      return response.status(500).json({
        error: "Failed to get AI model",
        debug: modelError.message,
      })
    }

    // 6. Create the prompt
    const prompt = `Du bist ein Experte für Shell-Befehle. Dein einziges Ziel ist es, eine JSON-Antwort zu generieren. Antworte NUR mit einem validen JSON-Objekt, das exakt folgendes Format hat: {"command": "der_befehl", "explanation": "eine_kurze_erklaerung"}. Die Anfrage des Benutzers lautet: "${userInput}"`

    // 7. Send request to AI with timeout
    console.log("Sending request to Gemini...")
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 8000)),
    ])

    const geminiResponse = await result.response
    const text = geminiResponse.text()

    console.log("Gemini response received:", text)

    // 8. Parse and validate JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(text)

      // Validate the response structure
      if (!parsedResponse.command || !parsedResponse.explanation) {
        throw new Error("Invalid response structure")
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError)
      console.error("Raw response:", text)

      // Fallback response
      parsedResponse = {
        command: "echo 'Error parsing AI response'",
        explanation: "Die KI-Antwort konnte nicht verarbeitet werden.",
      }
    }

    // 9. Return clean JSON response
    return response.status(200).json(parsedResponse)
  } catch (error) {
    // 10. Detailed error logging
    console.error("Fehler in der API-Funktion:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)

    // Check for specific Google AI errors
    if (error.message && error.message.includes("API key not valid")) {
      return response.status(500).json({
        error: "API-Schlüssel ungültig",
        debug: "Please check your GEMINI_API_KEY in Vercel environment variables",
        suggestion: "Generate a new API key at https://aistudio.google.com/app/apikey",
      })
    }

    return response.status(500).json({
      error: "Ein interner Serverfehler ist aufgetreten.",
      debug: error.message,
    })
  }
}
