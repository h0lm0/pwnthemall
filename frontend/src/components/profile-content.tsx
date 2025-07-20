import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios, { AxiosResponse } from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

const TABS = ["Account", "Security", "Appearance", "Team"] as const;
type Tab = typeof TABS[number];

export default function ProfileContent() {
  const { loggedIn, authChecked } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  if (!authChecked) return null;
  if (!loggedIn) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }
  // Theme class logic for palette
  const themes = [
    { value: "light",      label: "Light",      previewLeft: "#", previewRight: "#" },
    { value: "latte",      label: "Latte",      previewLeft: "#", previewRight: "#" },
    { value: "rose",       label: "Rose",       previewLeft: "#", previewRight: "#" },
    { value: "emerald",    label: "Emerald",    previewLeft: "#", previewRight: "#" },
    { value: "violet",     label: "Violet",     previewLeft: "#", previewRight: "#" },
    { value: "cyan",       label: "Cyan",       previewLeft: "#", previewRight: "#" },
    { value: "orange",     label: "Orange",     previewLeft: "#", previewRight: "#" },
    { value: "dark",       label: "Dark",       previewLeft: "#", previewRight: "#" },
    { value: "frappe",     label: "Frappe",     previewLeft: "#", previewRight: "#" },
    { value: "macchiato",  label: "Macchiato",  previewLeft: "#", previewRight: "#" },
    { value: "mocha",      label: "Mocha",      previewLeft: "#", previewRight: "#" },
    { value: "slate",      label: "Slate",      previewLeft: "#", previewRight: "#" },
  ];
  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  return <ProfileContentInner />;
}

function ProfileContentInner() {
  const [activeTab, setActiveTab] = useState<Tab>("Account");
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwValidationError, setPwValidationError] = useState<string | null>(null);
  const [pwTooLongError, setPwTooLongError] = useState<string | null>(null);
  const [confirmUsername, setConfirmUsername] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState(false);

  // Team state
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/me").then((res: AxiosResponse<any>) => {
      setUsername(res.data.username);
      setNewUsername(res.data.username);
      // fetch team info
      if (res.data.teamId) {
        setTeamLoading(true);
        axios.get(`/api/teams/${res.data.teamId}`)
          .then((r) => {
            setTeam(r.data.team);
            setMembers(r.data.members);
            setTeamError(null);
          })
          .catch(() => {
            setTeam(null);
            setMembers([]);
            setTeamError("Failed to fetch team info");
          })
          .finally(() => setTeamLoading(false));
      } else {
        setTeam(null);
        setMembers([]);
        setTeamLoading(false);
      }
    }).catch(() => {
      setUsername("");
      setNewUsername("");
      setTeam(null);
      setMembers([]);
      setTeamLoading(false);
    }).finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    setMessage(null);
    setError(null);
    if (e.target.value.length > 32) {
      setUsernameError("Username too long (max 32)");
    } else {
      setUsernameError(null);
    }
  };

  // Username update handler (no change)
  const handleUpdate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res: AxiosResponse<any> = await axios.patch("/api/me", { username: newUsername });
      setUsername(res.data.username);
      setMessage("Username updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update username");
    }
    setConfirmUsername(false);
  };

  const handleDelete = async () => {
    setMessage(null);
    setError(null);
    try {
      await axios.delete("/api/me");
      window.location.href = "/login";
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to delete account");
    }
  };

  // Password change handlers
  const handleCurrentPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
    setPwMessage(null);
    setPwError(null);
  };
  const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setPwMessage(null);
    setPwError(null);
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
  // Password change handler (no change)
  const handlePasswordChange = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setPwMessage(null);
    setPwError(null);
    setPwLoading(true);
    try {
      await axios.put("/api/me/password", { current: currentPassword, new: newPassword });
      setPwMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwError(err?.response?.data?.error || "Failed to update password");
    } finally {
      setPwLoading(false);
      setConfirmPassword(false);
    }
  };

  const handleLeaveTeam = async () => {
    setLeaving(true);
    setLeaveMsg(null);
    setLeaveError(null);
    try {
      await axios.post("/api/teams/leave");
      setLeaveMsg("You have left the team.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setLeaveError(err?.response?.data?.error || "Failed to leave team");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <Card className="p-0">
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <CardContent className="p-6">
        {activeTab === "Account" && (
          <form className="space-y-4 max-w-md" onSubmit={handleUpdate}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
              <Input
                id="username"
                name="username"
                value={newUsername}
                onChange={handleInputChange}
                required
                disabled={loading}
                maxLength={32}
              />
              {usernameError && <span className="text-red-500 text-xs">{usernameError}</span>}
            </div>
            <div style={{ minHeight: 24 }}>
              {error && <div className="text-red-600 mt-2">{error}</div>}
              {!error && message && <div className="text-green-600 mt-2">{message}</div>}
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={loading || newUsername === username || !newUsername}
              onClick={() => setConfirmUsername(true)}
            >
              Update Username
            </Button>
            <AlertDialog open={confirmUsername} onOpenChange={setConfirmUsername}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Username</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to change your username to <b>{newUsername}</b>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUpdate}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Separator className="my-6" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="w-full" disabled={loading}>
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        )}
        {activeTab === "Security" && (
          <form className="space-y-4 max-w-md" onSubmit={handlePasswordChange}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="current">Current Password</label>
              <Input id="current" name="current" type="password" value={currentPassword} onChange={handleCurrentPasswordChange} required autoComplete="current-password" disabled={pwLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="new">New Password</label>
              <Input id="new" name="new" type="password" value={newPassword} onChange={handleNewPasswordChange} required autoComplete="new-password" disabled={pwLoading} maxLength={72} />
            </div>
            <div style={{ minHeight: 24 }}>
              {pwValidationError && <div className="text-red-600 mt-2">{pwValidationError}</div>}
              {pwTooLongError && <div className="text-red-600 mt-2">{pwTooLongError}</div>}
              {pwError && <div className="text-red-600 mt-2">{pwError}</div>}
              {!pwError && !pwValidationError && pwMessage && <div className="text-green-600 mt-2">{pwMessage}</div>}
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={pwLoading || !currentPassword || !newPassword || newPassword.length < 8}
              onClick={() => setConfirmPassword(true)}
            >
              Change Password
            </Button>
            <AlertDialog open={confirmPassword} onOpenChange={setConfirmPassword}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to change your password?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePasswordChange}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        )}
        {activeTab === "Appearance" && (
          <>
            <ThemeSelector />
          </>
        )}
        {activeTab === "Team" && (
          <div className="space-y-4 max-w-md">
            {teamLoading ? (
              <div>Loading team info...</div>
            ) : team ? (
              <>
                <div>
                  <span className="font-semibold">Team name:</span> {team.name}
                </div>
                <div>
                  <span className="font-semibold">Members:</span>
                  <ul className="list-disc ml-6">
                    {members.map((m) => (
                      <li key={m.id}>{m.username}</li>
                    ))}
                  </ul>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full" disabled={leaving}>
                      Leave Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Team</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave your team?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLeaveTeam}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Leave
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {leaveMsg && <div className="text-green-600 mt-2">{leaveMsg}</div>}
                {leaveError && <div className="text-red-600 mt-2">{leaveError}</div>}
              </>
            ) : (
              <div className="text-red-600">You are not in a team.</div>
            )}
            {teamError && <div className="text-red-600 mt-2">{teamError}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const themes = [
    { value: "light",      label: "Light",      previewLeft: "#ffffff", previewRight: "#f1f5f9" },
    { value: "latte",      label: "Latte",      previewLeft: "#eff1f5", previewRight: "#ccd1da" },
    { value: "rose",       label: "Rose",       previewLeft: "#fffafc", previewRight: "#fee4f1" },
    { value: "emerald",    label: "Emerald",    previewLeft: "#eefbf5", previewRight: "#d5f5e7" },
    { value: "violet",     label: "Violet",     previewLeft: "#faf5ff", previewRight: "#f0e1fe" },
    { value: "cyan",       label: "Cyan",       previewLeft: "#f4ffff", previewRight: "#dfffff" },
    { value: "orange",     label: "Orange",     previewLeft: "#fffaf5", previewRight: "#ffefe1" },
    { value: "dark",       label: "Dark",       previewLeft: "#010916", previewRight: "#1c2a3a" },
    { value: "frappe",     label: "Frappe",     previewLeft: "#2f3445", previewRight: "#60687e" },
    { value: "macchiato",  label: "Macchiato",  previewLeft: "#222738", previewRight: "#353a4e" },
    { value: "mocha",      label: "Mocha",      previewLeft: "#1e1f2e", previewRight: "#313343" },
    { value: "slate",      label: "Slate",      previewLeft: "#0d1728", previewRight: "#475769" },
  ];
  return (
    <div className="space-y-6 w-full">
      <h2 className="text-xl font-semibold mb-2">Theme</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {themes.map((t) => (
          <ThemePreviewRadio
            key={t.value}
            value={t.value}
            label={t.label}
            previewLeft={t.previewLeft}
            previewRight={t.previewRight}
            checked={theme === t.value || (theme === undefined && resolvedTheme === t.value)}
            onChange={() => setTheme(t.value)}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2">Your theme preference is saved in your browser and will be used across the site.</div>
    </div>
  );
}

function ThemePreviewRadio({ value, label, previewLeft, previewRight, checked, onChange }: { value: string, label: string, previewLeft: string, previewRight: string, checked: boolean, onChange: () => void }) {
  return (
    <label
      className={`theme-preview flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors relative overflow-hidden w-full ${checked ? "border-primary ring-2 ring-primary" : ""}`}
      style={{ minHeight: 64, background: `linear-gradient(135deg, ${previewLeft} 50%, ${previewRight} 50%)` }}
    >
      <input
        type="radio"
        name="theme"
        value={value}
        className="theme-radio z-10"
        checked={checked}
        onChange={onChange}
        style={{ display: "none" }}
      />
      <span className="custom-radio-dot" aria-hidden="true"></span>
      <span className="font-semibold z-10 bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-white drop-shadow-lg border border-white/20">{label}</span>
      {checked ? (
        <span className="ml-auto bg-primary text-primary-foreground text-xs z-10 px-2 py-1 rounded font-medium">Active</span>
      ) : null}
      <span className="absolute inset-0 pointer-events-none" />
    </label>
  );
} 