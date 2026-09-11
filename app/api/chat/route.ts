import { NextResponse } from "next/server";
import { ai } from "@/lib/gemini-client";
import { FunctionCallingConfigMode } from "@google/genai";
import {
  bookSearchDeclaration,
  presentRecommendationsDeclaration,
} from "@/lib/tools";
import { SYSTEM_INSTRUCTIONS } from "@/lib/prompts";
import { searchOpenLibrary } from "@/lib/openlibrary";
import { searchGoogleBooks } from "@/lib/googleBooks";
import type { Book, Message } from "@/types";

const MODEL_NAME = "gemini-3.5-flash-lite";
const MAX_TOOL_ROUNDS = 6;
const MAX_SEARCH_ROUNDS = 3;

const TOOLS = [
  {
    functionDeclarations: [
      bookSearchDeclaration,
      presentRecommendationsDeclaration,
    ],
  },
];

function normalizeKey(title: string, authors: string[]): string {
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  const normalizedAuthor = (authors[0] || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  return `${normalizedTitle}|${normalizedAuthor}`;
}

async function searchAllSources(query: string) {
  // Use Promise.allSettled to search both Google Books and Open Library concurrently
  const results = await Promise.allSettled([
    searchGoogleBooks({ query }),
    searchOpenLibrary({ query }),
  ]);

  const allBooks: Book[] = [];

  results.forEach((result, index) => {
    const sourceName = index === 0 ? "Google Books" : "Open Library";
    if (result.status === "fulfilled") {
      const books = result.value?.books ?? [];
      allBooks.push(
        ...books.map((b: any) => ({ ...b, source: b.source || sourceName })),
      );
    } else {
      console.error(`${sourceName} search failed:`, result.reason);
    }
  });

  return allBooks;
}
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
    const history = historyMessages.map((m: Message) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Step 3: create chat session
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        tools: TOOLS,
      },
    });

    // Step 4: send the latest message to Chat(first Gemini API call)
    let response = await chat.sendMessage({ message: latestUserMessage });

    // Keep the latest search result for the index reference for presentRecommendations
    let lastSearchResults: Book[] = [];
    const seenKeys = new Set<string>();
    let finalMarkdown: string | null = null;

    // Step 5: check if the response contains a function call
    let rounds = 0;
    let searchRounds = 0;
    while (
      response.functionCalls &&
      response.functionCalls.length > 0 &&
      rounds < MAX_TOOL_ROUNDS
    ) {
      rounds++;
      const call = response.functionCalls[0];

      console.log(`[round ${rounds}] model called → ${call.name}`, call.args);

      if (call.name === "searchBooks") {
        searchRounds++;
        const { query } = call.args as { query: string };
        const rawBooks = await searchAllSources(query);

        for (const book of rawBooks) {
          const dedupeKey = normalizeKey(book.title, book.authors || []);
          if (seenKeys.has(dedupeKey)) continue;
          seenKeys.add(dedupeKey);

          lastSearchResults.push({
            title: book.title,
            authors: book.authors,
            description: book.description
              ? book.description.substring(0, 150) + "..."
              : "",
            link: book.link,
            publishedDate: book.publishedDate,
            pageCount: book.pageCount,
            categories: book.categories,
            averageRating: book.averageRating,
            ratingsCount: book.ratingsCount,
            publisher: book.publisher,
            source: book.source,
          });
        }

        console.log(
          `[search round ${searchRounds}] found ${lastSearchResults.length} books in total`,
        );
        const reachedSearchLimit = searchRounds >= MAX_SEARCH_ROUNDS;

        // Send the processed result back to the model as a function response (second time Gemini API call)
        response = await chat.sendMessage({
          message: [
            {
              functionResponse: {
                name: call.name,
                response: { result: lastSearchResults },
              },
            },
          ],
          config: {
            tools: TOOLS,
            toolConfig: {
              functionCallingConfig: reachedSearchLimit
                ? {
                    mode: FunctionCallingConfigMode.ANY,
                    allowedFunctionNames: ["presentRecommendations"],
                  }
                : {
                    mode: FunctionCallingConfigMode.AUTO,
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

        const seenIndices = new Set<number>();
        const dedupedRecommendations = args.recommendations.filter((rec) => {
          if (seenIndices.has(rec.index)) return false;
          seenIndices.add(rec.index);
          return true;
        });

        const lines = dedupedRecommendations
          .map(({ index, blurb }) => {
            const book = lastSearchResults[index];
            if (!book) return null;

            const author = book.authors?.length
              ? book.authors.join(", ")
              : "Unknown Author";

            return `**${book.title}** by ${author}\n\n${blurb}\n\nMore info: [${book.title}](${book.link})`;
          })
          .filter(Boolean);

        const note =
          dedupedRecommendations.length < 3
            ? "\n\n_Note: I found fewer than 3 books that match your request._"
            : "";

        finalMarkdown =
          lines.length > 0
            ? lines.join("\n\n") + note
            : "Sorry, I couldn't find any books that match your request. Please try again with different keywords.";
        break;
      } else {
        console.warn(`Unexpected function call: ${call.name}`, call.args);
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
    console.error("Route error: ", {
      message: error.message,
      cause: error.cause,
    });
    if (
      error?.status === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 },
      );
    }
    if (
      error?.cause?.code === "UND_ERR_SOCKET" ||
      error?.message === "fetch failed"
    ) {
      return NextResponse.json(
        { error: "Network error. Please try again later." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
