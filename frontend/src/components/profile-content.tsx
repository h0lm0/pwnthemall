import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const TABS = ["Account", "Security"] as const;
type Tab = typeof TABS[number];

export default function ProfileContent() {
  const [activeTab, setActiveTab] = useState<Tab>("Account");

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
          <form className="space-y-4 max-w-md" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
              <Input id="username" name="username" value={""} onChange={() => {}} required disabled />
            </div>
            <div style={{ minHeight: 24 }} />
            <Button type="submit" className="w-full" disabled>Update Username</Button>
            <Separator className="my-6" />
            <Button type="button" variant="destructive" className="w-full" disabled>Delete Account</Button>
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