import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Flag, Users, Trophy, CheckCircle, TrendingUp, Server } from "lucide-react";
import CTFStatusOverview from "./CTFStatusOverview";

interface DashboardContentProps {}

interface DashboardStats {
  challenges: {
    total: number;
    hidden: number;
    easy: number;
    medium: number;
    hard: number;
    categories: Record<string, number>;
  };
  users: {
    total: number;
    active: number;
    banned: number;
  };
  teams: {
    total: number;
  };
  submissions: {
    total: number;
    correct: number;
    incorrect: number;
    success_rate: number;
  };
  instances: {
    running: number;
    total: number;
  };
}

interface Submission {
  id: number;
  value: string;
  isCorrect: boolean;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    team?: {
      id: number;
      name: string;
    };
  };
  challenge?: {
    id: number;
    name: string;
  };
}

interface SubmissionTrend {
  date: string;
  count: number;
}

export default function DashboardContent() {
  const { getSiteName } = useSiteConfig();
  const { t } = useLanguage();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [submissionTrend, setSubmissionTrend] = useState<SubmissionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, submissionsRes, trendRes] = await Promise.all([
          axios.get("/api/admin/dashboard/stats"),
          axios.get("/api/admin/submissions?limit=15"),
          axios.get("/api/admin/dashboard/submission-trend"),
        ]);

        setStats(statsRes.data);
        setRecentSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
        setSubmissionTrend(trendRes.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Poll for updates every 10 seconds (only updates the data, not the entire page)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const difficultyData = stats
    ? [
        { name: t("dashboard.easy"), value: stats.challenges.easy, color: "#22c55e" },
        { name: t("dashboard.medium"), value: stats.challenges.medium, color: "#f59e0b" },
        { name: t("dashboard.hard"), value: stats.challenges.hard, color: "#ef4444" },
      ]
    : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <div className="bg-muted min-h-screen p-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{getSiteName()} - {t("admin.dashboard")}</title>
      </Head>
      <div className="bg-muted min-h-screen p-4 space-y-6">
        {/* CTF Status Section */}
        <CTFStatusOverview />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Challenges Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.total_challenges")}
              </CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {stats?.challenges.total || 0}
              </div>
              {stats && stats.challenges.total > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("dashboard.by_difficulty")}:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {t("dashboard.easy")}: {stats.challenges.easy}
                    </Badge>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      {t("dashboard.medium")}: {stats.challenges.medium}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {t("dashboard.hard")}: {stats.challenges.hard}
                    </Badge>
                    <Badge variant="outline" className="text-gray-600 border-gray-600">
                      {t("dashboard.hidden")}: {stats.challenges.hidden}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.total_users")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {stats?.users.total || 0}
              </div>
              {stats && stats.users.total > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("dashboard.by_status")}:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {t("dashboard.active")}: {stats.users.active}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {t("dashboard.banned")}: {stats.users.banned}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teams Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.total_teams")}
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {stats?.teams.total || 0}
              </div>
            </CardContent>
          </Card>

          {/* Submissions Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.total_submissions")}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {stats?.submissions.total || 0}
              </div>
              {stats && stats.submissions.total > 0 && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {t("dashboard.correct")}: {stats.submissions.correct}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {t("dashboard.incorrect")}: {stats.submissions.incorrect}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity and Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("dashboard.recent_activity")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.last_48_hours")} - {recentSubmissions.length} {t("dashboard.total_submissions").toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("dashboard.no_recent_submissions")}
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("user.user")}</TableHead>
                          <TableHead>{t("team.team")}</TableHead>
                          <TableHead>{t("challenge.challenge")}</TableHead>
                          <TableHead>{t("dashboard.result")}</TableHead>
                          <TableHead className="text-right">{t("time")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSubmissions
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((submission) => {
                            return (
                              <TableRow key={submission.id}>
                                <TableCell className="font-medium">
                                  {submission.user?.username || "Unknown"}
                                </TableCell>
                                <TableCell>
                                  {submission.user?.team?.name || "-"}
                                </TableCell>
                                <TableCell>
                                  {submission.challenge?.name || "Unknown"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={submission.isCorrect ? "default" : "destructive"}>
                                    {submission.isCorrect ? t("dashboard.correct") : t("dashboard.incorrect")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                  {formatDate(submission.createdAt)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                  {recentSubmissions.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        {t("pagination.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("pagination.to")} {Math.min(currentPage * itemsPerPage, recentSubmissions.length)} {t("pagination.of")} {recentSubmissions.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                        >
                          {t("pagination.previous")}
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(recentSubmissions.length / itemsPerPage), p + 1))}
                          disabled={currentPage >= Math.ceil(recentSubmissions.length / itemsPerPage)}
                          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                        >
                          {t("pagination.next")}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Submission Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.submissions_over_time")}</CardTitle>
                <CardDescription>{t("dashboard.last_48_hours")}</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={submissionTrend}>
                      <defs>
                        <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatShortDate}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#colorSubmissions)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    {t("dashboard.no_recent_submissions")}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Difficulty Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.difficulty_distribution")}</CardTitle>
                <CardDescription>{t("dashboard.by_difficulty")}</CardDescription>
              </CardHeader>
              <CardContent>
                {difficultyData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {difficultyData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No challenges yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instances Status (if applicable) */}
        {stats && stats.instances.total > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {t("dashboard.running_instances")}
                </CardTitle>
                <CardDescription>
                  {t("dashboard.total_instances")}: {stats.instances.total}
                </CardDescription>
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {stats.instances.running}
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
