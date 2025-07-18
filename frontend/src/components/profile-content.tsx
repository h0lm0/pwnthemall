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

const TABS = ["Account", "Security", "Appearance"] as const;
type Tab = typeof TABS[number];

export default function ProfileContent() {
  const [activeTab, setActiveTab] = useState<Tab>("Account");
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
          <div className="space-y-6 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Theme</h2>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <input type="radio" name="theme" value="choice1" className="accent-primary" disabled />
                <span className="font-medium">Choice 1</span>
                <span className="text-xs text-muted-foreground">a</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <input type="radio" name="theme" value="choice2" className="accent-primary" disabled />
                <span className="font-medium">Choice 2</span>
                <span className="text-xs text-muted-foreground">b</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <input type="radio" name="theme" value="choice3" className="accent-primary" disabled defaultChecked />
                <span className="font-medium">Choice 3</span>
                <span className="text-xs text-muted-foreground">c</span>
              </label>
            </div>
            <div className="text-xs text-muted-foreground mt-2">(marche pas pr le moment)</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 