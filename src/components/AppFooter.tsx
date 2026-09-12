import { Layout } from "antd";
import { appTag } from "../env.ts";

const { Footer } = Layout;

const AppFooter = () => (
  <Footer className="app-footer">
    {/* CI stamps VITE_TAG on every deploy; previously nothing read it, so the
        version never reached the page. */}
    Finside {" "}
    <span title="Deployed release tag">&middot; {appTag}</span>
  </Footer>
);

export default AppFooter;
