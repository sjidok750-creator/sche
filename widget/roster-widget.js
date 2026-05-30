// === 비행 스케줄 위젯 (Scriptable) — 오늘/내일 ===
// 1) Scriptable 앱에 새 스크립트로 붙여넣기
// 2) DATA_URL 을 본인 GitHub Pages 주소로 (기본값 그대로면 OK)
// 3) 홈화면 Small/Medium 위젯 또는 잠금화면 인라인 위젯 추가 → Script 선택
//
// ⚠️ 위젯은 GitHub Pages의 schedule.json 을 읽습니다.
//    앱 설정에서 GitHub 자동저장을 켜야 분석 결과가 위젯에 반영됩니다.

const DATA_URL = "https://sjidok750-creator.github.io/sche/schedule.json";
const KST = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

let data = { months: [] };
try {
  const raw = await new Request(`${DATA_URL}?t=${Date.now()}`).loadJSON();
  // 신규 { months:[] } 또는 구버전 단일 객체 모두 지원
  if (raw && raw.months) data = raw;
  else if (raw && raw.month) data = { months: [raw] };
} catch (e) {}

const today = KST(new Date());
const tomorrow = KST(new Date(Date.now() + 86400000));

// 해당 날짜가 속한 달 스케줄 찾기
function schedFor(date) {
  const key = date.slice(0, 7);
  return (data.months || []).find((m) => m.month === key);
}

function inRange(a, b, d) { return a <= d && d <= b; }

function lineFor(date) {
  const d = schedFor(date);
  if (!d) return { icon: "·", text: "일정 없음", color: "#6a7d96" };

  for (const e of d.education || [])
    if (e.date === date) return { icon: "🎓", text: `교육 ${e.from}–${e.to}`, color: "#c98a1f" };
  for (const o of d.offDays || [])
    if (o.date === date) return { icon: "🌿", text: `휴무 (${o.code || "OFF"})`, color: "#5e9c6e" };
  for (const t of d.trips || []) {
    for (const l of t.legs || [])
      if (l.date === date) {
        const dir = l.dir === "out" ? "출발" : "복귀";
        const fl = l.flight ? l.flight + " " : "";
        return { icon: "✈️", text: `${fl}${l.from}→${l.to} ${l.dep || ""} ${dir}`, color: "#2f86d4" };
      }
    if (t.start && t.end && inRange(t.start, t.end, date))
      return { icon: "🏨", text: `${(t.layover && t.layover.city) || (t.destination && t.destination.city) || ""} 레이오버`, color: "#4aa3c4" };
  }
  return { icon: "🟦", text: "대기", color: "#6a7d96" };
}

const rToday = lineFor(today);
const rTomorrow = lineFor(tomorrow);

// ── 잠금화면 인라인: 오늘 한 줄 ──
if (config.widgetFamily === "accessoryInline") {
  const wi = new ListWidget();
  wi.addText(`${rToday.icon} ${rToday.text}`);
  Script.setWidget(wi);
  Script.complete();
} else {
  const w = new ListWidget();
  w.backgroundColor = new Color("#0a1f44");
  w.setPadding(14, 16, 14, 16);

  const head = w.addText(`${today.slice(5).replace("-", ".")} 오늘`);
  head.font = Font.mediumSystemFont(10);
  head.textColor = new Color("#8fb3da");
  w.addSpacer(3);
  const l1 = w.addText(`${rToday.icon} ${rToday.text}`);
  l1.font = Font.boldSystemFont(15);
  l1.textColor = Color.white();
  l1.lineLimit = 2;

  w.addSpacer(8);

  const head2 = w.addText(`${tomorrow.slice(5).replace("-", ".")} 내일`);
  head2.font = Font.mediumSystemFont(10);
  head2.textColor = new Color("#8fb3da");
  w.addSpacer(3);
  const l2 = w.addText(`${rTomorrow.icon} ${rTomorrow.text}`);
  l2.font = Font.semiboldSystemFont(13);
  l2.textColor = new Color("#d7e3f2");
  l2.lineLimit = 2;

  w.addSpacer();
  const foot = w.addText("Roster");
  foot.font = Font.systemFont(9);
  foot.textColor = new Color(rToday.color);

  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  Script.setWidget(w);
  if (!config.runsInWidget) w.presentMedium();
  Script.complete();
}
