// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { searchGoogleBooks, bookSearchDeclaration } from "@/lib/tools";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Step 1: Generate initial response from Gemini
    let response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction:
          "You're a helpful assistant that recommends books based on user preferences. When a user asks for book recommendations, make sure to use `searchGoogleBooks` function to fetch relevant books from Google Books API.",
        tools: [
          {
            functionDeclarations: [bookSearchDeclaration],
          },
        ],
      },
    });

    // Step 2: Check if the model has emitted a function call request (functionCalls)
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      // Step 3: Execute the corresponding tool locally
      let functionResult;
      if (call.name === "searchGoogleBooks") {
        functionResult = await searchGoogleBooks(
          call.args as { query: string },
        );
      }

      // Step 4: Update the conversation history with the function call and result
      const updatedContents = [
        ...contents,
        response.candidates![0].content, // include the original functionCall response from Gemini
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: functionResult,
              },
            },
          ],
        },
      ];

      // Step 5: Send the updated conversation history back to Gemini for the final recommendation
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: updatedContents,
      });
    }

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
