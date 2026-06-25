import { Component } from "react";
import { AlertTriangle, RefreshCw, ChevronLeft } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔴 ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const componentStack = this.state.errorInfo?.componentStack || "";
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex items-center justify-center p-4">
          <div className="text-center max-w-lg w-full">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-400">Có lỗi xảy ra</h2>
            <p className="text-neutral-500 text-sm mb-2">
              Ứng dụng gặp sự cố khi tải trang này.
            </p>
            {error && (
              <div className="text-left mb-4 space-y-2">
                <p className="text-red-300 text-xs font-bold bg-red-900/20 rounded-lg p-2 border border-red-800/40 break-all">
                  {error.message || "Lỗi không xác định"}
                </p>
                {error.stack && (
                  <details className="text-neutral-500 text-[10px] font-mono bg-neutral-900/60 rounded-lg border border-neutral-800/60">
                    <summary className="cursor-pointer px-3 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium">
                      Xem chi tiết lỗi (stack trace)
                    </summary>
                    <pre className="px-3 pb-3 pt-1 whitespace-pre-wrap break-all max-h-48 overflow-y-auto text-neutral-500 leading-relaxed">
                      {error.stack}
                    </pre>
                  </details>
                )}
                {componentStack && (
                  <details className="text-neutral-500 text-[10px] font-mono bg-neutral-900/60 rounded-lg border border-neutral-800/60">
                    <summary className="cursor-pointer px-3 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium">
                      Component Stack
                    </summary>
                    <pre className="px-3 pb-3 pt-1 whitespace-pre-wrap break-all max-h-48 overflow-y-auto text-neutral-500 leading-relaxed">
                      {componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Thử lại
              </button>
              {this.props.onBack && (
                <button
                  onClick={this.props.onBack}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}