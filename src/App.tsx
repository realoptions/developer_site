import { Alert, Layout } from "antd";
import "./App.css";
import ApiDocs from "./components/ApiDocs.tsx";
import AppFooter from "./components/AppFooter.tsx";
import AppHeader from "./components/AppHeader.tsx";
import AuthLoading from "./components/AuthLoading.tsx";
import LoginPanel from "./components/LoginPanel.tsx";
import TokenNotice from "./components/TokenNotice.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import { headerMenuTheme } from "./theme.ts";
import type { ThemeMode } from "./theme.ts";

const { Content } = Layout;

interface AppProps {
  /**
   * Resolved once in src/index.tsx and passed down. Doing the resolution here too
   * is what let the CSS custom properties and the antd header/menu scheme drift
   * apart; the component takes the answer rather than deriving it.
   */
  themeMode: ThemeMode;
}

/**
 * Composition only. Auth state lives in `useAuth`, presentation in
 * `src/components/*`; no Firebase call, observer or token handling appears here.
 */
const DevHome = ({ themeMode }: AppProps) => {
  const { status, token, error, signOut, signIn, pendingProvider } = useAuth();

  return (
    <Layout className="app-shell">
      <AppHeader
        showSignOut={status === "authenticated"}
        onSignOut={() => void signOut()}
        menuTheme={headerMenuTheme(themeMode)}
      />
      <Content className="app-content">
        {error && (
          <Alert
            type="error"
            className="auth-alert"
            title="Authentication problem"
            description={error.message}
          />
        )}
        {status === "loading" && <AuthLoading />}
        {status === "authenticated" && (
          <>
            <TokenNotice token={token} />
            <ApiDocs />
          </>
        )}
        {status === "signed-out" && (
          <LoginPanel signIn={signIn} pendingProvider={pendingProvider} />
        )}
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default DevHome;
