import type { ReactNode } from "react";
import type { RosterData } from "../types";
import { monthKeys } from "../lib/schedule";

export default function HelpPage({ data }: { data: RosterData }) {
  const jsonUrl = `${window.location.origin}${import.meta.env.BASE_URL}schedule.json`;
  const keys = monthKeys(data);

  return (
    <div className="space-y-6">
      <header className="rise rise-1">
        <p className="eyebrow">가이드</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
          도움말
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {keys.length === 0
            ? "아직 등록된 달이 없어요."
            : `등록된 달: ${keys.map((k) => k.replace("-", ".")).join(", ")}`}
        </p>
      </header>

      <Section title="사진만 주면 끝" delay="rise-1">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          새 스케줄이 나오면 <b className="text-[var(--ink)]">월간 캘린더 사진</b>{" "}
          한 장을 Claude에게 주기만 하면 돼요. Claude가 사진을 분석해 비행·레이오버·
          휴무·교육과 <b className="text-[var(--ink)]">총 비행시간</b>까지 계산해서
          이 앱에 채워 넣어요.
        </p>
        <ol className="mt-4 space-y-2.5 text-sm text-[var(--muted)]">
          {[
            "스케줄 캘린더를 캡처/촬영한다.",
            "Claude에게 사진을 주며 \"이 스케줄 올려줘\"라고 말한다.",
            "Claude가 분석해 데이터로 만들고 배포까지 한다. 끝!"
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-sky-300">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-[var(--faint)]">
          5월·6월·7월… 한 장씩 줄 때마다 달이 쌓여요. 쌓인 달은{" "}
          <b className="text-[var(--muted)]">스케줄</b> 탭에서 지난달·이번 달·
          다음 달로 넘겨 볼 수 있어요.
        </p>
      </Section>

      <Section title="schedule.json 주소" delay="rise-3">
        <p className="break-all rounded-xl border border-white/8 bg-black/30 p-3 font-mono text-xs text-sky-200">
          {jsonUrl}
        </p>
        <p className="mt-2 text-xs text-[var(--faint)]">
          위젯의 DATA_URL 에 이 주소를 넣으세요.
        </p>
      </Section>

      <Section title="홈·잠금화면 한 줄 위젯" delay="rise-3">
        <ol className="space-y-2.5 text-sm text-[var(--muted)]">
          {[
            "App Store에서 Scriptable 설치.",
            "새 스크립트에 widget/roster-widget.js 코드를 붙여넣는다.",
            "맨 윗줄 DATA_URL 을 위 주소로 바꾼다.",
            "홈화면 Small 위젯 또는 잠금화면 인라인 위젯으로 추가 → Script 지정.",
            "날짜가 바뀌면 위젯이 오늘 일정으로 자동 갱신된다."
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-sky-300">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 space-y-1.5 font-mono text-[13px] text-[var(--muted)]">
          <p>✈️ KE0913 ICN→MAD · 09:55 · 출발</p>
          <p>🏨 마드리드 레이오버</p>
          <p>🌿 휴무 (OFF)</p>
          <p>🎓 교육 08:30–17:30</p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  delay,
  children
}: {
  title: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <section className={`rise ${delay} glass rounded-3xl p-5`}>
      <h2 className="mb-3 font-display text-base font-bold tracking-tight text-[var(--ink)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
