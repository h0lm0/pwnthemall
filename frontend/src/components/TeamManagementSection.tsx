import React, { useState, useEffect } from "react";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { Button } from "@/components/ui/button";
// Removed style selector UI to keep only the classic table view
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrashIcon, UserCircleIcon, StarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { CheckCircle } from 'lucide-react';
// import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeamManagementSectionProps {
  team: Team;
  members: User[];
  currentUser: User;
  onTeamChange?: () => void;
}

// Only the classic view is kept. All themed variations removed.

interface TeamStyleViewProps {
  team: Team;
  members: User[];
  currentUser: User;
  isCreator: boolean;
  otherMembers: User[];
  onKick: (user: User) => void;
  onTransfer: (user: User) => void;
  kickTarget: User | null;
  showKickDialog: boolean;
  setShowKickDialog: (open: boolean) => void;
  onConfirmKick: () => void;
  onCancelKick: () => void;
  transferTarget: User | null;
  setTransferTarget: (user: User | null) => void;
  showTransferDialog: boolean;
  setShowTransferDialog: (open: boolean) => void;
  onConfirmTransfer: () => void;
  onCancelTransfer: () => void;
  kickLoading: boolean;
  transferring: boolean;
  t: (key: string, params?: any) => string;
  showLeaveDialog: boolean;
  setShowLeaveDialog: (open: boolean) => void;
  showDisbandDialog: boolean;
  setShowDisbandDialog: (open: boolean) => void;
  leaving: boolean;
  disbanding: boolean;
  handleLeaveClick: () => void;
  handleDisbandClick: () => void;
  onConfirmLeave: () => void;
  onConfirmDisband: () => void;
  memberPointsMap?: Record<number, number>;
  totalPoints?: number;
  spentOnHints?: number;
}

// --- TEAM STYLE COMPONENTS ---

// Classic: Traditional table style
function ClassicTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband, memberPointsMap, totalPoints, spentOnHints
}: TeamStyleViewProps) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <h3 className="font-bold text-lg">{team.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1">
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold">{typeof totalPoints === 'number' ? totalPoints : 0}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{t('points') || 'Points'}</span>
            </div>
            {spentOnHints && spentOnHints > 0 && (
              <div className="flex items-center gap-2 rounded-full border bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 px-3 py-1">
                <span className="text-orange-600 dark:text-orange-400 text-xs">-</span>
                <span className="font-semibold text-orange-700 dark:text-orange-300">{spentOnHints}</span>
                <span className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wide">{t('spent') || 'Spent'}</span>
              </div>
            )}
            {isCreator && (
              <Button variant="destructive" size="sm" onClick={handleDisbandClick} disabled={disbanding}>
                {t('disband_team')}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Member</th>
              <th className="py-3 px-4 text-left font-medium">Role</th>
              <th className="py-3 px-4 text-left font-medium">Score</th>
              <th className="py-3 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, index) => (
              <tr key={m.id} className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">{m.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{m.username}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {m.id === team.creatorId ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Creator
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Member</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span>{memberPointsMap?.[m.id] ?? m.points ?? 0}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-1 justify-end">
                    {isCreator && m.id !== currentUser.id && m.id !== team.creatorId && (
                      <Button size="icon" variant="destructive" onClick={() => onKick(m)} disabled={kickLoading}>
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {isCreator && m.id !== team.creatorId && (
                      <Button size="icon" variant="outline" onClick={() => onTransfer(m)} disabled={transferring}>
                        <UserGroupIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {m.id === currentUser.id && !isCreator && (
                      <Button size="sm" variant="outline" onClick={handleLeaveClick} disabled={leaving}>
                        {t('leave')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// All other themed views removed.

export const TeamManagementSection: React.FC<TeamManagementSectionProps> = ({ team, members, currentUser, onTeamChange }) => {
  const { t } = useLanguage();
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);
  const [showTransferForLeave, setShowTransferForLeave] = useState(false);
  const [showTransferOnly, setShowTransferOnly] = useState(false);
  const [showDisband, setShowDisband] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [disbanding, setDisbanding] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [disbandError, setDisbandError] = useState<string | null>(null);
  const [kicking, setKicking] = useState<number | null>(null);
  const [kickLoading, setKickLoading] = useState(false);
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [kickTarget, setKickTarget] = useState<User | null>(null);
  const [transferTarget, setTransferTarget] = useState<User | null>(null);
  // Points map fetched from backend; defaults to empty
  const [memberPointsMap, setMemberPointsMap] = useState<Record<number, number>>({});
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [spentOnHints, setSpentOnHints] = useState<number>(0);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDisbandDialog, setShowDisbandDialog] = useState(false);
  const [showCreatorLeaveChoice, setShowCreatorLeaveChoice] = useState(false);

  const isCreator = team.creatorId === currentUser.id;
  const otherMembers = members.filter(m => m.id !== currentUser.id);
  const isAlone = otherMembers.length === 0;

  // Fetch enriched team info to get memberPoints (if available)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`/api/teams/${team.id}`);
        const rawMp = res.data?.memberPoints as Record<string, number> | undefined;
        if (!cancelled && rawMp) {
          const normalized: Record<number, number> = {};
          for (const [k, v] of Object.entries(rawMp)) {
            const id = Number(k);
            if (!Number.isNaN(id)) normalized[id] = typeof v === 'number' ? v : 0;
          }
          setMemberPointsMap(normalized);
          const tp = typeof res.data?.totalPoints === 'number'
            ? res.data.totalPoints
            : Object.values(normalized).reduce((a, b) => a + (b || 0), 0);
          setTotalPoints(tp);
          
          // Get spent on hints
          const spent = typeof res.data?.spentOnHints === 'number' ? res.data.spentOnHints : 0;
          setSpentOnHints(spent);
        } else if (!cancelled) {
          setMemberPointsMap({});
          setTotalPoints(0);
          setSpentOnHints(0);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [team.id]);

  // Live update on team_solve websocket events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (evt: Event) => {
      const e = evt as CustomEvent;
      const detail = e.detail || {};
      const eventTeamId = detail.teamId as number | undefined;
      const eventUserId = detail.userId as number | undefined;
      const eventPoints = detail.points as number | undefined;
      if (!eventTeamId || eventTeamId !== team.id) return;
      if (typeof eventPoints !== 'number') return;
      setTotalPoints((prev) => (prev || 0) + eventPoints);
      if (typeof eventUserId === 'number') {
        setMemberPointsMap((prev) => ({ ...prev, [eventUserId]: (prev?.[eventUserId] || 0) + eventPoints }));
      }
    };
    window.addEventListener('team-solve' as any, handler as any);
    return () => window.removeEventListener('team-solve' as any, handler as any);
  }, [team.id]);

  const handleLeaveClick = () => {
    if (isCreator && otherMembers.length > 0) {
      setShowCreatorLeaveChoice(true);
    } else {
      setShowLeaveDialog(true);
    }
  };
  const handleDisbandClick = () => setShowDisbandDialog(true);
  const onConfirmLeave = async () => {
    setLeaving(true);
    try {
      await axios.post("/api/teams/leave");
      toast.success(t("team_left_successfully"), {
        icon: <CheckCircle className="w-4 h-4" />,
        className: "success-toast",
      });
      setShowLeaveDialog(false);
      onTeamChange?.();
      // Trigger auth refresh to update user info
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }
      window.location.reload();
    } catch (err: any) {
      toast.error(t("team_leave_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setLeaving(false);
    }
  };
  const onConfirmDisband = async () => {
    setDisbanding(true);
    try {
      await handleCreatorSoloLeave();
      setShowDisbandDialog(false);
    } finally {
      setDisbanding(false);
    }
  };

  useEffect(() => {
    const toastData = localStorage.getItem("showToast");
    if (toastData) {
      const { type, message } = JSON.parse(toastData);
      if (message && typeof message === "string" && message.trim() !== "") {
        if (type === "success") {
          toast.success(t(message), {
            icon: <CheckCircle className="w-4 h-4" />,
            className: "success-toast",
          });
        } else {
          toast.error(t(message), { className: "bg-red-600 text-white" });
        }
      }
      localStorage.removeItem("showToast");
    }
  }, [t]);

  const handleSimpleLeave = async () => {
    setLeaving(true);
    setLeaveError(null);
    try {
      await axios.post("/api/teams/leave");
      localStorage.setItem("showToast", JSON.stringify({ type: "success", message: t("team_left_successfully") }));
      setLeaveMsg("team_left_successfully");
      onTeamChange?.();
      // Trigger auth refresh to update user info
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }
      window.location.reload();
    } catch (err: any) {
      setLeaveError(t("team_leave_failed"));
      toast.error(t("team_leave_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setLeaving(false);
    }
  };

  const handleTransferOnly = async (newOwnerId: number) => {
    setTransferring(true);
    try {
      await axios.post("/api/teams/transfer-owner", { teamId: team.id, newOwnerId });
      toast.success(t("team_transfer_success"), {
        icon: <CheckCircle className="w-4 h-4" />,
        className: "success-toast",
      });
      setShowTransferOnly(false);
      setTransferTarget(null);
      onTeamChange?.();
      // Trigger auth refresh to update user info
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }
      window.location.reload();
    } catch (err: any) {
      toast.error(t("team_transfer_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferAndLeave = async (newOwnerId: number) => {
    setTransferring(true);
    try {
      await axios.post("/api/teams/transfer-owner", { teamId: team.id, newOwnerId });
      await axios.post("/api/teams/leave");
      toast.success(t("team_transfer_and_leave_success"), {
        icon: <CheckCircle className="w-4 h-4" />,
        className: "success-toast",
      });
      setShowTransferForLeave(false);
      setTransferTarget(null);
      onTeamChange?.();
      // Trigger auth refresh to update user info
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }
      window.location.reload();
    } catch (err: any) {
      toast.error(t("team_transfer_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setTransferring(false);
    }
  };

  const handleDisband = async () => {
    setDisbanding(true);
    setDisbandError(null);
    try {
      await axios.post("/api/teams/disband", { teamId: team.id });
      toast.success(t("team_disband_success"), {
        icon: <CheckCircle className="w-4 h-4" />,
        className: "success-toast",
      });
      setShowDisband(false);
      // Update local state instead of reloading
      onTeamChange?.();
      // Trigger auth refresh to update user info
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }
      window.location.reload();
    } catch (err: any) {
      setDisbandError(t("team_disband_failed"));
      toast.error(t("team_disband_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setDisbanding(false);
    }
  };

  const handleCreatorSoloLeave = async () => {
    await handleDisband();
  };

  const handleKick = async (userId: number, username: string) => {
    setKickLoading(true);
    try {
      await axios.post("/api/teams/kick", { teamId: team.id, userId });
      toast.success(t("team_kick_success"), {
        icon: <CheckCircle className="w-4 h-4" />,
        className: "success-toast",
      });
      setShowKickDialog(false);
      setKickTarget(null);
      onTeamChange?.();
      // Trigger auth refresh to update user info
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }
    } catch (err) {
      toast.error(t("team_kick_failed"), { className: "bg-red-600 text-white" });
      setShowKickDialog(false);
      setKickTarget(null);
    } finally {
      setKickLoading(false);
    }
  };

  // Handler wrappers for style components
  const onKick = (user: User) => { setKickTarget(user); setShowKickDialog(true); };
  const onTransfer = (user: User) => { setTransferTarget(user); setShowTransferOnly(true); };
  const onConfirmKick = () => { if (kickTarget) handleKick(kickTarget.id, kickTarget.username); };
  const onCancelKick = () => { setKickTarget(null); setShowKickDialog(false); };
  const onConfirmTransfer = () => { if (transferTarget) handleTransferOnly(transferTarget.id); };
  const onCancelTransfer = () => { setTransferTarget(null); setShowTransferOnly(false); };

  const renderTeamView = () => (
    <ClassicTeamView
      team={team}
      members={members}
      currentUser={currentUser}
      isCreator={isCreator}
      otherMembers={otherMembers}
      onKick={onKick}
      onTransfer={onTransfer}
      kickTarget={kickTarget}
      showKickDialog={showKickDialog}
      setShowKickDialog={setShowKickDialog}
      onConfirmKick={onConfirmKick}
      onCancelKick={onCancelKick}
      transferTarget={transferTarget}
      setTransferTarget={setTransferTarget}
      showTransferDialog={showTransferOnly}
      setShowTransferDialog={setShowTransferOnly}
      onConfirmTransfer={onConfirmTransfer}
      onCancelTransfer={onCancelTransfer}
      kickLoading={kickLoading}
      transferring={transferring}
      t={t}
      showLeaveDialog={showLeaveDialog}
      setShowLeaveDialog={setShowLeaveDialog}
      showDisbandDialog={showDisbandDialog}
      setShowDisbandDialog={setShowDisbandDialog}
      leaving={leaving}
      disbanding={disbanding}
      handleLeaveClick={handleLeaveClick}
      handleDisbandClick={handleDisbandClick}
      onConfirmLeave={onConfirmLeave}
      onConfirmDisband={onConfirmDisband}
      memberPointsMap={memberPointsMap}
      totalPoints={totalPoints}
      spentOnHints={spentOnHints}
    />
  );

  return (
    <div className="space-y-4">
      {/* Team View */}
      {renderTeamView()}

      {/* All the dialogs */}
      <AlertDialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('kick')}</AlertDialogTitle>
            <AlertDialogDescription>
              {kickTarget && t('team_kick_confirm', { username: kickTarget.username })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelKick}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmKick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={kickLoading}
            >
              {t('kick')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTransferOnly} onOpenChange={setShowTransferOnly}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transfer_ownership')}</AlertDialogTitle>
            <AlertDialogDescription>
              {transferTarget && t('choose_new_owner', { username: transferTarget.username })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelTransfer}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmTransfer}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={transferring}
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leave_team')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team_leave_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLeaveDialog(false)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmLeave}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              disabled={leaving}
            >
              {t('leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDisbandDialog} onOpenChange={setShowDisbandDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('disband_team')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team_disband_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDisbandDialog(false)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDisband}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={disbanding}
            >
              {t('disband')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCreatorLeaveChoice} onOpenChange={setShowCreatorLeaveChoice}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leave_team')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('as_creator_leave_choice')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                setShowCreatorLeaveChoice(false);
                setShowDisbandDialog(true);
              }}
            >
              {t('disband_team')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatorLeaveChoice(false);
                setShowTransferOnly(true);
              }}
            >
              {t('transfer_ownership_and_leave')}
            </Button>
            <AlertDialogCancel onClick={() => setShowCreatorLeaveChoice(false)}>{t('cancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 