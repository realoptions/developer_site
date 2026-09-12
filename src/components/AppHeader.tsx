import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import Logo from "./Logo.tsx";

const { Header } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [{ key: "sign-out", label: "Log Out" }];

interface AppHeaderProps {
  /** The menu item only exists once there is a session to end. */
  showSignOut: boolean;
  onSignOut: () => void;
  /**
   * Menu colour scheme. Passed in rather than written as a literal here so the
   * component holds no colour decision: the value comes from the theme module.
   */
  menuTheme: "light" | "dark";
}

/**
 * Flex header: brand at the leading edge, menu pushed to the trailing edge by
 * `margin-inline-start: auto` (see .app-menu in App.css). Vertical centring is
 * `align-items: center`, which replaces the old `paddingTop` that had to be
 * derived from the logo and header heights to fake it.
 */
const AppHeader = ({ showSignOut, onSignOut, menuTheme }: AppHeaderProps) => (
  <Header className="app-header">
    <span className="app-logo">
      <Logo className="logo-primary" width="100%" height="100%" />
    </span>
    <Menu
      className="app-menu"
      theme={menuTheme}
      mode="horizontal"
      items={showSignOut ? menuItems : undefined}
      onClick={onSignOut}
    />
  </Header>
);

export default AppHeader;
