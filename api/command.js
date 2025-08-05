// /api/command.js (Fixed JSON Parsing)
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

    // 4. Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey)

    // 5. Define fallback models (in order of preference)
    const models = [
      "gemini-1.5-flash-8b", // Fastest, least likely to be overloaded
      "gemini-1.5-flash", // Your original choice
      "gemini-1.5-pro", // More powerful but slower
    ]

    // 6. Create the prompt with clearer instructions
    const prompt = `Du bist ein Experte für Shell-Befehle. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt ohne jegliche Markdown-Formatierung oder Code-Blöcke. Das JSON-Objekt muss exakt folgendes Format haben:

{"command": "der_shell_befehl", "explanation": "eine_kurze_erklaerung"}

Anfrage des Benutzers: "${userInput}"

Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Zeichen oder Formatierung.`

    // 7. Try each model with retry logic
    let lastError = null

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const modelName = models[modelIndex]
      console.log(`Trying model: ${modelName}`)

      try {
        const model = genAI.getGenerativeModel({ model: modelName })

        // Try with retries for this model
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Attempt ${attempt} with ${modelName}`)

            const result = await Promise.race([
              model.generateContent(prompt),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 8000)),
            ])

            const geminiResponse = await result.response
            const text = geminiResponse.text()

            console.log("Success! Gemini response received:", text.substring(0, 200) + "...")

            // 8. Parse and validate JSON response with improved handling
            let parsedResponse
            try {
              let cleanText = text.trim()

              // Remove markdown code blocks if present
              if (cleanText.startsWith("```json")) {
                cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
              } else if (cleanText.startsWith("```")) {
                cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "")
              }

              console.log("Cleaned text for parsing:", cleanText)

              parsedResponse = JSON.parse(cleanText)

              // Validate the response structure
              if (!parsedResponse.command || !parsedResponse.explanation) {
                throw new Error("Invalid response structure")
              }

              console.log("Successfully parsed response:", parsedResponse)
            } catch (parseError) {
              console.error("Failed to parse Gemini response:", parseError)
              console.error("Raw response:", text)

              // Try to extract JSON manually as fallback
              try {
                const jsonMatch = text.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                  parsedResponse = JSON.parse(jsonMatch[0])
                  console.log("Fallback parsing successful:", parsedResponse)

                  // Validate fallback response
                  if (!parsedResponse.command || !parsedResponse.explanation) {
                    throw new Error("Invalid fallback response structure")
                  }
                } else {
                  throw new Error("No JSON found in response")
                }
              } catch (fallbackError) {
                console.error("Fallback parsing also failed:", fallbackError)

                // Final fallback response
                parsedResponse = {
                  command: "echo 'Error parsing AI response'",
                  explanation: "Die KI-Antwort konnte nicht verarbeitet werden.",
                }
              }
            }

            // 9. Return successful response
            return response.status(200).json({
              ...parsedResponse,
              model_used: modelName,
              attempt: attempt,
            })
          } catch (attemptError) {
            console.error(`Attempt ${attempt} failed with ${modelName}:`, attemptError.message)
            lastError = attemptError

            // If it's a 503 (overloaded), wait before retry
            if (attemptError.message && attemptError.message.includes("503")) {
              console.log(`Waiting 2 seconds before retry...`)
              await new Promise((resolve) => setTimeout(resolve, 2000))
            }
          }
        }

        console.log(`All attempts failed for ${modelName}, trying next model...`)
      } catch (modelError) {
        console.error(`Failed to initialize model ${modelName}:`, modelError)
        lastError = modelError
      }
    }

    // 10. If all models and retries failed
    console.error("All models and retries failed. Last error:", lastError)

    // Check for specific error types
    if (lastError && lastError.message && lastError.message.includes("503")) {
      return response.status(503).json({
        error: "Der AI-Service ist momentan überlastet",
        debug: "All Gemini models are currently overloaded. Please try again in a few minutes.",
        suggestion: "Versuchen Sie es in ein paar Minuten erneut.",
        retry_after: 60, // seconds
      })
    }

    return response.status(500).json({
      error: "Ein interner Serverfehler ist aufgetreten.",
      debug: lastError ? lastError.message : "Unknown error",
    })
  } catch (error) {
    // 11. Catch-all error handling
    console.error("Fehler in der API-Funktion:", error)
    return response.status(500).json({
      error: "Ein interner Serverfehler ist aufgetreten.",
      debug: error.message,
    })
  }
}
