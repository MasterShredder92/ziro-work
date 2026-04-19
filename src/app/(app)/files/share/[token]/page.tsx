import { ShareLinkViewer } from "../../components";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ token: string }> };

export default async function ShareLinkViewerPage({ params }: PageParams) {
  const { token } = await params;
  return <ShareLinkViewer token={token} />;
}
