import { Metadata } from "next";
import { FaceitMatchContent } from "./faceit-match-content";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Partida Faceit | ORBITAL ROXA`,
    description: `Detalhes da partida Faceit ${id}`,
  };
}

export default async function FaceitMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FaceitMatchContent matchId={id} />;
}
