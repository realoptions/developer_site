import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import Logo from "./Logo.tsx";
import { menuHeight, logoHeight, paddingTop } from "../styles.ts";

const { Header } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [{ key: "sign-out", label: "Log Out" }];

interface AppHeaderProps {
  /** The menu item only exists once there is a session to end. */
  showSignOut: boolean;
  onSignOut: () => void;
}

const AppHeader = ({ showSignOut, onSignOut }: AppHeaderProps) => (
  <Header>
    <div className="logo" style={{ paddingTop }}>
      <Logo className="logo-primary" height={logoHeight} width={logoHeight} />
    </div>
    <Menu
      theme="dark"
      mode="horizontal"
      style={{
        lineHeight: menuHeight + "px",
        float: "right",
        padding: "0px 10px",
      }}
      items={showSignOut ? menuItems : undefined}
      onClick={onSignOut}
    />
  </Header>
);

export default AppHeader;
