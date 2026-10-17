import { generateParentNote } from "@/lib/parentNote";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { throughDay?: unknown; fresh?: unknown };
  const day = body.throughDay;
  if (!Number.isInteger(day) || (day as number) < 1 || (day as number) > 60) {
    return Response.json({ error: "throughDay must be an integer from 1 to 60" }, { status: 400 });
  }
  return Response.json(await generateParentNote(day as number, { fresh: body.fresh === true }));
}
