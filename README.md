# Talk to Earn Shadowing

Luyện nói tiếng Anh theo kiểu **shadowing bằng bản tóm tắt**: xem một video ngắn, kể lại ý chính bằng lời của mình, rồi nhận từ vựng, điểm CEFR, câu hỏi Bloom và gợi ý bài tiếp theo.

Giao diện tiếng Việt. Nội dung học (phụ đề, từ, câu hỏi, bản tóm tắt mẫu) tiếng Anh. Không đăng nhập, không cơ sở dữ liệu, không lưu lịch sử. Bài làm chỉ nằm trên trình duyệt.

## Năm bước

1. **Nguồn.** Chọn một trong bốn bài VOA English in a Minute có sẵn, hoặc dán link YouTube. App hiện video và cố lấy phụ đề trên server. Nếu YouTube chặn phụ đề, học viên dán transcript. Sau đó tóm tắt bằng giọng nói (Web Speech API) hoặc gõ.
2. **Từ vựng.** 6–10 từ hoặc cụm, có giải thích Việt và Anh, câu ví dụ, nút nghe (`speechSynthesis`).
3. **Chấm điểm.** Mức CEFR A1–C2 và bốn điểm phụ: độ bao phủ nội dung, độ rộng, độ chính xác, trôi chảy và mạch lạc. Có nhận xét tiếng Việt và bản tóm tắt mẫu. **Chưa chấm phát âm.**
4. **Ôn tập.** Sáu câu theo thang Bloom (nhớ, hiểu, vận dụng, phân tích, đánh giá, sáng tạo), tính điểm và chuỗi đúng.
5. **Độ khó.** Gợi ý lên, giữ, hoặc hạ trình, kèm một bài tiếp theo cụ thể.

## Chạy local

```bash
npm install
MOCK_AI=1 npm run dev
```

`MOCK_AI=1` dùng phản hồi mẫu có nội dung thật cho bốn bài có sẵn, để luyện cả năm bước khi máy không có AI Gateway. Khi biến này không đặt, server gọi [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) qua AI SDK (`generateText` + `Output.object` và Zod).

Trên Vercel, đừng đặt `MOCK_AI`. Gateway xác thực bằng OIDC (`VERCEL_OIDC_TOKEN`), không cần API key trong code. Model mặc định là `google/gemini-2.5-flash` (có structured output trên catalog Gateway). Đổi bằng `AI_GATEWAY_MODEL` nếu cần.

## Kiểm tra

```bash
npm test
npm run lint
npm run build
```
