// === 비행 스케줄 한 줄 위젯 (Scriptable) ===
// 1) Scriptable 앱에 새 스크립트로 붙여넣기
// 2) 아래 DATA_URL 을 본인 GitHub Pages 주소로 변경
// 3) 홈화면 Small 위젯 또는 잠금화면 인라인 위젯 추가 → Script 를 이 스크립트로 설정
const DATA_URL = "https://sjidok750-creator.github.io/sche/schedule.json";
const KST = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); // YYYY-MM-DD

let data = {};
try {
  data = await new Request(`${DATA_URL}?t=${Date.now()}`).loadJSON();
} catch (e) {}
const today = KST(new Date());

function lineForToday(d) {
  const inRange = (a, b) => a <= today && today <= b;
  for (const e of d.education || [])
    if (e.date === today)
      return { icon: "🎓", text: `교육 ${e.from}–${e.to}`, color: "#c98a1f" };
  for (const o of d.offDays || [])
    if (o.date === today)
      return { icon: "🌿", text: `휴무 (${o.code || "OFF"})`, color: "#5e9c6e" };
  for (const t of d.trips || []) {
    for (const l of t.legs || [])
      if (l.date === today) {
        const dir = l.dir === "out" ? "출발" : "복귀";
        return {
          icon: "✈️",
          text: `${l.flight} ${l.from}→${l.to} · ${l.dep} · ${dir}`,
          color: "#2f86d4"
        };
      }
    if (t.start && t.end && inRange(t.start, t.end))
      return {
        icon: "🏨",
        text: `${(t.layover && t.layover.city) || t.destination.city} 레이오버`,
        color: "#4aa3c4"
      };
  }
  return { icon: "🟦", text: "오늘 일정 없음", color: "#6a7d96" };
}

const r = lineForToday(data);

// 잠금화면 인라인 위젯이면 한 줄 텍스트만
if (config.widgetFamily === "accessoryInline") {
  const wi = new ListWidget();
  wi.addText(`${r.icon} ${r.text}`);
  Script.setWidget(wi);
  Script.complete();
} else {
  const w = new ListWidget();
  w.backgroundColor = new Color("#0a1f44");
  w.setPadding(12, 14, 12, 14);
  const top = w.addText((data.crew || "") + " · " + today.slice(5));
  top.font = Font.mediumSystemFont(10);
  top.textColor = new Color("#8fb3da");
  w.addSpacer(4);
  const line = w.addText(`${r.icon} ${r.text}`); // ← 한 줄
  line.font = Font.boldSystemFont(15);
  line.textColor = Color.white();
  line.lineLimit = 2;
  w.addSpacer();
  const foot = w.addText("Roster");
  foot.font = Font.systemFont(9);
  foot.textColor = new Color(r.color);

  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  Script.setWidget(w);
  if (!config.runsInWidget) w.presentSmall();
  Script.complete();
}
