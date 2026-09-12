import { Spin } from "antd";

/**
 * Shown while Firebase resolves the persisted session.
 *
 * Without it, a returning user with a valid session is briefly classified as
 * signed out and sees the login buttons before the docs appear.
 */
const AuthLoading = () => (
  <div style={{ textAlign: "center", padding: "4rem 0" }}>
    <Spin size="large" />
    <div style={{ marginTop: 12 }}>Checking your session...</div>
  </div>
);

export default AuthLoading;
