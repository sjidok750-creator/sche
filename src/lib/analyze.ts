import type { Schedule, Trip, Category } from "../types";

// ── 카테고리 자동 보정용 공항→카테고리 매핑 ──
const LONG_HAUL = new Set(["JFK","LAX","ORD","ATL","DFW","SFO","IAD","IAH","SEA","BOS","MIA","YYZ","YVR","MEX","GRU","EZE","LHR","CDG","AMS","FRA","MUC","ZRH","VIE","MAD","BCN","FCO","MXP","IST","SVO","DOH","DXB","AUH","KWI","BKR","CAI","JNB","SYD","MEL","BNE","AKL","PER"]);
const MID_HAUL  = new Set(["BKK","DMK","HKT","KUL","SIN","CGK","SUB","MNL","CEB","SGN","HAN","DAD","RGN","CMB","DEL","BOM","HYD","MAA","CCU","KTM","DAC","ISB","KHI","LHE","TAS","ALA","MCT","BAH","AMM","BEY","TLV","ADD","NBO","DAR"]);
const SHORT_HAUL = new Set(["NRT","HND","KIX","NGO","FUK","CTS","OKA","PUS","TAO","PEK","PKX","SHA","PVG","CAN","CTU","XIY","HGH","TSN","XMN","CSX","CGO","WUH","KHN","NKG","TNA","HAK","SZX","URC","GUM","SPN","ROR","HNL","OGN"]);

function inferCategory(to: string): Category {
  const code = (to || "").toUpperCase();
  if (LONG_HAUL.has(code)) return "long";
  if (MID_HAUL.has(code))  return "mid";
  if (SHORT_HAUL.has(code)) return "short";
  // 국내 공항
  if (["GMP","ICN","CJU","PUS","USN","TAE","CJJ","KWJ","WJU","YNY","RSU","HIN","MPK","KAG"].includes(code)) return "domestic";
  return "short"; // 기본값
}

function buildPrompt(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `이 이미지는 ${y}년 ${m}월 항공사 승무원 스케줄 캘린더다.
아래 JSON 스키마의 객체 하나를 출력해라. JSON만 출력 — 코드펜스·설명·주석 없이.

필수 스키마:
{
  "month": "${yearMonth}",
  "trips": [
    {
      "id": "t1",
      "category": "long|mid|short|domestic",
      "destination": { "code": "IATA 3글자", "city": "한국어 도시명", "country": "ISO-2" },
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "days": 일수(정수),
      "legs": [
        {
          "dir": "out",
          "date": "YYYY-MM-DD",
          "flight": "KE1234 또는 null",
          "from": "ICN",
          "to": "목적지IATA",
          "dep": "HH:MM",
          "arr": "HH:MM",
          "arrDate": "YYYY-MM-DD",
          "redeye": false,
          "block": 분(정수)
        }
      ]
    }
  ],
  "offDays": [{ "date": "YYYY-MM-DD", "code": "ADO|ATDO|PDO|휴무" }],
  "education": [{ "date": "YYYY-MM-DD", "from": "HH:MM", "to": "HH:MM", "place": "장소" }]
}

규칙:
1. 모든 날짜는 반드시 YYYY-MM-DD 전체 형식 — "${y}-${m}-01" 처럼.
2. category: domestic=국내선(GMP/CJU/PUS/USN/TAE), long=미주·유럽·대양주, mid=동남아·중동·남아시아, short=일본·중국·괌·하와이
3. 레이오버 구간: 출발 leg dir="out", 귀국 leg dir="in". 두 leg 사이 날짜는 trip의 start~end에 포함.
4. 다음날 도착이면 arrDate = 출발일+1일.
5. 출발 21:00 이후면 redeye=true.
6. 빈 칸(표시 없음)은 대기 — trips/offDays/education에 넣지 않음.
7. EDU = education. ADO/ATDO/PDO/휴무 = offDays.
8. dep/arr은 이미지의 출발·도착 현지시각(HH:MM)을 정확히. block은 모르면 0(앱이 시차로 계산).
9. trip마다 id는 "t1","t2"... 순서대로.
10. ★중요★ 1일부터 말일까지 모든 날짜 칸을 하나도 빠짐없이 확인하라. 특히 ADO/ATDO/PDO/EDU/휴무 표시가 있는 칸을 절대 놓치지 마라. 색깔 막대가 있는 칸은 반드시 분류한다.`;
}

// ── 공항 UTC 오프셋(시간) — 블록타임 계산용(대략값, DST 무시) ──
const TZ: Record<string, number> = {
  ICN:9, GMP:9, CJU:9, PUS:9, USN:9, TAE:9, KWJ:9, CJJ:9, RSU:9, HIN:9, WJU:9, YNY:9, MWX:9, MPK:9,
  NRT:9, HND:9, KIX:9, NGO:9, FUK:9, CTS:9, OKA:9,
  PEK:8, PKX:8, PVG:8, SHA:8, CAN:8, CTU:8, XIY:8, HGH:8, TSN:8, XMN:8, CSX:8, CGO:8, WUH:8, NKG:8, TAO:8, SZX:8, HAK:8, URC:6,
  TPE:8, HKG:8, MFM:8,
  BKK:7, DMK:7, HKT:7, SGN:7, HAN:7, DAD:7, RGN:6.5,
  SIN:8, KUL:8, CGK:7, SUB:7, DPS:8, MNL:8, CEB:8,
  GUM:10, SPN:10, ROR:9, HNL:-10,
  DEL:5.5, BOM:5.5, MAA:5.5, HYD:5.5, CCU:5.5, CMB:5.5, KTM:5.75, DAC:6,
  DXB:4, AUH:4, DOH:3, BAH:3, KWI:3, MCT:4, AMM:3, BEY:3, TLV:3,
  IST:3, SVO:3, ADD:3, NBO:3, DAR:3, CAI:2, JNB:2,
  LHR:1, CDG:2, AMS:2, FRA:2, MUC:2, ZRH:2, VIE:2, MAD:2, BCN:2, FCO:2, MXP:2,
  JFK:-4, EWR:-4, IAD:-4, BOS:-4, ATL:-4, ORD:-5, IAH:-5, DFW:-5, MIA:-4,
  LAX:-7, SFO:-7, SEA:-7, YVR:-7, YYZ:-4, MEX:-6, GRU:-3, EZE:-3,
  SYD:10, MEL:10, BNE:10, PER:8, AKL:12,
};

function toMin(t: string | null | undefined): number | null {
  if (!t || !/^\d{1,2}:\d{2}/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** 출·도착 시각과 시차로 블록타임(분) 계산. 불가하면 null */
function computeBlock(from: string, to: string, date: string, arrDate: string, dep: string | null, arr: string | null): number | null {
  const dm = toMin(dep), am = toMin(arr);
  if (dm == null || am == null) return null;
  const offFrom = TZ[from], offTo = TZ[to];
  const dayDiff = (new Date(`${arrDate}T00:00:00Z`).getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 86400000;
  // 현지 분 → UTC 분
  const depUTC = dm - (offFrom ?? 0) * 60;
  const arrUTC = am - (offTo ?? 0) * 60 + dayDiff * 1440;
  const block = arrUTC - depUTC;
  if (block <= 0 || block > 1000) return null; // 비정상값 제외
  return Math.round(block);
}

// ── 파싱 후 자동 보정 ──
function postProcess(sched: Schedule, yearMonth: string): Schedule {
  const [y, m] = yearMonth.split("-");
  const prefix = `${y}-${m}`;

  // 날짜 형식 보정: MM-DD → YYYY-MM-DD
  function fixDate(d: string | undefined | null): string {
    if (!d) return `${prefix}-01`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if (/^\d{2}-\d{2}$/.test(d)) return `${y}-${d}`;
    if (/^\d{1,2}$/.test(d)) return `${prefix}-${d.padStart(2, "0")}`;
    return d;
  }

  const trips: Trip[] = (sched.trips || []).map((t, i) => {
    const legs = (t.legs || []).map(l => {
      const from = (l.from || "ICN").toUpperCase();
      const to = (l.to || "").toUpperCase();
      const date = fixDate(l.date);
      const arrDate = fixDate(l.arrDate) || date;
      // block이 없거나 0이면 시각·시차로 계산
      const block = (l.block && l.block > 0)
        ? l.block
        : (computeBlock(from, to, date, arrDate, l.dep, l.arr) ?? 0);
      return { ...l, date, arrDate, from, to, block };
    });

    // 카테고리 자동 보정
    const destCode = (t.destination?.code || legs.find(l => l.dir === "out")?.to || "").toUpperCase();
    const category = inferCategory(destCode) ;

    // start/end 보정
    const dates = legs.map(l => l.date).filter(Boolean).sort();
    const start = fixDate(t.start) || dates[0] || `${prefix}-01`;
    const end   = fixDate(t.end)   || dates[dates.length - 1] || start;

    // 레이오버 박수 자동 계산 (출발 leg ~ 귀국 leg 날짜 차이)
    const outLeg = legs.find(l => l.dir === "out");
    const inLeg = legs.find(l => l.dir === "in");
    let layover = t.layover;
    if (!layover && outLeg && inLeg && category !== "domestic") {
      // 도착일(out leg arrDate) ~ 귀국 출발일(in leg date) 차이 = 실제 숙박 박수
      const arrivedDay = outLeg.arrDate || outLeg.date;
      const nights = Math.round(
        (new Date(`${inLeg.date}T00:00:00Z`).getTime() - new Date(`${arrivedDay}T00:00:00Z`).getTime()) / 86400000
      );
      if (nights >= 1) {
        layover = {
          city: t.destination?.city || destCode,
          nights,
          from: outLeg.to,
          to: inLeg.from,
        };
      }
    }

    return {
      ...t,
      id: t.id || `t${i + 1}`,
      category,
      start,
      end,
      days: t.days || Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1),
      legs,
      layover,
      destination: {
        code:    (t.destination?.code || destCode || "—").toUpperCase(),
        city:    t.destination?.city || "",
        country: t.destination?.country || "",
      }
    };
  });

  const offDays = (sched.offDays || []).map(o => ({ ...o, date: fixDate(o.date) }));
  const education = (sched.education || []).map(e => ({ ...e, date: fixDate(e.date) }));

  return { ...sched, month: yearMonth, trips, offDays, education };
}

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

export async function analyzeImage(file: File, apiKey: string, yearMonth: string): Promise<Schedule> {
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
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } },
            { type: "text", text: buildPrompt(yearMonth) }
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
    throw new Error(`JSON 파싱 실패 — 응답: ${text.slice(0, 200)}`);
  }
  if (!schedule.month) throw new Error("month 필드 없음");

  return postProcess(schedule, yearMonth);
}
