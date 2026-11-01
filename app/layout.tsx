import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Talk to Earn — Luyện nói tiếng Anh",
  description:
    "Xem một video tiếng Anh ngắn, tóm tắt bằng lời của bạn, rồi nhận từ vựng, điểm CEFR, câu hỏi Bloom và gợi ý độ khó.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.className} h-full antialiased`}>
      <body className="min-h-full text-stone-900">{children}</body>
    </html>
  );
}
