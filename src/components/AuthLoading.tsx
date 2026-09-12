import { Spin } from "antd";

/**
 * Shown while Firebase resolves the persisted session.
 *
 * Without it, a returning user with a valid session is briefly classified as
 * signed out and sees the login buttons before the docs appear.
 */
const AuthLoading = () => (
  <div className="auth-loading">
    <Spin size="large" />
    <div className="auth-loading-status">Checking your session...</div>
  </div>
);

export default AuthLoading;
