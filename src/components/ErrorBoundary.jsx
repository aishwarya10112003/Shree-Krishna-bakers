import React from "react";

/**
 * Catches render-time crashes anywhere below it and shows a recovery screen
 * instead of a blank white page. Error boundaries must be class components —
 * this is the one place React still requires them.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In a real app this would report to Sentry/Datadog.
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 mb-6">
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
