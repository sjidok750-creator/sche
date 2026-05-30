import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { useSchedule } from "./lib/useSchedule";

import TodayPage from "./pages/TodayPage";
import MonthPage from "./pages/MonthPage";
import HelpPage from "./pages/HelpPage";
import { CalendarIcon, HelpIcon, TodayDot } from "./components/icons";

const tabs = [
  { to: "/today", label: "홈", Icon: TodayDot },
  { to: "/month", label: "스케줄", Icon: CalendarIcon },
  { to: "/help", label: "설정", Icon: HelpIcon }
];

export default function App() {
  const [state, updateSchedule] = useSchedule();

  return (
    <>
      <div className="aurora" />
      <div className="grain" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <main className="safe-top flex-1 px-5 pb-32 pt-4">
          {state.status === "loading" && <Skeleton />}
          {state.status === "error" && (
            <div className="grid h-[60vh] place-items-center px-6 text-center">
              <div className="space-y-2">
                <p className="text-rose-300">스케줄을 불러오지 못했어요.</p>
                <p className="text-sm text-[var(--muted)]">{state.error}</p>
              </div>
            </div>
          )}
          {state.status === "ok" && (
            <Routes>
              <Route path="/" element={<Navigate to="/today" replace />} />
              <Route
                path="/today"
                element={
                  <TodayPage
                    data={state.data}
                    onDataUpdate={updateSchedule}
                  />
                }
              />
              <Route path="/month" element={<MonthPage data={state.data} />} />
              <Route path="/help" element={<HelpPage data={state.data} />} />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </Routes>
          )}
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-5 pt-3">
          <ul className="glass flex rounded-[22px] p-1.5">
            {tabs.map(({ to, label, Icon }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-white/[0.07] text-white"
                        : "text-[var(--faint)] hover:text-[var(--muted)]"
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="tracking-tight">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="h-6 w-32 animate-pulse rounded-lg bg-white/5" />
      <div className="h-44 animate-pulse rounded-3xl bg-white/5" />
      <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
