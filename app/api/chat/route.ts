import { NextResponse } from "next/server";
import { ai } from "@/lib/gemini-client";
import { searchGoogleBooks, bookSearchDeclaration } from "@/lib/tools";
import { SYSTEM_INSTRUCTIONS } from "@/lib/prompts";

const MODEL_NAME = "gemini-3.5-flash-lite";

const MAX_TOOL_ROUNDS = 2


export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 },
      );
    }

    // Step 1: extract history and latest user message
    const historyMessages = messages.slice(0, -1);
    const latestUserMessage = messages[messages.length - 1].content;

    // format history messages
    const history = historyMessages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }),
    );

    // Step 2: create chat session
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        tools: [
          {
            functionDeclarations: [bookSearchDeclaration],
          },
        ],
      },
    });

    // Step 3: send the latest message to Chat
    let response = await chat.sendMessage({ message: latestUserMessage });

    // Step 4: check if the response contains a function call
     let rounds = 0;
    while (
      response.functionCalls &&
      response.functionCalls.length > 0 &&
      rounds < MAX_TOOL_ROUNDS
    ) {
      rounds++;
      const call = response.functionCalls[0];

      if (call.name === "searchGoogleBooks") {
        const fullResult = await searchGoogleBooks(
          call.args as { query: string },
        );

        let processedResult;
        if (Array.isArray(fullResult)) {
          processedResult = fullResult.slice(0, 3).map((book: any) => ({
            title: book.title,
            authors: book.authors,
            description: book.description
              ? book.description.substring(0, 180) + "..."
              : "",
            infoLink: book.infoLink,
          }));
        } else {
          processedResult = fullResult;
        }

        response = await chat.sendMessage({
          message: [
            {
              functionResponse: {
                name: call.name,
                response: { result: processedResult },
              },
            },
          ],
        });
        console.log(
          JSON.stringify(response.candidates?.[0]?.content?.parts, null, 2),
        );
      } else {
        
        break;
      }
    }
     const finalText =
       response.text ??
       response.candidates?.[0]?.content?.parts
         ?.filter((p: any) => p.text)
         .map((p: any) => p.text)
         .join("") ??
       "";
       console.log("=== FINAL TEXT ===", finalText);
    return NextResponse.json({ result: finalText });
  } catch (error: any) {
    console.error(error);
     if (error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
    return NextResponse.json(
      { error: "API quota exceeded. Please try again later." },
      { status: 429 },
    );
  }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
