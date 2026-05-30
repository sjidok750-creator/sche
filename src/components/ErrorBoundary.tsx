import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  clearData = () => {
    try { localStorage.removeItem("roster_data"); } catch { /* ignore */ }
    location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-[60vh] place-items-center px-6 text-center">
          <div className="glass max-w-sm space-y-4 rounded-3xl p-6">
            <p className="font-display text-lg font-bold text-rose-300">화면을 표시하지 못했어요</p>
            <p className="break-words text-xs text-[var(--muted)]">{this.state.error.message}</p>
            <p className="text-xs text-[var(--faint)]">
              분석된 데이터 형식이 일부 맞지 않을 수 있어요. 데이터를 지우고 다시 사진을 올려보세요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/[0.04]"
              >
                다시 시도
              </button>
              <button
                onClick={this.clearData}
                className="flex-1 rounded-xl bg-rose-500/20 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
              >
                데이터 초기화
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
