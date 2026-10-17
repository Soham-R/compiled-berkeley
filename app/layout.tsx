import type { Metadata } from "next";
import { Andika, Baloo_2, Lexend } from "next/font/google";
import "./globals.css";

// Lexend is the body face; Baloo 2 is Mihika's display face; Andika is the
// letter face for text the kid reads. Same trio as "Alder Learning Tutor.html".
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const andika = Andika({
  variable: "--font-andika",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Alder",
  description: "A reading tutor that reads the room.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${baloo.variable} ${andika.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
