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

      <Section title="어떻게 채워지나요" delay="rise-1">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          이 앱은 <b className="text-[var(--ink)]">스케줄 사진</b>을 올려 데이터를
          만드는 구조예요. 5월 사진을 올리고, 6월을 올리면 달마다 한 칸씩 쌓여요.
          쌓인 달은 <b className="text-[var(--ink)]">스케줄</b> 탭에서
          지난달·이번 달·다음 달로 넘겨 볼 수 있어요.
        </p>
      </Section>

      <Section title="스케줄 올리는 법" delay="rise-2">
        <ol className="space-y-2.5 text-sm text-[var(--muted)]">
          {[
            "새 스케줄 캘린더 사진을 준비한다.",
            "Claude Code(또는 Claude.ai)에 사진과 함께 아래 변환 프롬프트를 준다.",
            "받은 JSON을 public/schedule.json 의 months 배열에 추가한다.",
            "커밋 전, 도착 +1일 넘어가는 줄과 야간편(redeye)을 한 번 확인한다.",
            "main 에 푸시하면 GitHub Pages가 자동 재배포된다."
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-sky-300">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/8 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-[var(--muted)]">
{`첨부한 승무원 월간 스케줄 캘린더 이미지를 규칙대로 JSON 한
객체(한 달)로만 변환해줘. 설명/코드펜스 없이 JSON만.
- 비행 블록이 놓인 날짜 칸을 근거로 date/arrDate를 채운다.
- 도착이 출발보다 이르거나 다음 칸이면 arrDate=+1일.
- 국내선=domestic, EDU=education, 휴무류=offDays로 분리.
  국제선은 거리로 long/mid/short 추정.
- 출발 21:00 이후/야간이면 redeye=true.
- 편명 KExxxx 유지, 애매하면 null. 공항코드는 IATA 기준.
결과 객체를 schedule.json 의 months 배열에 넣으면 끝.`}
        </pre>
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
