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

const TABS = ["Account", "Security"] as const;
type Tab = typeof TABS[number];

export default function ProfileContent() {
  const [activeTab, setActiveTab] = useState<Tab>("Account");
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
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
            <Button type="submit" className="w-full" disabled={loading || newUsername === username || !newUsername}>
              Update Username
            </Button>
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
          <form className="space-y-4 max-w-md" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="current">Current Password</label>
              <Input id="current" name="current" type="password" value={""} onChange={() => {}} required autoComplete="current-password" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="new">New Password</label>
              <Input id="new" name="new" type="password" value={""} onChange={() => {}} required autoComplete="new-password" disabled />
            </div>
            <div style={{ minHeight: 24 }} />
            <Button type="submit" className="w-full" disabled>Change Password</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
} 