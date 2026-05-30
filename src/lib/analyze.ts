import type { Schedule } from "../types";

const PROMPT = `이 승무원 월간 스케줄 캘린더를 schedule.json 의 months 배열 한 객체로 변환해줘.
JSON만 출력 — 코드펜스·설명 없이, 객체 하나만.
규칙:
- 이미지 상단에서 연월(YYYY-MM)을 읽어 month 필드에 넣는다.
- 비행 블록 날짜 칸 기준으로 date/arrDate 채움. 다음 칸 넘어가면 arrDate=+1일.
- 빈 칸(아무 표시 없음)은 대기 — trips/offDays/education 어디에도 넣지 않음.
- 국내선(GMP·CJU·PUS·USN·TAE 등)=domestic, EDU=education, ADO/ATDO/PDO/휴무=offDays.
- 국제선: long(미주·유럽·대양주)/mid(동남아·중동)/short(일본·중국·괌).
- 출발 21:00 이후면 redeye:true. 편명 KExxxx 유지, 불명확하면 null.
- leg마다 block(비행시간, 분) 포함. 공항코드는 IATA 표준.
- destination.city는 한국어, country는 ISO-2 코드.`;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export async function analyzeImage(file: File, apiKey: string): Promise<Schedule> {
  const b64 = await fileToBase64(file);
  const mimeType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } },
            { type: "text", text: PROMPT }
          ]
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Anthropic API ${res.status}`);
  }

  const body = await res.json() as { content: { type: string; text: string }[] };
  const text = body.content?.find(b => b.type === "text")?.text ?? "";
  if (!text) throw new Error("빈 응답");

  const jsonText = extractJson(text);
  let schedule: Schedule;
  try {
    schedule = JSON.parse(jsonText) as Schedule;
  } catch {
    throw new Error(`JSON 파싱 실패 — 응답: ${text.slice(0, 120)}`);
  }
  if (!schedule.month) throw new Error("month 필드 없음");
  return schedule;
}
