import { ai } from "@/lib/gemini-client";
import { NextResponse } from "next/server";
import { searchGoogleBooks } from "@/lib/tools";

export async function POST(req: Request){
  try{
    const { messages } = await req.json();
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config:{
        systemInstruction: "You're a helpful assistant that recommends books based on user preferences. When a user asks for book recommendations, make sure to use `searchGoogleBooks` function to fetch relevant books from Google Books API and provide the user with a list of recommended books. Each recommendation should include the book's title, author(s), description, and a link to more information."
      }
    });

   
  }catch(error){console.error(error)}
}
