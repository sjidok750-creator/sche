import { useEffect, useState } from "react";
import type { Schedule } from "../types";

type State =
  | { status: "loading" }
  | { status: "ok"; data: Schedule }
  | { status: "error"; error: string };

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
      .then((data: Schedule) => {
        if (alive) setState({ status: "ok", data });
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
