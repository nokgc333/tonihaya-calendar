import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tonihaya-calendar — とにかく速い12ヶ月カレンダー",
  description:
    "12ヶ月を一望できる、とにかく速いカレンダー。六曜・祝日・和風月名・遊びセクション・時間計算を備えた高速ビューアー。",
  openGraph: {
    title: "tonihaya-calendar",
    description: "とにかく速い12ヶ月俯瞰カレンダー",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
