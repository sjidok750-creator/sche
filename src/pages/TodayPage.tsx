import {
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode
} from "react";
import { Link } from "react-router-dom";
import type { RosterData, Schedule } from "../types";
import {
  categoryMeta,
  currentMonthKey,
  dateAtKst,
  ddayLabel,
  findMonth,
  fmtDuration,
  kstToday,
  monthSummary,
  nextUpcoming,
  reportingTime,
  resolveToday
} from "../lib/schedule";
import { Settings } from "../lib/settings";
import { analyzeImage } from "../lib/analyze";
import { pushScheduleJson } from "../lib/github";
import {
  ArrowIcon,
  CapIcon,
  HotelIcon,
  MoonIcon,
  PlaneIcon,
  SunIcon
} from "../components/icons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
function weekday(day: string) {
  return WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];
}

function useClock(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  let diff = Math.floor((target.getTime() - now) / 1000);
  const past = diff < 0;
  diff = Math.abs(diff);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { h: pad(Math.floor(diff / 3600)), m: pad(Math.floor((diff % 3600) / 60)), s: pad(diff % 60), past };
}

const PROMPT = `이 승무원 월간 스케줄 캘린더를 schedule.json 의 months 배열 한 객체로 변환해줘.
JSON만 출력 — 코드펜스·설명 없이, 객체 하나만.
규칙:
- 이미지 상단에서 연월(YYYY-MM)을 읽어 month 필드에 넣는다.
- 비행 블록 날짜 칸 기준으로 date/arrDate 채움. 다음 칸 넘어가면 arrDate=+1일.
- 빈 칸(아무 표시 없음)은 대기 — trips/offDays/education 어디에도 넣지 않음.
- 국내선(GMP·CJU·PUS·USN·TAE 등)=domestic, EDU=education, ADO/ATDO/PDO/휴무=offDays.
- 국제선: long(미주·유럽·대양주)/mid(동남아·중동)/short(일본·중국·괌).
- 출발 21:00 이후면 redeye:true. 편명 KExxxx 유지, 불명확하면 null.
- leg마다 block(비행시간, 분) 포함. 공항코드는 IATA 표준.`;

function mergeMonth(data: RosterData, sched: Schedule): RosterData {
  const months = data.months.filter((m) => m.month !== sched.month);
  months.push(sched);
  months.sort((a, b) => a.month.localeCompare(b.month));
  return { months };
}

/* ─────────────────────────────── */
export default function TodayPage({
  data,
  onDataUpdate
}: {
  data: RosterData;
  onDataUpdate: (d: RosterData) => void;
}) {
  const today = kstToday();
  const monthKey = currentMonthKey(today);
  // Prefer current month; fall back to nearest available month
  const sched = findMonth(data, monthKey)
    ?? (data.months.length > 0 ? data.months[data.months.length - 1] : null);
  const activeMonthKey = sched?.month ?? monthKey;
  const [, mm, dd] = today.split("-");

  return (
    <div className="space-y-6">
      <header className="rise rise-1 flex items-end justify-between">
        <div>
          <p className="eyebrow">오늘 · {weekday(today)}요일</p>
          <h1 className="mt-1 font-display text-[2.7rem] font-extrabold leading-none tracking-tight tnum">
            {mm}<span className="text-[var(--faint)]">.</span>{dd}
          </h1>
        </div>
        <p className="eyebrow pb-1 tnum">{activeMonthKey}</p>
      </header>

      {sched ? (
        <ScheduleView sched={sched} today={today} monthKey={activeMonthKey} data={data} onDataUpdate={onDataUpdate} />
      ) : (
        <UploadFlow data={data} onDataUpdate={onDataUpdate} />
      )}
    </div>
  );
}

/* ─── 스케줄 있을 때 ─── */
function ScheduleView({ sched, today, monthKey, data, onDataUpdate }: {
  sched: Schedule; today: string; monthKey: string;
  data: RosterData; onDataUpdate: (d: RosterData) => void;
}) {
  const status = resolveToday(sched, today);
  const sum = monthSummary(sched);
  const upcoming = nextUpcoming(sched, today);
  const [showUpload, setShowUpload] = useState(false);
  const depDate =
    (status.kind === "flight-out" || status.kind === "flight-in") && status.leg?.dep
      ? dateAtKst(status.leg.date, status.leg.dep) : null;
  const clock = useClock(depDate);

  return (
    <>
      <div className="rise rise-2">
        <HeroCard status={status} today={today} clock={clock} />
      </div>

      <section className="rise rise-2 glass rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">{monthKey.replace("-", ".")} 총 비행시간</p>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none tnum">
              {fmtDuration(sum.blockMinutes)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="font-mono text-xs text-sky-300 tnum">{sum.flights}편 · {sum.trips}트립</p>
            <div className="flex gap-3">
              <Link to="/month" className="eyebrow text-sky-400 hover:text-sky-200">전체 보기 →</Link>
              <button onClick={() => setShowUpload(v => !v)} className="eyebrow text-[var(--faint)] hover:text-[var(--muted)]">
                {showUpload ? "닫기" : "+ 스케줄 추가"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showUpload && (
        <div className="rise rise-1">
          <UploadFlow data={data} onDataUpdate={(d) => { onDataUpdate(d); setShowUpload(false); }} compact />
        </div>
      )}

      {!showUpload && (
        <section className="rise rise-3">
          <p className="eyebrow mb-3 px-1">다음 일정</p>
          {upcoming.length === 0
            ? <p className="px-1 text-sm text-[var(--faint)]">예정된 일정이 없어요.</p>
            : (
              <ol className="relative space-y-2.5 pl-1">
                {upcoming.map((u, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center self-stretch">
                      <span className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
                      {i < upcoming.length - 1 && <span className="w-px flex-1 bg-white/10" />}
                    </div>
                    <div className="glass mb-0.5 flex flex-1 items-center justify-between rounded-2xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{u.label}</p>
                        {u.sub && <p className="font-mono text-xs text-[var(--muted)]">{u.sub}</p>}
                      </div>
                      <div className="pl-3 text-right">
                        <p className="font-mono text-[11px] text-[var(--faint)] tnum">{u.date.slice(5).replace("-", ".")}</p>
                        <p className="text-xs font-bold text-sky-300 tnum">{ddayLabel(u.date, today)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )
          }
        </section>
      )}
    </>
  );
}

/* ─── 업로드 + JSON 붙여넣기 플로우 ─── */
type Step = "select" | "analyzing" | "prompt" | "paste";

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "analyzing" | "done" | "error";
  error?: string;
}

function UploadFlow({ data, onDataUpdate, compact = false }: {
  data: RosterData; onDataUpdate: (d: RosterData) => void; compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [step, setStep] = useState<Step>("select");
  const [isDrag, setIsDrag] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState("");
  const [pushState, setPushState] = useState<"idle" | "pushing" | "done" | "error">("idle");
  const [pushErr, setPushErr] = useState("");

  const autoAnalyze = Settings.isReady();

  const commitSchedules = useCallback(async (schedules: Schedule[], baseData: RosterData) => {
    let updated = baseData;
    for (const s of schedules) updated = mergeMonth(updated, s);
    onDataUpdate(updated);
    if (Settings.canAutoPush()) {
      setPushState("pushing");
      try { await pushScheduleJson(updated); setPushState("done"); }
      catch (e) { setPushErr(e instanceof Error ? e.message : "푸시 실패"); setPushState("error"); }
    } else {
      setPushState("done");
    }
  }, [onDataUpdate]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) return;
    const items: PhotoItem[] = arr.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: autoAnalyze ? "analyzing" : "pending"
    }));
    setPhotos(prev => [...prev, ...items]);

    if (autoAnalyze) {
      setStep("analyzing");
      const key = Settings.anthropicKey;
      Promise.all(
        items.map(item =>
          analyzeImage(item.file, key)
            .then(s => ({ item, sched: s, error: null as string | null }))
            .catch(e => ({ item, sched: null, error: e instanceof Error ? e.message : "분석 실패" }))
        )
      ).then(results => {
        setPhotos(prev => prev.map(p => {
          const r = results.find(r => r.item.id === p.id);
          if (!r) return p;
          return { ...p, status: r.error ? "error" : "done", error: r.error ?? undefined };
        }));
        const ok = results.filter(r => r.sched).map(r => r.sched!);
        if (ok.length > 0) commitSchedules(ok, data);
        // stay on analyzing step to show results; user closes manually
      });
    } else {
      setStep("prompt");
    }
  }, [autoAnalyze, data, commitSchedules]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const applyJson = async () => {
    setParseError("");
    // JSON 배열이면 여러 달, 객체면 한 달
    let parsed: Schedule | Schedule[];
    try {
      const clean = jsonText.replace(/^```[a-z]*\n?/m, "").replace(/\n?```$/m, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      setParseError("JSON 형식이 아니에요. Claude 답변에서 JSON 부분만 붙여넣으세요.");
      return;
    }
    const schedules = Array.isArray(parsed) ? parsed : [parsed];
    let updated = data;
    for (const s of schedules) {
      if (!s.month) { setParseError("month 필드가 없어요."); return; }
      updated = mergeMonth(updated, s);
    }
    onDataUpdate(updated);

    // GitHub 자동 푸시
    if (Settings.canAutoPush()) {
      setPushState("pushing");
      try {
        await pushScheduleJson(updated);
        setPushState("done");
      } catch (e) {
        setPushErr(e instanceof Error ? e.message : "푸시 실패");
        setPushState("error");
      }
    } else {
      setPushState("done");
    }
    setStep("select");
    setPhotos([]);
    setJsonText("");
  };

  /* ── 자동 분석 중 ── */
  if (step === "analyzing") {
    const allDone = photos.every(p => p.status === "done" || p.status === "error");
    const hasError = photos.some(p => p.status === "error");
    return (
      <div className="space-y-3">
        <div className="glass rounded-[24px] p-5 space-y-4">
          <p className="eyebrow text-sky-400">{allDone ? (hasError ? "분석 완료 (일부 오류)" : "✓ 분석 완료") : "AI 분석 중…"}</p>
          {photos.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <img src={p.preview} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/15" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{p.file.name}</p>
                {p.status === "analyzing" && <p className="text-xs text-sky-300 mt-0.5 animate-pulse">분석 중…</p>}
                {p.status === "done" && <p className="text-xs text-emerald-400 mt-0.5">✓ 완료</p>}
                {p.status === "error" && <p className="text-xs text-rose-400 mt-0.5">{p.error}</p>}
              </div>
            </div>
          ))}
          {allDone && (
            <button
              onClick={() => { setPhotos([]); setStep("select"); }}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                hasError
                  ? "border border-white/10 text-white/70 hover:bg-white/[0.04]"
                  : "bg-sky-500/20 text-sky-200 hover:bg-sky-500/30"
              }`}
            >
              {hasError ? "닫기" : "확인"}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── STEP 1: 사진 선택 ── */
  if (step === "select") return (
    <div className="space-y-3">
      {pushState === "error" && (
        <div className="glass rounded-2xl border border-rose-400/20 px-4 py-3">
          <p className="text-sm font-semibold text-rose-300">GitHub 저장 실패: {pushErr}</p>
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={onDrop}
        className={`glass flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed cursor-pointer transition-colors ${
          compact ? "py-8" : "min-h-[18rem]"
        } ${isDrag ? "border-sky-400/60 bg-sky-400/5" : "border-white/15 hover:border-white/30"}`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only"
          onChange={e => e.target.files && addFiles(e.target.files)} />
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <CameraIcon />
        </div>
        {!compact && (
          <div className="text-center">
            <p className="font-display text-lg font-bold tracking-tight">스케줄 사진 올리기</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {autoAnalyze ? "AI가 자동으로 분석해요 · 여러 달 동시 가능" : "여러 달을 한 번에 올려도 돼요"}
            </p>
          </div>
        )}
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2 text-sm font-semibold text-sky-300">
          {compact ? "사진 추가" : "사진 선택 (여러 장 가능)"}
        </span>
      </div>
    </div>
  );

  /* ── STEP 2: 분석 요청 복사 ── */
  if (step === "prompt") return (
    <div className="space-y-3">
      {/* 미리보기 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map(p => (
          <img key={p.id} src={p.preview} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-1 ring-white/20" />
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/20 text-[var(--faint)] hover:border-white/40"
        >
          <span className="text-2xl">+</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only"
          onChange={e => e.target.files && addFiles(e.target.files)} />
      </div>

      {/* 안내 카드 */}
      <div className="glass rounded-[24px] p-5 space-y-4">
        <div>
          <p className="eyebrow text-sky-400">2단계로 끝나요</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            아래 버튼으로 <b className="text-white">분석 요청을 복사</b>하고,
            Claude.ai에서 사진과 함께 붙여넣으세요.<br />
            받은 JSON을 다시 여기에 붙여넣으면 끝이에요.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={copyPrompt}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
              copied ? "bg-emerald-500/20 text-emerald-300" : "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]"
            }`}
          >
            {copied ? "✓ 복사됨" : "① 분석 요청 복사"}
          </button>
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/15 py-3 text-sm font-semibold text-sky-200 hover:bg-sky-500/25 transition"
          >
            ② Claude.ai 열기 <ArrowIcon size={15} />
          </a>
        </div>

        <button
          onClick={() => setStep("paste")}
          className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.04] transition"
        >
          ③ JSON 받았어요 →
        </button>
      </div>

      <button onClick={() => { setPhotos([]); setStep("select"); }}
        className="w-full py-2 text-xs text-[var(--faint)] hover:text-[var(--muted)]">
        취소
      </button>
    </div>
  );

  /* ── STEP 3: JSON 붙여넣기 ── */
  return (
    <div className="space-y-3">
      <div className="glass rounded-[24px] p-5 space-y-3">
        <p className="eyebrow text-sky-400">③ JSON 붙여넣기</p>
        <p className="text-sm text-[var(--muted)]">Claude 답변의 JSON을 아래에 붙여넣으세요.</p>
        <textarea
          value={jsonText}
          onChange={e => { setJsonText(e.target.value); setParseError(""); }}
          placeholder={'{\n  "month": "2026-06",\n  ...\n}'}
          rows={8}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-[var(--muted)] placeholder-[var(--faint)] outline-none focus:border-sky-500/40 resize-none"
        />
        {parseError && <p className="text-xs text-rose-400">{parseError}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setStep("prompt")}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[var(--faint)] hover:text-white transition"
          >
            ← 뒤로
          </button>
          <button
            onClick={applyJson}
            disabled={!jsonText.trim()}
            className="flex-1 rounded-xl bg-sky-500/20 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-30 transition"
          >
            {pushState === "pushing" ? "저장 중…" : "적용하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 히어로 카드 ─── */
function HeroCard({ status, today, clock }: {
  status: ReturnType<typeof resolveToday>; today: string; clock: ReturnType<typeof useClock>;
}) {
  if (status.kind === "flight-out" || status.kind === "flight-in") return <FlightHero status={status} today={today} clock={clock} />;
  if (status.kind === "layover") {
    const trip = status.trip!; const meta = categoryMeta(trip.category);
    return (
      <StateHero accent={meta.accent} icon={<HotelIcon size={26} />} eyebrow="레이오버">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">{trip.layover?.city ?? trip.destination?.city ?? ""}</h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{trip.destination?.code ?? "—"} · {trip.destination?.country ?? ""}{trip.layover && ` · ${trip.layover.nights}박`}</p>
      </StateHero>
    );
  }
  if (status.kind === "off") return (
    <StateHero accent="#6ee7a8" icon={<MoonIcon size={26} />} eyebrow="휴무">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">오프</h2>
      <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{status.off?.code ?? "OFF"}</p>
    </StateHero>
  );
  if (status.kind === "education") return (
    <StateHero accent="#f0c46a" icon={<CapIcon size={26} />} eyebrow="교육">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">교육</h2>
      <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{status.education?.from}–{status.education?.to}{status.education?.place ? ` · ${status.education.place}` : ""}</p>
    </StateHero>
  );
  if (status.kind === "standby") return (
    <StateHero accent="#7ca3c8" icon={<SunIcon size={26} />} eyebrow="대기">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">대기</h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">배정된 비행이 없는 대기일이에요.</p>
    </StateHero>
  );
  return (
    <StateHero accent="#9fb0cc" icon={<SunIcon size={26} />} eyebrow="일정 없음">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">여유로운 하루</h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">예정된 비행이 없어요.</p>
    </StateHero>
  );
}

function StateHero({ accent, icon, eyebrow, children }: { accent: string; icon: ReactNode; eyebrow: string; children: ReactNode; }) {
  return (
    <div className="glass relative overflow-hidden rounded-[28px] p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle,${accent},transparent 70%)` }} />
      <div className="relative flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border"
          style={{ borderColor: `${accent}40`, color: accent, background: `${accent}14` }}>
          {icon}
        </div>
        <div className="pt-1">
          <p className="eyebrow" style={{ color: accent }}>{eyebrow}</p>
          <div className="mt-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FlightHero({ status, today, clock }: { status: ReturnType<typeof resolveToday>; today: string; clock: ReturnType<typeof useClock>; }) {
  const trip = status.trip!; const leg = status.leg!;
  const meta = categoryMeta(trip.category);
  const reporting = reportingTime(leg.dep);
  const dirLabel = leg.dir === "out" ? "출발" : "복귀";
  const plus1 = leg.arrDate && leg.arrDate !== leg.date;
  return (
    <div className="glass relative overflow-hidden rounded-[28px]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle,${meta.accent},transparent 70%)` }} />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide" style={{ background: `${meta.accent}1f`, color: meta.accent }}>
            {meta.label} · {dirLabel}
          </span>
          <span className="font-mono text-sm font-bold text-sky-200 tnum">{ddayLabel(leg.date, today)}</span>
        </div>
        <div className="mt-7 flex items-end justify-between">
          <div>
            <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">{leg.from}</p>
            <p className="mt-1.5 font-mono text-sm text-[var(--muted)] tnum">{leg.dep ?? "--:--"}</p>
          </div>
          <div className="flex flex-1 flex-col items-center px-3 pb-2">
            <div className="flex w-full items-center text-[var(--faint)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <PlaneIcon size={18} className="mx-1 rotate-90 text-sky-300" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </div>
            <p className="mt-2 font-mono text-[11px] tracking-wide text-[var(--muted)]">{leg.flight ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">{leg.to}</p>
            <p className="mt-1.5 font-mono text-sm text-[var(--muted)] tnum">
              {leg.arr ?? "--:--"}{plus1 && <sup className="ml-0.5 text-[10px] text-amber-300">+1</sup>}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
          {trip.destination?.city ?? ""}
          {leg.redeye && <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">레드아이</span>}
        </p>
      </div>
      <div className="relative">
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="mx-6 border-t border-dashed border-white/15" />
      </div>
      <div className="relative grid grid-cols-2 gap-4 p-6">
        <div>
          <p className="eyebrow">리포팅 (추정)</p>
          <p className="mt-1 font-mono text-2xl font-bold tnum">{reporting ?? "--:--"}</p>
          <p className="mt-0.5 text-[11px] text-[var(--faint)]">출발 -90분</p>
        </div>
        <div className="text-right">
          <p className="eyebrow">{clock?.past ? "출발 경과" : "출발까지"}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-sky-200 tnum">
            {clock ? `${clock.h}:${clock.m}:${clock.s}` : "--:--:--"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--faint)]">현지 기준</p>
        </div>
      </div>
    </div>
  );
}

const CameraIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
