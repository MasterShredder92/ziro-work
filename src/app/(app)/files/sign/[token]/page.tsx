import { SignatureSignerFlow } from "../../components";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ token: string }> };

export default async function SignaturePublicPage({ params }: PageParams) {
  const { token } = await params;
  return <SignatureSignerFlow token={token} />;
}
