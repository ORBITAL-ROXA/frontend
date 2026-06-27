// Liga inscrições aprovadas ao "camp alvo" (campeonato ativo/aberto) e marca
// quais times do G5API estão confirmados nele. Usado pelos selos de inscrição
// em admin/inscricoes, admin/times e admin/campeonatos.

export interface InscricaoLite {
  team_id?: number | null;
  team_name: string;
  tournament_id: string | null;
  status: "pendente" | "aprovado" | "rejeitado" | "pago" | string;
}

export interface TournamentLite {
  id: string;
  name: string;
  status: "pending" | "active" | "finished" | string;
}

export function normalizeName(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Camp alvo das inscrições = torneio ativo; se não houver, o primeiro pendente.
export function getTargetTournament(tournaments: TournamentLite[]): TournamentLite | null {
  return (
    tournaments.find(t => t.status === "active") ||
    tournaments.find(t => t.status === "pending") ||
    null
  );
}

export interface ConfirmedTeams {
  teamIds: Set<number>;
  names: Set<string>;
}

// Constrói o conjunto de times confirmados num torneio.
// Por padrão considera só aprovado/pago (confirmados de verdade).
export function buildConfirmedTeams(
  inscricoes: InscricaoLite[],
  tournamentId: string | null,
  statuses: string[] = ["aprovado", "pago"]
): ConfirmedTeams {
  const teamIds = new Set<number>();
  const names = new Set<string>();
  if (!tournamentId) return { teamIds, names };
  for (const i of inscricoes) {
    if (i.tournament_id !== tournamentId) continue;
    if (!statuses.includes(i.status)) continue;
    if (i.team_id != null) teamIds.add(i.team_id);
    names.add(normalizeName(i.team_name)); // fallback p/ inscrições antigas sem team_id
  }
  return { teamIds, names };
}

export function isTeamConfirmed(team: { id: number; name: string }, confirmed: ConfirmedTeams): boolean {
  return confirmed.teamIds.has(team.id) || confirmed.names.has(normalizeName(team.name));
}
