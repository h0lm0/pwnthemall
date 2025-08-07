import React, { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { AxiosResponse } from "axios";
import { User } from "@/models/User";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

interface GameProfileData extends User {
  points?: number;
  challengesCompleted?: number;
  ranking?: number;
  description?: string;
  badges?: string[];
  totalChallenges?: number;
}

export default function DescriptionProfileCard() {
  const [user, setUser] = useState<GameProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    axios.get<User>("/api/me").then((res: AxiosResponse<User>) => {
      const gameUser: GameProfileData = {
        ...res.data,
      };
      setUser(gameUser);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="animate-pulse bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl h-96 border border-primary/20" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30">
          <CardContent className="p-6 text-center">
            <span className="text-destructive">User not found</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-gradient-to-br from-card via-muted/50 to-card border-2 border-primary/30 shadow-2xl shadow-primary/10 backdrop-blur-sm overflow-hidden relative">
        {/* Theme-adaptive animated background effect */}
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
              {/* Theme-adaptive online status indicator */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-3 border-background/30 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {user.username}
                </h1>
                <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 px-3 py-1">
                  Classement #{user.ranking}
                </Badge>
              </div>
              
              {/* User Description */}
              <div className="mb-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {user.description || "No description available"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid - Now 2 columns instead of 3 */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Nombre de Points
              </div>
              <div className="text-3xl font-bold text-primary">
                {user.points}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Nombre de Défis Réalisés
              </div>
              <div className="text-3xl font-bold text-primary">
                {user.challengesCompleted !== undefined && user.totalChallenges !== undefined
                  ? `${user.challengesCompleted}/${user.totalChallenges}`
                  : user.challengesCompleted !== undefined
                    ? `${user.challengesCompleted}`
                    : "N/A"}
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Badges & Récompenses
            </h3>
            <div className="flex gap-3">
              {/* First Blood Badge */}
              <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-600/30 rounded-xl border border-red-400/40 flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer group relative">
                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-rose-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🩸</span>
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
                  First Blood
                </div>
              </div>
              
              {/* Speed Demon Badge */}
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-orange-600/30 rounded-xl border border-yellow-400/40 flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer group relative">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">⚡</span>
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
                  Speed Demon
                </div>
              </div>
              
              {/* Crypto Master Badge */}
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 rounded-xl border border-cyan-400/40 flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer group relative">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🔐</span>
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
                  Crypto Master
                </div>
              </div>
            </div>
          </div>

          {/* User Stats & Member Since */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{user.role}</span> • {user.email}
            </div>
            <div className="text-sm text-muted-foreground">
              Membre depuis : {user.memberSince}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 