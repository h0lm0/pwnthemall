import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "@/lib/axios";
import { AxiosResponse } from "axios";
import { User } from "@/models/User";
import { Team } from "@/models/Team";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { TeamManagementSection } from "@/components/TeamManagementSection";
import { toast } from "sonner";
import Link from "next/link";
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

const TABS = ["Account", "Appearance", "Badges", "Team"] as const;
type Tab = typeof TABS[number];

interface ExtendedUser extends User {
  points?: number;
  challengesCompleted?: number;
  discordUsername?: string;
  ranking?: number;
  description?: string;
  teamId?: number;
  team?: Team;
  totalChallenges?: number;
}

export default function ProductionProfileCard() {
  const { t } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Profile card state
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('profileActiveTab');
  if (saved && ["Account", "Appearance", "Badges", "Team"].includes(saved)) {
        return saved as Tab;
      }
    }
    return "Account";
  });
  
  // Username state
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [confirmUsername, setConfirmUsername] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwValidationError, setPwValidationError] = useState<string | null>(null);
  const [pwTooLongError, setPwTooLongError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState(false);
  
  // Team state
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Handle toast messages from localStorage
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

    setLoading(true);
    axios.get("/api/me").then((res: AxiosResponse<any>) => {
      // Use real backend data - no mock values
      const realUser: ExtendedUser = {
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        banned: res.data.banned || false,
        points: res.data.points || null, // Use null instead of 0 to show N/A
        challengesCompleted: res.data.challengesCompleted || null,
        discordUsername: res.data.discordUsername || null,
        memberSince: res.data.createdAt || res.data.memberSince || null,
        ranking: res.data.ranking || null,
        description: res.data.description || null,
        teamId: res.data.teamId || null,
        team: res.data.team || null,
        totalChallenges: res.data.totalChallenges || null,
      };
      
      setUser(realUser);
      setUsername(res.data.username);
      setNewUsername(res.data.username);
      setCurrentUser({
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        banned: res.data.banned || false,
      });
      
      // Team info
      if (res.data.teamId && res.data.team) {
        setTeamLoading(true);
        setTeam(res.data.team as Team);
        setMembers(res.data.team.members as User[]);
        setTeamError(null);
        setTeamLoading(false);
      } else {
        setTeam(null);
        setMembers([]);
        setTeamLoading(false);
      }
    }).catch(() => {
      setUser(null);
      setUsername("");
      setNewUsername("");
      setCurrentUser(null);
      setTeam(null);
      setMembers([]);
      setTeamLoading(false);
    }).finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileActiveTab', activeTab);
    }
  }, [activeTab]);

  // Username handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    if (e.target.value.length > 32) {
      setUsernameError("Username too long (max 32)");
    } else {
      setUsernameError(null);
    }
  };

  const handleUpdate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res: AxiosResponse<any> = await axios.patch("/api/me", { username: newUsername });
      setUsername(res.data.username);
      setNewUsername(res.data.username);
      localStorage.setItem("showToast", JSON.stringify({ type: "success", message: "username_updated" }));
      window.location.reload();
    } catch (err: any) {
      toast.error(t(err?.response?.data?.error || "Failed to update username"), { className: "bg-red-600 text-white" });
    }
    setConfirmUsername(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete("/api/me");
      toast.success(t("delete_account_confirm"));
      window.location.href = "/login";
    } catch (err: any) {
      toast.error(t(err?.response?.data?.error || "Failed to delete account"), { className: "bg-red-600 text-white" });
    }
  };

  // Password handlers
  const handleCurrentPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
  };

  const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (e.target.value.length > 0 && e.target.value.length < 8) {
      setPwValidationError("Password must be at least 8 characters long");
    } else {
      setPwValidationError(null);
    }
    if (e.target.value.length > 72) {
      setPwTooLongError("Password too long (max 72)");
    } else {
      setPwTooLongError(null);
    }
  };

  const handlePasswordChange = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setPwLoading(true);
    try {
      await axios.put("/api/me/password", { current: currentPassword, new: newPassword });
      toast.success(t("password_updated"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(t(err?.response?.data?.error || "Failed to update password"), { className: "bg-red-600 text-white" });
    } finally {
      setPwLoading(false);
      setConfirmPassword(false);
    }
  };

  // Theme selector
  const themes = [
    { value: "light", label: "Light", previewLeft: "#ffffff", previewRight: "#f1f5f9" },
    { value: "latte", label: "Latte", previewLeft: "#e6e9ef", previewRight: "#bcc0cc" },
    { value: "cyberpunk", label: "Cyberpunk", previewLeft: "#1a1a2e", previewRight: "#e91e63" },
    { value: "rose", label: "Rose", previewLeft: "#fffafc", previewRight: "#fee4f1" },
    { value: "emerald", label: "Emerald", previewLeft: "#eefbf5", previewRight: "#d5f5e7" },
    { value: "violet", label: "Violet", previewLeft: "#faf5ff", previewRight: "#f0e1fe" },
    { value: "cyan", label: "Cyan", previewLeft: "#f4ffff", previewRight: "#dfffff" },
    { value: "orange", label: "Orange", previewLeft: "#fffaf5", previewRight: "#ffefe1" },
    { value: "dark", label: "Dark", previewLeft: "#010916", previewRight: "#1c2a3a" },
    { value: "macchiato", label: "Macchiato", previewLeft: "#222738", previewRight: "#353a4e" },
    { value: "mocha", label: "Mocha", previewLeft: "#1e1f2e", previewRight: "#313343" },
    { value: "slate", label: "Slate", previewLeft: "#0d1728", previewRight: "#475769" },
  ];

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100/80 via-blue-100/20 to-indigo-100/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 p-4">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl h-96 border border-primary/20" />
          <div className="animate-pulse bg-muted rounded-lg h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100/80 via-blue-100/20 to-indigo-100/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 p-4 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30">
          <CardContent className="p-6 text-center">
            <span className="text-destructive">User not found</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100/80 via-blue-100/20 to-indigo-100/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 p-4">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="w-full max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-card via-muted/50 to-card border-2 border-primary/30 shadow-2xl shadow-primary/10 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse"></div>
            <CardContent className="p-8 text-card-foreground relative z-10">
              {/* Header Section */}
              <div className="flex items-start gap-6 mb-8">
                {/* Avatar */}
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-lg shadow-primary/30">
                    <img
                      src="/logo-no-text.png"
                      alt="Profile Avatar"
                      className="w-full h-full rounded-full object-cover border-2 border-background/20"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-3 border-background/30 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-foreground">
                      {user.username}
                    </h1>
                    {user.ranking && (
                      <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 px-3 py-1">
                        {t('ranking')} #{user.ranking}
                      </Badge>
                    )}
                  </div>
                  
                  {/* User Description or Role */}
                  <div className="mb-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {user.description || `${t('role')}: ${user.role}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t('points')}
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {user.points !== null ? user.points : "N/A"}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t('challenges_completed')}
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {user.challengesCompleted !== null && user.totalChallenges !== undefined
                      ? `${user.challengesCompleted}/${user.totalChallenges}`
                      : user.challengesCompleted !== null
                        ? `${user.challengesCompleted}`
                        : "N/A"}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Discord
                  </div>
                  <div className="text-lg font-medium text-foreground truncate">
                    {user.discordUsername || "N/A"}
                  </div>
                </div>
              </div>

              {/* User Info Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{user.role}</span> • {user.email}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('member_since')}: {formatDate(user.memberSince)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Card className="p-0">
          <div className="flex border-b">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab(tab)}
              >
                {t(tab.toLowerCase())}
              </button>
            ))}
          </div>
          <CardContent className="p-6">
            {activeTab === "Account" && (
              <div className="space-y-6 max-w-md">
                {/* Account Settings Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('account_settings')}</h3>
                  <form className="space-y-4" onSubmit={handleUpdate}>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="username">{t('username')}</label>
                  <Input
                    id="username"
                    name="username"
                    value={newUsername}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    maxLength={32}
                  />
                  {usernameError && <span className="text-red-500 text-xs">{t('username_too_long')}</span>}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={loading || newUsername === username || !newUsername}
                  onClick={() => setConfirmUsername(true)}
                >
                  {t('update_username')}
                </Button>
                
                <AlertDialog open={confirmUsername} onOpenChange={setConfirmUsername}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('change_username')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('change_username_confirm', { username: newUsername })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUpdate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {t('confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                  </form>
                </div>
                
                <Separator className="my-6" />
                
                {/* Security Settings Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('security_settings')}</h3>
                  <form className="space-y-4" onSubmit={handlePasswordChange}>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="current">{t('current_password')}</label>
                  <Input id="current" name="current" type="password" value={currentPassword} onChange={handleCurrentPasswordChange} required autoComplete="current-password" disabled={pwLoading} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="new">{t('new_password')}</label>
                  <Input id="new" name="new" type="password" value={newPassword} onChange={handleNewPasswordChange} required autoComplete="new-password" disabled={pwLoading} maxLength={72} />
                  {pwValidationError && <span className="text-red-500 text-xs">{pwValidationError}</span>}
                  {pwTooLongError && <span className="text-red-500 text-xs">{pwTooLongError}</span>}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={pwLoading || !currentPassword || !newPassword || newPassword.length < 8}
                  onClick={() => setConfirmPassword(true)}
                >
                  {t('change_password')}
                </Button>
                
                <AlertDialog open={confirmPassword} onOpenChange={setConfirmPassword}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('change_password')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('change_password_confirm')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePasswordChange} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {t('confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </form>
                </div>

                <Separator className="my-6" />
                
                {/* Danger Zone */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-destructive">{t('danger_zone')}</h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" className="w-full" disabled={loading}>
                        {t('delete_account')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('delete_account')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('delete_account_confirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {t('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            
            {activeTab === "Appearance" && (
              <div className="space-y-6 w-full">
                <h2 className="text-xl font-semibold mb-2">{t('theme')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                  {themes.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors relative overflow-hidden w-full ${theme === t.value ? "border-primary ring-2 ring-primary" : ""}`}
                      style={{ minHeight: 64, background: `linear-gradient(135deg, ${t.previewLeft} 50%, ${t.previewRight} 50%)` }}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={t.value}
                        checked={theme === t.value || (theme === undefined && resolvedTheme === t.value)}
                        onChange={() => setTheme(t.value)}
                        style={{ display: "none" }}
                      />
                      <span className="font-semibold z-10 bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-white drop-shadow-lg border border-white/20">{t.label}</span>
                      {(theme === t.value || (theme === undefined && resolvedTheme === t.value)) && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs z-10 px-2 py-1 rounded font-medium">Active</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === "Badges" && (
              <div className="space-y-6 w-full">
                <p className="text-sm text-muted-foreground text-center">
                  {t('no_badges_yet')}
                </p>
              </div>
            )}
            
            {activeTab === "Team" && (
              <div className="space-y-4 w-full">
                {teamLoading ? (
                  <div>{t('loading')}...</div>
                ) : team && currentUser ? (
                  <TeamManagementSection team={team} members={members} currentUser={currentUser} onTeamChange={() => {}} />
                ) : (
                  <div className="flex flex-col items-start gap-4">
                    <div className="text-red-600">{t('not_in_team')}</div>
                    <Link href="/team" passHref legacyBehavior>
                      <Button type="button" variant="default">
                        {t('join_or_create_team')}
                      </Button>
                    </Link>
                  </div>
                )}
                {teamError && <div className="text-red-600 mt-2">{t(teamError)}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 