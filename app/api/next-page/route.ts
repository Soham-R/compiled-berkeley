import { generateNextPage } from "@/lib/nextPage";
import type { NextPageRequest } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as NextPageRequest;
  return Response.json(await generateNextPage(body));
}
