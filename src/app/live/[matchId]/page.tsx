import LiveOverlay from "./live-overlay";

export const metadata = { title: "ORBITAL ROXA LIVE" };

export default async function LivePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <LiveOverlay matchId={parseInt(matchId)} />;
}
