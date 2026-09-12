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
    <Layout className="layout" style={{ minHeight: "100vh" }}>
      <AppHeader
        showSignOut={status === "authenticated"}
        onSignOut={() => void signOut()}
      />
      <Content style={{ padding: "0 50px" }}>
        {error && (
          <Alert
            type="error"
            title="Authentication problem"
            description={`The last auth operation did not complete: ${error.message}`}
            style={{ marginTop: 15 }}
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
