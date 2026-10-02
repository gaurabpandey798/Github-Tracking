'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ParticipantResponse,
  TeamEntity,
  GithubUserDto,
  CreateParticipantPayload,
  UpdateParticipantPayload,
} from '@/types/api';
import {
  getParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  syncParticipantsFromGithub,
  getUnassignedOrgMembers,
} from '@/lib/api/participants';
import { getTeams } from '@/lib/api/teams';
import ParticipantTable from '@/components/participants/ParticipantTable';
import AddParticipantModal from '@/components/participants/AddParticipantModal';
import EditParticipantModal from '@/components/participants/EditParticipantModal';
import ParticipantDetailModal from '@/components/participants/ParticipantDetailModal';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Info,
} from 'lucide-react';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantResponse | null>(null);

  // Delete confirmation
  const [participantToDelete, setParticipantToDelete] = useState<ParticipantResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success alert
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // GitHub Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Unassigned direct GitHub members state
  const [unassignedMembers, setUnassignedMembers] = useState<GithubUserDto[]>([]);
  const [prefillUser, setPrefillUser] = useState<GithubUserDto | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [participantsData, teamsData, unassignedData] = await Promise.all([
        getParticipants(),
        getTeams(),
        getUnassignedOrgMembers().catch(() => []),
      ]);
      setParticipants(participantsData);
      setTeams(teamsData);
      setUnassignedMembers(unassignedData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load participants data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSyncFromGithub = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await syncParticipantsFromGithub();
      let msg = `GitHub Sync Complete: ${result.participantsSynced} participants synced (${result.newParticipantsAdded} newly added) across ${result.teamsMatched} teams.`;
      if (result.unassignedOrgMembers && result.unassignedOrgMembers.length > 0) {
        msg += ` Detected ${result.unassignedOrgMembers.length} unassigned member(s) with access.`;
      }
      setSuccessMessage(msg);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sync participants from GitHub teams.';
      setError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getParticipants(),
      getTeams(),
      getUnassignedOrgMembers().catch(() => []),
    ])
      .then(([participantsData, teamsData, unassignedData]) => {
        if (!ignore) {
          setParticipants(participantsData);
          setTeams(teamsData);
          setUnassignedMembers(unassignedData);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load participants data.');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Handle Add Participant
  const handleCreateParticipant = async (payload: CreateParticipantPayload) => {
    await createParticipant(payload);
    setSuccessMessage(`Participant @${payload.githubUsername} registered successfully.`);
    setTimeout(() => setSuccessMessage(null), 4000);
    await loadData();
  };

  // Handle Update Participant
  const handleUpdateParticipant = async (id: number, payload: UpdateParticipantPayload) => {
    await updateParticipant(id, payload);
    setSuccessMessage('Participant information updated successfully.');
    setTimeout(() => setSuccessMessage(null), 4000);
    await loadData();
  };

  // Handle Delete Participant
  const confirmDeleteParticipant = async () => {
    if (!participantToDelete) return;
    setIsDeleting(true);
    try {
      await deleteParticipant(participantToDelete.id);
      setSuccessMessage(
        `Participant @${participantToDelete.githubUsername} removed from roster. Commit history preserved.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      setParticipantToDelete(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove participant.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // 1. Team filter
      if (selectedTeamId !== 'ALL' && p.teamId !== Number(selectedTeamId)) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchUsername = p.githubUsername.toLowerCase().includes(query);
        const matchDisplayName = p.displayName ? p.displayName.toLowerCase().includes(query) : false;
        const matchTeam = p.teamName.toLowerCase().includes(query);
        const matchRole = p.role.toLowerCase().includes(query);

        if (!matchUsername && !matchDisplayName && !matchTeam && !matchRole) {
          return false;
        }
      }

      return true;
    });
  }, [participants, selectedTeamId, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = participants.length;
    const teamsWithParticipants = new Set(participants.map((p) => p.teamId)).size;
    const teamsTotal = teams.length;
    const totalCommitsLinked = participants.reduce((acc, p) => acc + (p.commitCount || 0), 0);

    return {
      total,
      teamsWithParticipants,
      teamsTotal,
      unrosteredTeams: Math.max(0, teamsTotal - teamsWithParticipants),
      totalCommitsLinked,
    };
  }, [participants, teams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Participants
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#1B2560] border border-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Official Roster</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage officially registered hackathon participants across IdeaX teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={isLoading || isSyncing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSyncFromGithub}
            disabled={isLoading || isSyncing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2E45A2]/30 bg-[#F2F6FF] px-3.5 py-2 text-xs font-semibold text-[#1B2560] shadow-sm hover:bg-blue-100 disabled:opacity-50 transition-colors"
            title="Fetch participants from GitHub organization teams and repositories"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-[#2E45A2]' : 'text-[#2E45A2]'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync from GitHub'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2E45A2] transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register Participant</span>
          </button>
        </div>
      </div>

      {/* Architecture Roster Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-[#F2F6FF] p-4 text-xs text-slate-700">
        <Info className="h-5 w-5 text-[#2E45A2] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#1B2560]">
            Audit Distinction: Participant Roster vs Observed GitHub Contributors
          </span>
          <p className="text-slate-600 leading-relaxed">
            This page represents the <strong>official organizer-approved roster</strong> of participants.
            GitHub contributors discovered during repository commit sync are monitored on the{' '}
            <a href="/developers" className="text-[#2E45A2] font-semibold underline">
              Developers
            </a>{' '}
            page. Unregistered commit authors remain marked as <code>DETECTED</code> or{' '}
            <code>UNKNOWN</code> until explicitly enrolled here.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">Error loading roster:</span> {error}
          </div>
        </div>
      )}

      {/* Detected Unassigned Members Banner */}
      {unassignedMembers.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Detected Individual Member{unassignedMembers.length > 1 ? 's' : ''} with Access ({unassignedMembers.length})
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  The following user{unassignedMembers.length > 1 ? 's have' : ' has'} direct organization or repository access but {unassignedMembers.length > 1 ? 'are' : 'is'} not yet assigned to an official team roster. Assign them to monitor their commits and audit activity.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-3 border-t border-amber-200/80">
            {unassignedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.login}
                      className="w-7 h-7 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                      {member.login.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      @{member.login}
                    </p>
                    {member.name && (
                      <p className="text-[10px] text-slate-500 truncate">{member.name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPrefillUser(member);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#1B2560] hover:bg-[#2E45A2] rounded-md shadow-xs transition-colors shrink-0"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Assign to Team</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Registered Participants
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-[#1B2560]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.total}
            </span>
            <span className="text-xs text-slate-400">members</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teams with Roster
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.teamsWithParticipants}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {stats.teamsTotal} teams
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Rosters
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.unrosteredTeams}
            </span>
            <span className="text-xs text-slate-400">teams unassigned</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Linked Commit Activity
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {stats.totalCommitsLinked}
            </span>
            <span className="text-xs text-slate-400">commits tracked</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by participant name, GitHub username, team, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
          />
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-700 bg-white focus:border-[#1B2560] focus:ring-1 focus:ring-[#1B2560] outline-none transition-colors"
          >
            <option value="ALL">All Teams ({teams.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                Team {String(t.teamNumber).padStart(2, '0')} — {t.teamName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B2560]" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Loading official participants...
          </p>
          <p className="text-xs text-slate-400">
            Fetching participant records from CodeMonitor backend.
          </p>
        </div>
      ) : filteredParticipants.length > 0 ? (
        <ParticipantTable
          participants={filteredParticipants}
          onViewDetails={(p) => {
            setSelectedParticipant(p);
            setIsDetailModalOpen(true);
          }}
          onEdit={(p) => {
            setSelectedParticipant(p);
            setIsEditModalOpen(true);
          }}
          onDelete={(p) => {
            setParticipantToDelete(p);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm text-center px-4">
          <div className="p-3 rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {participants.length === 0
              ? 'No participants have been registered yet.'
              : 'No matching participants found.'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {participants.length === 0
              ? 'Register official team members to track participant activity and detect unregistered GitHub commit authors.'
              : 'Try clearing the search query or adjusting team filters to see roster members.'}
          </p>
          {participants.length === 0 && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1B2560] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2E45A2] transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register First Participant</span>
            </button>
          )}
        </div>
      )}

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPrefillUser(null);
        }}
        teams={teams}
        onSubmit={handleCreateParticipant}
        initialUsername={prefillUser?.login}
        initialDisplayName={prefillUser?.name || prefillUser?.login}
        initialUserId={prefillUser?.id}
      />

      {/* Edit Participant Modal */}
      <EditParticipantModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedParticipant(null);
        }}
        participant={selectedParticipant}
        teams={teams}
        onSubmit={handleUpdateParticipant}
      />

      {/* Participant Detail Modal */}
      <ParticipantDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedParticipant(null);
        }}
        participant={selectedParticipant}
      />

      {/* Delete Confirmation Modal */}
      {participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Remove Official Participant
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  @{participantToDelete.githubUsername}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>{participantToDelete.displayName || participantToDelete.githubUsername}</strong> from Team {participantToDelete.teamNumber} ({participantToDelete.teamName})?
            </p>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <strong>Audit Safety Guarantee:</strong> Removing this participant record will <strong>NOT</strong> delete any GitHub commits, checkpoints, or historical monitoring data. Historical commits will simply be detached from the roster.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteParticipant}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirm Removal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
