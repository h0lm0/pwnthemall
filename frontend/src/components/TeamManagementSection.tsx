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

interface TeamManagementSectionProps {
  team: Team;
  members: User[];
  currentUser: User;
  onTeamChange?: () => void;
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

  const isCreator = team.creatorId === currentUser.id;
  const otherMembers = members.filter(m => m.id !== currentUser.id);
  const isAlone = otherMembers.length === 0;

  useEffect(() => {
    // Show toast if flag is set in localStorage (for post-reload popups)
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
      await fetch("/api/teams/leave", { method: "POST" });
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
      // First transfer ownership
      const transferRes = await fetch("/api/teams/transfer-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, newOwnerId }),
      });
      
      if (!transferRes.ok) {
        throw new Error("Transfer failed");
      }

      // Then leave the team
      await fetch("/api/teams/leave", { method: "POST" });
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
      const res = await fetch("/api/teams/transfer-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, newOwnerId }),
      });
      
      if (!res.ok) {
        throw new Error("Transfer failed");
      }
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
      await fetch("/api/teams/disband", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id }),
      });
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

  // Handle creator solo case - leave team actually disbands
  const handleCreatorSoloLeave = async () => {
    await handleDisband();
  };

  const handleKick = async (userId: number, username: string) => {
    setKickLoading(true);
    try {
      const res = await fetch("/api/teams/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, userId }),
      });
      if (!res.ok) throw new Error();
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

  return (
    <div className="space-y-4">
      <div>
        <span className="font-semibold">{t('team_name')}:</span> {team.name}
      </div>
      <div>
        <span className="font-semibold">{t('members')}:</span>
        <ul className="list-disc ml-6">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              {m.username}
              {m.id === team.creatorId && <span className="text-muted-foreground ml-2">({t('creator')})</span>}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Member: only show Leave Team */}
      {!isCreator && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" className="w-full" disabled={leaving}>
              {t('leave_team')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('leave_team')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('leave_team_confirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSimpleLeave}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('leave')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Creator solo: only show Leave Team (which disbands) */}
      {isCreator && isAlone && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" className="w-full" disabled={disbanding}>
              {t('leave_team')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('leave_team')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('leave_team_solo_confirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreatorSoloLeave}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('leave')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Creator with members: show all three buttons */}
      {isCreator && !isAlone && (
        <>
          {/* Disband Team Button */}
          <Button 
            type="button" 
            variant="destructive" 
            className="w-full" 
            onClick={() => setShowDisband(true)} 
            disabled={disbanding}
          >
            {t('disband_team')}
          </Button>
          {/* Kick Member Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowKickDialog(true)}
            disabled={kickLoading}
          >
            {t('delete')}
          </Button>
          {/* Kick Member Dialog */}
          <AlertDialog open={showKickDialog} onOpenChange={setShowKickDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('team_kick_confirm', { username: '' })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 my-4">
                {otherMembers.filter(m => m.id !== team.creatorId).map((m) => (
                  <Button
                    key={m.id}
                    onClick={() => setKickTarget(m)}
                    disabled={kickLoading}
                    variant="outline"
                  >
                    {m.username}
                  </Button>
                ))}
              </div>
              {kickTarget && (
                <div className="mt-4">
                  <div className="mb-2 text-center">{t('team_kick_confirm', { username: kickTarget.username })}</div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleKick(kickTarget.id, kickTarget.username)}
                      disabled={kickLoading}
                    >
                      {t('delete')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setKickTarget(null)}
                      disabled={kickLoading}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setKickTarget(null)}>{t('cancel')}</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Leave Team Button */}
          <Button 
            type="button" 
            variant="destructive" 
            className="w-full" 
            onClick={() => setShowTransferForLeave(true)} 
            disabled={leaving}
          >
            {t('leave_team')}
          </Button>
          
          {/* Transfer Ownership Button */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowTransferOnly(true)} 
            disabled={transferring}
          >
            {t('transfer_ownership')}
          </Button>
          
          {/* Disband Team Dialog */}
          <AlertDialog open={showDisband} onOpenChange={setShowDisband}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('disband_team')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('disband_team_confirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {disbandError && <div className="text-red-600 mt-2">{disbandError}</div>}
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDisband} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                  disabled={disbanding}
                >
                  {t('disband')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Transfer and Leave Dialog */}
          <AlertDialog open={showTransferForLeave} onOpenChange={setShowTransferForLeave}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('leave_team')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('choose_new_owner_before_leaving')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 my-4">
                {otherMembers.map((m) => (
                  <Button 
                    key={m.id} 
                    onClick={() => handleTransferAndLeave(m.id)} 
                    disabled={transferring}
                    variant="outline"
                  >
                    {m.username}
                  </Button>
                ))}
                {transferError && <div className="text-red-600 mt-2">{transferError}</div>}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Transfer Only Dialog */}
          <AlertDialog open={showTransferOnly} onOpenChange={setShowTransferOnly}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('transfer_ownership')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('choose_new_owner')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 my-4">
                {otherMembers.map((m) => (
                  <Button 
                    key={m.id} 
                    onClick={() => handleTransferOnly(m.id)} 
                    disabled={transferring}
                    variant="outline"
                  >
                    {m.username}
                  </Button>
                ))}
                {transferError && <div className="text-red-600 mt-2">{transferError}</div>}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      
      {leaveMsg && <div className="text-green-600 mt-2">{t(leaveMsg)}</div>}
      {leaveError && <div className="text-red-600 mt-2">{leaveError}</div>}
    </div>
  );
}; 