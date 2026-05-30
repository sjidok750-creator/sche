import type { Schedule } from "../types";

const PROMPT = `이 승무원 월간 스케줄 캘린더 이미지를 schedule.json 의 months 배열 한 객체로 변환해줘.
JSON만 출력 — 코드펜스, 설명, 머리말 없이. 객체 하나만.
규칙:
- 이미지 상단에서 연월(YYYY-MM)을 읽어 month 필드에 넣는다.
- 비행 블록이 놓인 날짜 칸 기준으로 date/arrDate 채움. 다음 칸 넘어가면 arrDate = +1일.
- 빈 칸(아무 블록 없음) = 대기(standby) — trips/offDays/education 어디에도 넣지 않음.
- 국내선(GMP/CJU/PUS/USN/TAE 등 국내공항 간) = category:"domestic".
- EDU 블록 = education 배열.
- ADO/ATDO/PDO/휴무 = offDays 배열.
- 국제선 거리: long(미주·유럽·대양주) / mid(동남아·중동) / short(일본·중국·괌).
- 출발 21:00 이후 또는 야간편이면 redeye:true.
- 편명 KExxxx 그대로. 불명확하면 null.
- 공항코드는 IATA 표준. destination.city/country는 한국어 도시명, ISO-2 국가코드.
- leg마다 block 필드(비행시간, 분)를 계산해서 포함한다.
- layover.nights = 연박 합산.
스키마 예시:
{
  "month":"YYYY-MM","homeBase":"ICN",
  "trips":[{"id":"...","category":"long","region":"유럽",
    "destination":{"code":"MAD","city":"마드리드","country":"ES"},
    "start":"...","end":"...","days":4,"redeye":false,
    "legs":[{"dir":"out","date":"...","flight":"KE0913","from":"ICN","to":"MAD","dep":"09:55","arr":"18:00","arrDate":"...","redeye":false,"block":905}],
    "layover":{"city":"마드리드","nights":2,"from":"...","to":"..."}}],
  "offDays":[{"date":"...","code":"ADO"}],
  "education":[{"date":"...","from":"08:30","to":"17:30","place":"ICN"}]
}`;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeImage(file: File, apiKey: string): Promise<Schedule> {
  const b64 = await fileToBase64(file);
  const mediaType = (file.type || "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: b64 }
            },
            { type: "text", text: PROMPT }
          ]
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `API ${res.status}`
    );
  }

  const body = await res.json() as {
    content: { type: string; text: string }[];
  };
  const text = body.content.find((c) => c.type === "text")?.text ?? "";

  // JSON만 추출 (혹시 코드펜스가 섞여와도 처리)
  const jsonText = text
    .replace(/^```[a-z]*\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  const schedule = JSON.parse(jsonText) as Schedule;
  if (!schedule.month) throw new Error("month 필드 없음");
  return schedule;
}
