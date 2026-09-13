import { Alert, Button, message } from "antd";
import { CopyOutlined as Copy } from "@ant-design/icons";
import { copyToClipboard, ClipboardUnsupportedError } from "../copyToClipboard.ts";

const copyToken = (token: string) => {
  void copyToClipboard(token)
    .then(() => message.success("Token copied"))
    .catch((error: unknown) => {
      // Log the original error (NotAllowedError, missing user gesture, etc.) for
      // diagnosis, while the user gets an actionable message.
      console.error("copyToClipboard failed", error);
      message.error(
        error instanceof ClipboardUnsupportedError
          ? "Clipboard unavailable in this context - please copy the token manually."
          : "Copy failed - clipboard access was blocked. Please copy the token manually.",
      );
    });
};

interface TokenNoticeProps {
  token: string;
}

/** Explains the OAuth token flow and offers the copy action. */
const TokenNotice = ({ token }: TokenNoticeProps) => (
  <Alert
    title="Authentication"
    description={
      <>
        <p>
          The API uses tokens provided through OAUTH2 Providers. To authenticate
          the API, copy the token and paste it into the "JWT (apiKey)" box.
        </p>
        <Button type="primary" icon={<Copy />} onClick={() => copyToken(token)}>
          Copy Token
        </Button>
      </>
    }
    type="info"
    className="token-notice"
  />
);

export default TokenNotice;
