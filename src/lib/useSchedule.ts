import { useEffect, useState } from "react";
import type { RosterData, Schedule } from "../types";

type State =
  | { status: "loading" }
  | { status: "ok"; data: RosterData }
  | { status: "error"; error: string };

/** 구버전(단일 달 객체)·신버전({months:[]}) 모두 허용 */
function normalize(raw: unknown): RosterData {
  if (raw && typeof raw === "object" && "months" in (raw as object)) {
    const months = (raw as RosterData).months;
    return { months: Array.isArray(months) ? months : [] };
  }
  // 단일 Schedule 객체로 온 경우
  if (raw && typeof raw === "object" && "month" in (raw as object)) {
    return { months: [raw as Schedule] };
  }
  return { months: [] };
}

export function useSchedule(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    const url = `${import.meta.env.BASE_URL}schedule.json?t=${Date.now()}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => {
        if (alive) setState({ status: "ok", data: normalize(raw) });
      })
      .catch((e) => {
        if (alive)
          setState({ status: "error", error: e?.message ?? "로드 실패" });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
