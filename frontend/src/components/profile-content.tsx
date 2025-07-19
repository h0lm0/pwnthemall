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
import { useLanguage } from "@/context/LanguageContext";

const TABS = ["account", "security", "appearance"] as const;
type Tab = typeof TABS[number];

export default function ProfileContent() {
  const { loggedIn, authChecked } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const { t } = useLanguage();
  
  if (!authChecked) return null;
  if (!loggedIn) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }
  // Theme class logic for palette
  const themes = [
    { value: "light",      label: t('light'),      previewLeft: "#", previewRight: "#" },
    { value: "latte",      label: "Latte",      previewLeft: "#", previewRight: "#" },
    { value: "rose",       label: "Rose",       previewLeft: "#", previewRight: "#" },
    { value: "emerald",    label: "Emerald",    previewLeft: "#", previewRight: "#" },
    { value: "violet",     label: "Violet",     previewLeft: "#", previewRight: "#" },
    { value: "cyan",       label: "Cyan",       previewLeft: "#", previewRight: "#" },
    { value: "orange",     label: "Orange",     previewLeft: "#", previewRight: "#" },
    { value: "dark",       label: t('dark'),       previewLeft: "#", previewRight: "#" },
    { value: "frappe",     label: "Frappe",     previewLeft: "#", previewRight: "#" },
    { value: "macchiato",  label: "Macchiato",  previewLeft: "#", previewRight: "#" },
    { value: "mocha",      label: "Mocha",      previewLeft: "#", previewRight: "#" },
    { value: "slate",      label: "Slate",      previewLeft: "#", previewRight: "#" },
  ];
  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  return <ProfileContentInner />;
}

function ProfileContentInner() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwValidationError, setPwValidationError] = useState<string | null>(null);
  const [confirmUsername, setConfirmUsername] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/me").then((res: AxiosResponse<any>) => {
      setUsername(res.data.username);
      setNewUsername(res.data.username);
    }).catch(() => {
      setUsername("");
      setNewUsername("");
    }).finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    setMessage(null);
    setError(null);
  };

  // Username update handler (no change)
  const handleUpdate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res: AxiosResponse<any> = await axios.patch("/api/me", { username: newUsername });
      setUsername(res.data.username);
      setMessage(t('username_updated'));
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
      setPwValidationError(t('password_validation_error'));
    } else {
      setPwValidationError(null);
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
      setPwMessage(t('password_updated'));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwError(err?.response?.data?.error || "Failed to update password");
    } finally {
      setPwLoading(false);
      setConfirmPassword(false);
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
            {t(tab)}
          </button>
        ))}
      </div>
      <CardContent className="p-6">
        {activeTab === "account" && (
          <form className="space-y-4 max-w-md" onSubmit={handleUpdate}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">{t('username')}</label>
              <Input
                id="username"
                name="username"
                value={newUsername}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
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
                  <AlertDialogAction
                    onClick={handleUpdate}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {t('confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Separator className="my-6" />
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
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        )}
        {activeTab === "security" && (
          <form className="space-y-4 max-w-md" onSubmit={handlePasswordChange}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="current">{t('current_password')}</label>
              <Input id="current" name="current" type="password" value={currentPassword} onChange={handleCurrentPasswordChange} required autoComplete="current-password" disabled={pwLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="new">{t('new_password')}</label>
              <Input id="new" name="new" type="password" value={newPassword} onChange={handleNewPasswordChange} required autoComplete="new-password" disabled={pwLoading} />
            </div>
            <div style={{ minHeight: 24 }}>
              {pwValidationError && <div className="text-red-600 mt-2">{pwValidationError}</div>}
              {pwError && <div className="text-red-600 mt-2">{pwError}</div>}
              {!pwError && !pwValidationError && pwMessage && <div className="text-green-600 mt-2">{pwMessage}</div>}
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={pwLoading || !currentPassword || !newPassword || !!pwValidationError}
              onClick={() => setConfirmPassword(true)}
            >
              {t('update_password')}
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
                  <AlertDialogAction
                    onClick={handlePasswordChange}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {t('confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        )}
        {activeTab === "appearance" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-4">{t('theme')}</h3>
              <ThemeSelector />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  
  const themes = [
    { value: "light", label: t('light'), previewLeft: "#ffffff", previewRight: "#f8fafc" },
    { value: "dark", label: t('dark'), previewLeft: "#0f172a", previewRight: "#1e293b" },
    { value: "system", label: t('system'), previewLeft: "#ffffff", previewRight: "#0f172a" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {themes.map((themeOption) => (
        <ThemePreviewRadio
          key={themeOption.value}
          value={themeOption.value}
          label={themeOption.label}
          previewLeft={themeOption.previewLeft}
          previewRight={themeOption.previewRight}
          checked={theme === themeOption.value}
          onChange={() => setTheme(themeOption.value)}
        />
      ))}
    </div>
  );
}

function ThemePreviewRadio({ value, label, previewLeft, previewRight, checked, onChange }: { value: string, label: string, previewLeft: string, previewRight: string, checked: boolean, onChange: () => void }) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <input
        type="radio"
        name="theme"
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-16 h-16 rounded-lg border-2 transition-colors ${
          checked ? "border-primary" : "border-muted"
        }`}
        style={{ minHeight: 64, background: `linear-gradient(135deg, ${previewLeft} 50%, ${previewRight} 50%)` }}
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
} 