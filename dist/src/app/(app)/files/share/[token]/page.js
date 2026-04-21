import { jsx as _jsx } from "react/jsx-runtime";
import { ShareLinkViewer } from "../../components";
export const dynamic = "force-dynamic";
export default async function ShareLinkViewerPage({ params }) {
    const { token } = await params;
    return _jsx(ShareLinkViewer, { token: token });
}
