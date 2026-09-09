import { NextResponse } from "next/server";
import { ai } from "@/lib/gemini-client";
import {
  FunctionDeclaration,
  Type,
  FunctionCallingConfigMode,
} from "@google/genai";
import {
  searchGoogleBooks,
  bookSearchDeclaration,
  presentRecommendationsDeclaration,
} from "@/lib/tools";
import { SYSTEM_INSTRUCTIONS } from "@/lib/prompts";

const MODEL_NAME = "gemini-3.5-flash-lite";
const MAX_TOOL_ROUNDS = 4;

type Book = {
  title: string;
  authors?: string[];
  description?: string;
  link?: string;
};

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

    // Step 2: format history messages
    const history = historyMessages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }),
    );

    // Step 3: create chat session
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        tools: [
          {
            functionDeclarations: [
              bookSearchDeclaration,
              presentRecommendationsDeclaration,
            ],
          },
        ],
      },
    });

    // Step 4: send the latest message to Chat(first Gemini API call)
    let response = await chat.sendMessage({ message: latestUserMessage });

    // Keep the latest search result for the index reference for presentRecommendations
    let lastSearchResults: Book[] = [];
    let finalMarkdown: string | null = null;

    // Step 5: check if the response contains a function call
    let rounds = 0;
    while (
      response.functionCalls &&
      response.functionCalls.length > 0 &&
      rounds < MAX_TOOL_ROUNDS
    ) {
      rounds++;
      const call = response.functionCalls[0];
      console.log(`[round ${rounds}] model called → ${call.name}`, call.args);

      if (call.name === "searchGoogleBooks") {
        const fullResult = await searchGoogleBooks(
          call.args as { query: string },
        );
        console.log("fullResult 型別:", Array.isArray(fullResult), fullResult);
        const rawBooks = fullResult?.books ?? [];

        const processedResult: Book[] = rawBooks
          .slice(0, 20)
          .map((book: any) => ({
            title: book.title,
            authors: book.authors,
            description: book.description
              ? book.description.substring(0, 180) + "..."
              : "",
            link: book.link,
          }));

        lastSearchResults = processedResult;

        // Send the processed result back to the model as a function response (second time Gemini API call)
        response = await chat.sendMessage({
          message: [
            {
              functionResponse: {
                name: call.name,
                response: { result: processedResult },
              },
            },
          ],
          config: {
            tools: [
              {
                functionDeclarations: [
                  bookSearchDeclaration,
                  presentRecommendationsDeclaration,
                ],
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.ANY,
                allowedFunctionNames: ["presentRecommendations"],
              },
            },
          },
        });
      } else if (call.name === "presentRecommendations") {
        const args = call.args as {
          recommendations: { index: number; blurb: string }[];
        };
         if (!args.recommendations || args.recommendations.length === 0) {
           finalMarkdown =
             "Sorry, I couldn't find any books that match your request. Please try again with different keywords.";
           break;
         }

        const lines = args.recommendations
          .map(({ index, blurb }) => {
            const book = lastSearchResults[index];
            if (!book) return null;

            const author = book.authors?.length
              ? book.authors.join(", ")
              : "Unknown Author";

            return `**${book.title}** by ${author}\n\n${blurb}\n\nMore info: [${book.title}](${book.link})`;
          })
          .filter(Boolean);
        finalMarkdown = lines.length > 0 ? lines.join("\n\n") : "Sorry, I couldn't find any books that match your request. Please try again with different keywords.";
        break;
      } else {
        break;
      }
    }
    const finalText =
      finalMarkdown ??
      response.text ??
      response.candidates?.[0]?.content?.parts
        ?.filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join("") ??
      "";

    return NextResponse.json({ result: finalText });
  } catch (error: any) {
    console.error(error);
    if (
      error?.status === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
