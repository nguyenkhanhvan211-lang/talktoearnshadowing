import { connection } from "next/server";

import { isMockAi, runPractice } from "@/lib/ai";
import { practiceRequestSchema } from "@/lib/schemas";

export async function GET() {
  await connection();
  return Response.json({ mock: isMockAi() });
}

export async function POST(request: Request) {
  await connection();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Yêu cầu không đọc được." }, { status: 400 });
  }

  const parsed = practiceRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, message: "Thiếu phụ đề hoặc bản tóm tắt chưa đủ để xử lý." },
      { status: 400 },
    );
  }

  try {
    const result = await runPractice(parsed.data);
    return Response.json({ ok: true, mock: result.mock, data: result.data });
  } catch (error) {
    console.error("practice failed", error instanceof Error ? error.message : "unknown");
    return Response.json(
      {
        ok: false,
        message: "AI chưa trả lời được. Hãy thử lại. Khi chạy local không có AI Gateway, đặt MOCK_AI=1.",
      },
      { status: 502 },
    );
  }
}
