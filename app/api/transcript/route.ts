import { extractYouTubeId } from "@/lib/transcript";
import { fetchYouTubeTitle, fetchYouTubeTranscript } from "@/lib/youtube";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Link không đọc được." }, { status: 400 });
  }

  const url =
    body && typeof body === "object" && "url" in body && typeof body.url === "string"
      ? body.url
      : "";
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return Response.json(
      { ok: false, message: "Chỉ nhận link YouTube (youtube.com, youtu.be hoặc shorts)." },
      { status: 400 },
    );
  }

  const title = await fetchYouTubeTitle(videoId);
  try {
    const transcript = await fetchYouTubeTranscript(videoId);
    return Response.json({ ok: true, videoId, title, transcript });
  } catch {
    return Response.json({
      ok: false,
      videoId,
      title,
      message: "Không lấy được phụ đề tự động. Hãy dán phụ đề tiếng Anh vào ô bên dưới.",
    });
  }
}
