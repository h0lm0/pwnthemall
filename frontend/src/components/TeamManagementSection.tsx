import React, { useState, useEffect } from "react";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { Button } from "@/components/ui/button";
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
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamManagementSectionProps {
  team: Team;
  members: User[];
  currentUser: User;
  onTeamChange?: () => void;
}

export const TEAM_STYLES = [
  { key: "classic", label: "Classic" },
];

// Update TeamStyleViewProps to accept all handlers and dialog state
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
}

// --- TEAM STYLE COMPONENTS ---

// Classic: Table style
function ClassicTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
}: TeamStyleViewProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-background p-4">
      <div className="font-bold mb-2">{team.name}</div>
      {/* Global Disband Button for Leader */}
      {isCreator && (
        <div className="mb-4">
          <Button
            variant="destructive"
            onClick={handleDisbandClick}
            disabled={disbanding}
          >
            {t('disband_team')}
          </Button>
        </div>
      )}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-3 text-left">Username</th>
            <th className="py-2 px-3 text-left">Role</th>
            <th className="py-2 px-3 text-left">Score</th>
            <th className="py-2 px-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b hover:bg-muted group">
              <td className="py-2 px-3 flex items-center gap-2">
                <Avatar className="transition-shadow group-hover:shadow-lg group-hover:ring-2 group-hover:ring-primary">
                  <AvatarFallback>{m.username[0]}</AvatarFallback>
                </Avatar>
                <span>{m.username}</span>
              </td>
              <td className="py-2 px-3">
                {m.id === team.creatorId ? <span className="text-yellow-500 font-bold">Creator</span> : "Member"}
              </td>
              <td className="py-2 px-3">
                <span className="inline-flex items-center gap-1"><StarIcon className="w-4 h-4 text-yellow-400 inline" />0</span>
              </td>
              <td className="py-2 px-3 flex gap-2">
                {isCreator && m.id !== currentUser.id && m.id !== team.creatorId && (
                  <Button size="icon" variant="destructive" onClick={() => onKick(m)} disabled={kickLoading}>
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                )}
                {isCreator && m.id !== team.creatorId && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-white border border-gray-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                    onClick={() => onTransfer(m)}
                    disabled={transferring}
                  >
                    <UserGroupIcon className="w-5 h-5" />
                  </Button>
                )}
                {/* Leave or Disband actions */}
                {m.id === currentUser.id && (
                  isCreator ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border border-gray-300 text-red-600 opacity-50 cursor-not-allowed"
                      disabled
                      title={t('leader_cannot_leave')}
                    >
                      {t('leave')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border border-gray-300 text-red-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400"
                      onClick={handleLeaveClick}
                      disabled={leaving}
                    >
                      {t('leave')}
                    </Button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Kick Dialog */}
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
      {/* Transfer Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
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
      {/* Leave Dialog */}
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
      {/* Disband Dialog */}
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
    </div>
  );
}

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
  const [activeStyle, setActiveStyle] = useState("classic");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDisbandDialog, setShowDisbandDialog] = useState(false);
  const [showCreatorLeaveChoice, setShowCreatorLeaveChoice] = useState(false);

  const isCreator = team.creatorId === currentUser.id;
  const otherMembers = members.filter(m => m.id !== currentUser.id);
  const isAlone = otherMembers.length === 0;

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
      await handleSimpleLeave();
      setShowLeaveDialog(false);
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
          toast.success(t(message));
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
      setTimeout(() => window.location.reload(), 200);
    } catch (err: any) {
      setLeaveError(t("team_leave_failed"));
      toast.error(t("team_leave_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setLeaving(false);
    }
  };

  const handleTransferAndLeave = async (newOwnerId: number) => {
    setTransferring(true);
    setTransferError(null);
    try {
      await axios.post("/api/teams/transfer-owner", { teamId: team.id, newOwnerId });
      await axios.post("/api/teams/leave");
      localStorage.setItem("showToast", JSON.stringify({ type: "success", message: t("team_transfer_and_leave_success") }));
      setShowTransferForLeave(false);
      onTeamChange?.();
      setTimeout(() => window.location.reload(), 200);
    } catch (err: any) {
      setTransferError(t("team_transfer_failed"));
      toast.error(t("team_transfer_failed"), { className: "bg-red-600 text-white" });
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferOnly = async (newOwnerId: number) => {
    setTransferring(true);
    setTransferError(null);
    try {
      await axios.post("/api/teams/transfer-owner", { teamId: team.id, newOwnerId });
      localStorage.setItem("showToast", JSON.stringify({ type: "success", message: t("team_transfer_success") }));
      setShowTransferOnly(false);
      onTeamChange?.();
      setTimeout(() => window.location.reload(), 200);
    } catch (err: any) {
      setTransferError(t("team_transfer_failed"));
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
      localStorage.setItem("showToast", JSON.stringify({ type: "success", message: t("team_disband_success") }));
      setShowDisband(false);
      onTeamChange?.();
      setTimeout(() => window.location.reload(), 200);
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
      localStorage.setItem("showToast", JSON.stringify({ type: "success", message: t("team_kick_success") }));
      setShowKickDialog(false);
      setKickTarget(null);
      onTeamChange?.();
      setTimeout(() => window.location.reload(), 200);
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

  return (
    <div className="space-y-4">
      {/* Removed style toggle button */}
      {/* Only render ClassicTeamView */}
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
      />
      {/* Creator leave choice dialog */}
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