// app/api/test-search/route.ts
import { NextResponse } from "next/server";
import { searchGoogleBooks } from "@/lib/googleBooks";
import { searchOpenLibrary } from "@/lib/openlibrary";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source"); // "google" or "openlibrary"
  const query = searchParams.get("q") || "classic science fiction";

  const result =
    source === "openlibrary"
      ? await searchOpenLibrary({ query })
      : await searchGoogleBooks({ query });

  return NextResponse.json(result);
}
