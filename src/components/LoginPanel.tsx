import { Button } from "antd";
import { PROVIDERS, type ProviderConfig } from "../authProviders.ts";

interface LoginPanelProps {
  /** Starts a popup sign-in. Owned by useAuth so this stays presentational. */
  signIn: (provider: ProviderConfig) => Promise<void>;
  /** Key of the provider whose popup is open; disables the others. */
  pendingProvider: string | null;
  providers?: readonly ProviderConfig[];
}

/**
 * Sign-in options, rendered from the PROVIDERS config array.
 *
 * Three things were wrong with the previous version:
 *
 * 1. Each provider had its own hand-written <Row><Col> block, so adding one meant
 *    copying markup - including a pair of empty spacer <Col>s used to fake
 *    centring. Adding a provider now means appending one entry to PROVIDERS.
 * 2. signInWithPopup was called without a catch, so every failure - closed popup,
 *    blocked popup, denied permission, network error - was silent. The screen just
 *    didn't do anything and the user had no idea why. Failures now land in
 *    useAuth.error and App renders them immediately above this list.
 * 3. All three AuthProvider instances were constructed at module scope, so
 *    importing the login screen allocated Firebase objects as a side effect.
 *    Providers are now built lazily inside signIn.
 *
 * Centring uses flexbox and the shared spacing tokens rather than empty grid
 * columns, so it behaves at 320px instead of depending on a breakpoint hack.
 */
const LoginPanel = ({
  signIn,
  pendingProvider,
  providers = PROVIDERS,
}: LoginPanelProps) => (
  <section className="login-panel" aria-label="Sign in">
    <div className="login-provider-list">
      {providers.map((provider) => (
        <Button
          key={provider.key}
          className="login-provider-button"
          size="large"
          icon={<provider.Icon />}
          loading={pendingProvider === provider.key}
          disabled={pendingProvider !== null && pendingProvider !== provider.key}
          onClick={() => void signIn(provider)}
        >
          {provider.label}
        </Button>
      ))}
    </div>
  </section>
);

export default LoginPanel;
