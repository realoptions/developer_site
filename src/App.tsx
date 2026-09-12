import { Alert, Layout } from "antd";
import "./App.css";
import LoginButton from "./FirebaseLogin.tsx";
import ApiDocs from "./components/ApiDocs.tsx";
import AppFooter from "./components/AppFooter.tsx";
import AppHeader from "./components/AppHeader.tsx";
import AuthLoading from "./components/AuthLoading.tsx";
import TokenNotice from "./components/TokenNotice.tsx";
import { useAuth } from "./hooks/useAuth.ts";

const { Content } = Layout;

/**
 * Composition only. Auth state lives in `useAuth`, presentation in
 * `src/components/*`; no Firebase call, observer or token handling appears here.
 */
const DevHome = () => {
  const { auth, status, token, error, signOut } = useAuth();

  return (
    <Layout className="app-shell">
      <AppHeader
        showSignOut={status === "authenticated"}
        onSignOut={() => void signOut()}
      />
      <Content className="app-content">
        {error && (
          <Alert
            type="error"
            className="auth-alert"
            title="Authentication problem"
            description={`The last auth operation did not complete: ${error.message}`}
          />
        )}
        {status === "loading" && <AuthLoading />}
        {status === "authenticated" && (
          <>
            <TokenNotice token={token} />
            <ApiDocs />
          </>
        )}
        {status === "signed-out" && <LoginButton auth={auth} />}
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default DevHome;
