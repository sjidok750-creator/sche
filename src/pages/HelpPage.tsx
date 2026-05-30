import type { Schedule } from "../types";

export default function HelpPage({ data }: { data: Schedule }) {
  const jsonUrl = `${window.location.origin}${import.meta.env.BASE_URL}schedule.json`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">도움말</h1>
        <p className="mt-1 text-sm text-slate-400">
          현재 데이터: {data.month}
          {data.rev ? ` · ${data.rev}` : ""}
        </p>
      </header>

      <Section title="스케줄 바꾸는 법 (월 1회)">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>새 스케줄 캘린더 사진을 준비한다.</li>
          <li>
            Claude Code(또는 Claude.ai)에 사진과 함께 변환 프롬프트를 준다.
            받은 JSON을 그대로 사용한다.
          </li>
          <li>
            리포의{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">
              public/schedule.json
            </code>{" "}
            을 덮어쓴다.
          </li>
          <li>
            커밋 전, 도착 +1일 넘어가는 줄과 야간편(redeye)을 눈으로 한 번
            확인한다.
          </li>
          <li>
            <code className="rounded bg-white/10 px-1 font-mono text-xs">
              main
            </code>{" "}
            에 푸시하면 GitHub Pages가 자동 재배포된다.
          </li>
        </ol>
      </Section>

      <Section title="schedule.json 주소">
        <p className="break-all rounded-xl bg-white/5 p-3 font-mono text-xs text-sky-200">
          {jsonUrl}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          위젯의 DATA_URL 에 이 주소를 넣으세요.
        </p>
      </Section>

      <Section title="홈/잠금화면 한 줄 위젯 설치 (Scriptable)">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>App Store에서 Scriptable 설치.</li>
          <li>새 스크립트를 만들고 위젯 코드를 붙여넣는다.</li>
          <li>
            맨 윗줄{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">
              DATA_URL
            </code>{" "}
            을 위 schedule.json 주소로 바꾼다.
          </li>
          <li>
            홈화면에 Small 위젯 또는 잠금화면 인라인 위젯을 추가 → Script 를 이
            스크립트로 지정.
          </li>
          <li>날짜가 바뀌면 위젯이 자동으로 오늘 일정으로 갱신된다.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          위젯 코드는 리포의{" "}
          <code className="rounded bg-white/10 px-1 font-mono text-xs">
            widget/roster-widget.js
          </code>{" "}
          파일에 있습니다.
        </p>
      </Section>

      <Section title="표시 예시">
        <ul className="space-y-1.5 font-mono text-sm text-slate-300">
          <li>✈️ KE0913 ICN→MAD · 09:55 · 출발</li>
          <li>🏨 마드리드 레이오버</li>
          <li>🌿 휴무 (ATDO)</li>
          <li>🎓 교육 08:30–17:30</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <h2 className="mb-3 font-display text-base font-bold text-slate-100">
        {title}
      </h2>
      {children}
    </section>
  );
}
