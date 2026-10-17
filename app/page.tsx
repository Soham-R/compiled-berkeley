import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold">Wren</h1>
      <nav className="flex gap-6 text-xl underline underline-offset-4">
        <Link href="/read">Read</Link>
        <Link href="/parent">Parent view</Link>
      </nav>
    </main>
  );
}
