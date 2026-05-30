const DATA_URL = "https://sjidok750-creator.github.io/sche/schedule.json";
const KST = function(d) { return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); };

var data = { months: [] };
try {
  var raw = await new Request(DATA_URL + "?t=" + Date.now()).loadJSON();
  if (raw && raw.months) { data = raw; }
  else if (raw && raw.month) { data = { months: [raw] }; }
} catch (e) {}

var today = KST(new Date());
var tomorrow = KST(new Date(Date.now() + 86400000));

function schedFor(date) {
  var key = date.slice(0, 7);
  var months = data.months || [];
  for (var i = 0; i < months.length; i++) {
    if (months[i].month === key) return months[i];
  }
  return null;
}

function inRange(a, b, d) {
  return a >= d ? false : b < d ? false : true;
}

function lineFor(date) {
  var d = schedFor(date);
  if (!d) return { icon: "-", text: "일정 없음", color: "#6a7d96" };

  var edu = d.education || [];
  for (var i = 0; i < edu.length; i++) {
    if (edu[i].date === date) {
      return { icon: "EDU", text: "교육 " + (edu[i].from || "") + "-" + (edu[i].to || ""), color: "#c98a1f" };
    }
  }

  var offs = d.offDays || [];
  for (var j = 0; j < offs.length; j++) {
    if (offs[j].date === date) {
      return { icon: "OFF", text: "휴무 (" + (offs[j].code || "OFF") + ")", color: "#5e9c6e" };
    }
  }

  var trips = d.trips || [];
  for (var k = 0; k < trips.length; k++) {
    var t = trips[k];
    var legs = t.legs || [];
    for (var m = 0; m < legs.length; m++) {
      var l = legs[m];
      if (l.date === date) {
        var dir = l.dir === "out" ? "출발" : "복귀";
        var fl = l.flight ? l.flight + " " : "";
        return { icon: "FLT", text: fl + (l.from || "") + "-" + (l.to || "") + " " + (l.dep || "") + " " + dir, color: "#2f86d4" };
      }
    }
    if (t.start && t.end && !inRange(t.start, t.end, date) === false) {
      var city = "";
      if (t.layover && t.layover.city) city = t.layover.city;
      else if (t.destination && t.destination.city) city = t.destination.city;
      return { icon: "STY", text: city + " 레이오버", color: "#4aa3c4" };
    }
  }

  return { icon: "SBY", text: "대기", color: "#6a7d96" };
}

var rToday = lineFor(today);
var rTomorrow = lineFor(tomorrow);

if (config.widgetFamily === "accessoryInline") {
  var wi = new ListWidget();
  wi.addText(rToday.icon + " " + rToday.text);
  Script.setWidget(wi);
  Script.complete();
} else {
  var w = new ListWidget();
  w.backgroundColor = new Color("#0a1f44");
  w.setPadding(14, 16, 14, 16);

  var todayLabel = today.slice(5).replace("-", ".") + " 오늘";
  var head = w.addText(todayLabel);
  head.font = Font.mediumSystemFont(10);
  head.textColor = new Color("#8fb3da");
  w.addSpacer(3);

  var l1 = w.addText(rToday.icon + " " + rToday.text);
  l1.font = Font.boldSystemFont(15);
  l1.textColor = Color.white();
  l1.lineLimit = 2;

  w.addSpacer(8);

  var tomorrowLabel = tomorrow.slice(5).replace("-", ".") + " 내일";
  var head2 = w.addText(tomorrowLabel);
  head2.font = Font.mediumSystemFont(10);
  head2.textColor = new Color("#8fb3da");
  w.addSpacer(3);

  var l2 = w.addText(rTomorrow.icon + " " + rTomorrow.text);
  l2.font = Font.semiboldSystemFont(13);
  l2.textColor = new Color("#d7e3f2");
  l2.lineLimit = 2;

  w.addSpacer();
  var foot = w.addText("Roster");
  foot.font = Font.systemFont(9);
  foot.textColor = new Color(rToday.color);

  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  Script.setWidget(w);
  if (!config.runsInWidget) { w.presentMedium(); }
  Script.complete();
}
