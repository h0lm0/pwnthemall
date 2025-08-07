import React, { useState, useEffect } from "react";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeamManagementSectionProps {
  team: Team;
  members: User[];
  currentUser: User;
  onTeamChange?: () => void;
}

export const TEAM_STYLES = [
  { key: "classic", label: "Classic Table" },
  { key: "modern", label: "Modern Grid" },
  { key: "compact", label: "Compact List" },
  { key: "cards", label: "Member Cards" },
  { key: "minimal", label: "Minimal View" },
];

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

// Classic: Traditional table style
function ClassicTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
}: TeamStyleViewProps) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{team.name}</h3>
          {isCreator && (
            <Button variant="destructive" size="sm" onClick={handleDisbandClick} disabled={disbanding}>
              {t('disband_team')}
            </Button>
          )}
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
                    <span>0</span>
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

// Modern: Grid layout with cards
function ModernTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
}: TeamStyleViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{team.name}</h3>
        {isCreator && (
          <Button variant="destructive" onClick={handleDisbandClick} disabled={disbanding}>
            {t('disband_team')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <Card key={m.id} className="hover:shadow-lg transition-all duration-200 border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="text-lg font-semibold">{m.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">{m.username}</h4>
                  {m.id === team.creatorId ? (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      Creator
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Member</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">0 points</span>
                </div>
              </div>
              <div className="flex gap-2">
                {isCreator && m.id !== currentUser.id && m.id !== team.creatorId && (
                  <Button size="sm" variant="destructive" onClick={() => onKick(m)} disabled={kickLoading} className="flex-1">
                    {t('kick')}
                  </Button>
                )}
                {isCreator && m.id !== team.creatorId && (
                  <Button size="sm" variant="outline" onClick={() => onTransfer(m)} disabled={transferring} className="flex-1">
                    {t('transfer')}
                  </Button>
                )}
                {m.id === currentUser.id && !isCreator && (
                  <Button size="sm" variant="outline" onClick={handleLeaveClick} disabled={leaving} className="flex-1">
                    {t('leave')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Compact: Dense list view
function CompactTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
}: TeamStyleViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center pb-2 border-b">
        <h3 className="font-bold text-lg">{team.name}</h3>
        {isCreator && (
          <Button variant="destructive" size="sm" onClick={handleDisbandClick} disabled={disbanding}>
            {t('disband_team')}
          </Button>
        )}
      </div>
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">{m.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{m.username}</span>
            {m.id === team.creatorId && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Creator
              </Badge>
            )}
            <div className="flex items-center gap-1 ml-2">
              <StarIcon className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-muted-foreground">0</span>
            </div>
          </div>
          <div className="flex gap-1">
            {isCreator && m.id !== currentUser.id && m.id !== team.creatorId && (
              <Button size="icon" variant="destructive" onClick={() => onKick(m)} disabled={kickLoading} className="h-6 w-6">
                <TrashIcon className="w-3 h-3" />
              </Button>
            )}
            {isCreator && m.id !== team.creatorId && (
              <Button size="icon" variant="outline" onClick={() => onTransfer(m)} disabled={transferring} className="h-6 w-6">
                <UserGroupIcon className="w-3 h-3" />
              </Button>
            )}
            {m.id === currentUser.id && !isCreator && (
              <Button size="sm" variant="outline" onClick={handleLeaveClick} disabled={leaving} className="h-6 text-xs px-2">
                {t('leave')}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Cards: Individual member cards
function CardsTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
}: TeamStyleViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-bold text-2xl mb-2">{team.name}</h3>
        <p className="text-muted-foreground">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        {isCreator && (
          <Button variant="destructive" onClick={handleDisbandClick} disabled={disbanding} className="mt-3">
            {t('disband_team')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {members.map((m) => (
          <Card key={m.id} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="w-16 h-16 mx-auto">
                  <AvatarFallback className="text-2xl font-bold">{m.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-lg">{m.username}</h4>
                  {m.id === team.creatorId ? (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white mt-1">
                      Team Creator
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground">Team Member</p>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-lg">
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">0 points</span>
                </div>
                <div className="flex gap-2">
                  {isCreator && m.id !== currentUser.id && m.id !== team.creatorId && (
                    <Button variant="destructive" onClick={() => onKick(m)} disabled={kickLoading} className="flex-1">
                      {t('kick')}
                    </Button>
                  )}
                  {isCreator && m.id !== team.creatorId && (
                    <Button variant="outline" onClick={() => onTransfer(m)} disabled={transferring} className="flex-1">
                      {t('transfer')}
                    </Button>
                  )}
                  {m.id === currentUser.id && !isCreator && (
                    <Button variant="outline" onClick={handleLeaveClick} disabled={leaving} className="w-full">
                      {t('leave')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Minimal: Simple and clean
function MinimalTeamView({ team, members, currentUser, isCreator, otherMembers, onKick, onTransfer, kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick, transferTarget, setTransferTarget, showTransferDialog, setShowTransferDialog, onConfirmTransfer, onCancelTransfer, kickLoading, transferring, t,
  showLeaveDialog, setShowLeaveDialog, showDisbandDialog, setShowDisbandDialog, leaving, disbanding, handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
}: TeamStyleViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-lg">{team.name}</h3>
          <p className="text-sm text-muted-foreground">{members.length} members</p>
        </div>
        {isCreator && (
          <Button variant="ghost" onClick={handleDisbandClick} disabled={disbanding} className="text-destructive hover:text-destructive">
            {t('disband_team')}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{m.username}</span>
              {m.id === team.creatorId && (
                <span className="text-xs text-muted-foreground">(Creator)</span>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <StarIcon className="w-3 h-3" />
                <span>0</span>
              </div>
            </div>
            <div className="flex gap-1">
              {isCreator && m.id !== currentUser.id && m.id !== team.creatorId && (
                <Button size="sm" variant="ghost" onClick={() => onKick(m)} disabled={kickLoading} className="text-destructive hover:text-destructive h-auto py-1 px-2">
                  ×
                </Button>
              )}
              {isCreator && m.id !== team.creatorId && (
                <Button size="sm" variant="ghost" onClick={() => onTransfer(m)} disabled={transferring} className="h-auto py-1 px-2">
                  ↗
                </Button>
              )}
              {m.id === currentUser.id && !isCreator && (
                <Button size="sm" variant="ghost" onClick={handleLeaveClick} disabled={leaving} className="text-destructive hover:text-destructive h-auto py-1 px-2">
                  {t('leave')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
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

  const renderTeamView = () => {
    const commonProps = {
      team, members, currentUser, isCreator, otherMembers, onKick, onTransfer,
      kickTarget, showKickDialog, setShowKickDialog, onConfirmKick, onCancelKick,
      transferTarget, setTransferTarget, showTransferDialog: showTransferOnly,
      setShowTransferDialog: setShowTransferOnly, onConfirmTransfer, onCancelTransfer,
      kickLoading, transferring, t, showLeaveDialog, setShowLeaveDialog,
      showDisbandDialog, setShowDisbandDialog, leaving, disbanding,
      handleLeaveClick, handleDisbandClick, onConfirmLeave, onConfirmDisband
    };

    switch (activeStyle) {
      case "modern": return <ModernTeamView {...commonProps} />;
      case "compact": return <CompactTeamView {...commonProps} />;
      case "cards": return <CardsTeamView {...commonProps} />;
      case "minimal": return <MinimalTeamView {...commonProps} />;
      default: return <ClassicTeamView {...commonProps} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Style Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Management</h3>
          <p className="text-sm text-muted-foreground">Choose a display style</p>
        </div>
        <Select value={activeStyle} onValueChange={setActiveStyle}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            {TEAM_STYLES.map((style) => (
              <SelectItem key={style.key} value={style.key}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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