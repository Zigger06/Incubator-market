import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App";
import { I18nProvider } from "./i18n/Provider";
import { AuthProvider } from "./features/auth/AuthProvider";
import { StoreProvider } from "./app/StoreProvider";
import "./styles/index.css";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="alert" className="empty">
        <h1>Саҳифа бор нашуд / Не удалось открыть страницу</h1>
        <button onClick={() => window.location.reload()}>
          Такрор / Повторить
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <HashRouter>
          <AuthProvider>
            <StoreProvider>
              <App />
            </StoreProvider>
          </AuthProvider>
        </HashRouter>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
