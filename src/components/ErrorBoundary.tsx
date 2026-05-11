import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", background: "#1a1a2e", color: "#eee", minHeight: "100vh" }}>
          <h1 style={{ color: "#ff6b6b" }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap", background: "#16213e", padding: 20, borderRadius: 8, marginTop: 16 }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", background: "#16213e", padding: 20, borderRadius: 8, marginTop: 8, fontSize: 12, color: "#aaa" }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: "10px 24px", background: "#4361ee", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
