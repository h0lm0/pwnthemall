import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Users, User, Search, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { IndividualLeaderboardEntry, TeamLeaderboardEntry } from '@/models/Leaderboard';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function ScoreboardContent() {
  const { t } = useLanguage();
  const { user } = useUser();
  
  const [individualData, setIndividualData] = useState<IndividualLeaderboardEntry[]>([]);
  const [teamData, setTeamData] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('individual');
  const [individualPage, setIndividualPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);
  const [timelineData, setTimelineData] = useState<{ teams: any[], timeline: any[] } | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchLeaderboards();
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    setChartLoading(true);
    try {
      const response = await axios.get('/api/teams/timeline');
      const data = response.data;
      // New format: { teams: [...], timeline: [...] }
      if (data && data.teams && data.timeline) {
        setTimelineData(data);
      } else {
        setTimelineData(null);
      }
    } catch (error) {
      console.error('Failed to fetch timeline data:', error);
      setTimelineData(null);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      // Fetch team leaderboard - this is the correct endpoint
      const teamsResponse = await axios.get('/api/teams/leaderboard');
      const teamsData = teamsResponse.data || [];
      
      const teams = teamsData.map((t: any, index: number) => ({
        rank: index + 1,
        id: t.team?.id || t.id,
        name: t.team?.name || t.name,
        points: t.totalScore || t.points || 0,
        solves: t.solveCount || t.solves || 0,
        memberCount: t.team?.users?.length || 0
      }));

      // For individual leaderboard, we need to calculate from team data
      // Since solves belong to teams, we extract individual contributions
      const individualMap = new Map<number, IndividualLeaderboardEntry>();
      
      teamsData.forEach((teamScore: any) => {
        const team = teamScore.team;
        if (team && team.users) {
          team.users.forEach((u: any) => {
            if (!individualMap.has(u.id)) {
              individualMap.set(u.id, {
                rank: 0,
                id: u.id,
                username: u.username,
                points: teamScore.totalScore || 0, // Team's total score
                solves: teamScore.solveCount || 0, // Team's solve count
                teamId: team.id,
                teamName: team.name
              });
            }
          });
        }
      });

      const users = Array.from(individualMap.values())
        .sort((a, b) => b.points - a.points);
      
      // Recalculate ranks after sorting
      users.forEach((u, index) => {
        u.rank = index + 1;
      });

      setIndividualData(users);
      setTeamData(teams);
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">1st</Badge>;
      case 2:
        return <Badge variant="default" className="bg-gray-400 hover:bg-gray-500">2nd</Badge>;
      case 3:
        return <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">3rd</Badge>;
      default:
        return <span className="text-muted-foreground font-medium">{rank}</span>;
    }
  };

    const filteredIndividualData = individualData.filter(entry => {
    if (!searchTerm) return true;
    return (entry.username && entry.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (entry.teamName && entry.teamName.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const filteredTeamData = teamData.filter(entry =>
    !searchTerm || entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalIndividualPages = Math.ceil(filteredIndividualData.length / itemsPerPage);
  const totalTeamPages = Math.ceil(filteredTeamData.length / itemsPerPage);
  
  const paginatedIndividualData = filteredIndividualData.slice(
    (individualPage - 1) * itemsPerPage,
    individualPage * itemsPerPage
  );
  
  const paginatedTeamData = filteredTeamData.slice(
    (teamPage - 1) * itemsPerPage,
    teamPage * itemsPerPage
  );

  // Render compact numeric page buttons (with ellipsis) for pagination
  const renderPageButtons = (current: number, total: number, setPage: (n: number) => void) => {
    if (total < 1) return null;
    const maxButtons = 7;
    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <>
        {start > 1 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setPage(1)}>1</Button>
            {start > 2 && <span className="px-2">…</span>}
          </>
        )}

        {pages.map(p => (
          <Button
            key={p}
            variant={p === current ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPage(p)}
            className={p === current ? 'font-semibold' : ''}
          >
            {p}
          </Button>
        ))}

        {end < total && (
          <>
            {end < total - 1 && <span className="px-2">…</span>}
            <Button variant="ghost" size="sm" onClick={() => setPage(total)}>{total}</Button>
          </>
        )}
      </>
    );
  };

  // Reset pages when search changes or when switching tabs so users always start at page 1
  useEffect(() => {
    setIndividualPage(1);
    setTeamPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setIndividualPage(1);
    setTeamPage(1);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t('scoreboard.scoreboard') || 'Scoreboard'}</h1>
          <p className="text-muted-foreground">
            {t('scoreboard.scoreboard_description') || 'View rankings for individuals and teams'}
          </p>
        </div>

        {/* Timeline Chart - CTFd/TryHackMe Style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('scoreboard.solve_activity') || 'Solve activity over time'}
            </CardTitle>
            <CardDescription>
              {t('scoreboard.solve_activity_description') || 'Track how teams progress through challenges'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400"></div>
              </div>
            ) : !timelineData || timelineData.timeline.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t('scoreboard.no_solve_data') || 'No solve data available yet'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timelineData.timeline.map(point => ({
                  time: point.time,
                  ...point.scores
                }))}>
                  <defs>
                    {timelineData.teams.map((team, index) => (
                      <linearGradient key={team.id} id={`colorTeam${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={team.color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={team.color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    label={{ value: t('scoreboard.points') || 'Points', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  {timelineData.teams.map((team, index) => (
                    <Area 
                      key={team.id}
                      type="monotone" 
                      dataKey={team.name}
                      stroke={team.color}
                      fillOpacity={1}
                      fill={`url(#colorTeam${index})`}
                      name={team.name}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger value="individual" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('scoreboard.individual') || 'Individual'}
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('team.team') || 'Teams'}
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('scoreboard.search') || 'Search...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

        <TabsContent value="individual" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('scoreboard.individual_leaderboard') || 'Individual Leaderboard'}
              </CardTitle>
              <CardDescription>
                {t('scoreboard.scoreboard_description') || 'Top players ranked by points'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIndividualData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? t('challenges.no_challenges_yet') || 'No results found' : t('scoreboard.no_players_yet') || 'No players have scored yet'}
                </div>
              ) : (
                <>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {t('common.showing') || 'Showing'} {filteredIndividualData.length} {t('scoreboard.player') || 'player'}{filteredIndividualData.length !== 1 ? 's' : ''}
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">{t('scoreboard.rank') || 'Rank'}</TableHead>
                          <TableHead>{t('scoreboard.player') || 'Player'}</TableHead>
                          <TableHead>{t('team.team') || 'Team'}</TableHead>
                          <TableHead className="text-right">{t('scoreboard.points') || 'Points'}</TableHead>
                          <TableHead className="text-right">{t('scoreboard.solves') || 'Solves'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedIndividualData.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className={cn(
                              "transition-colors",
                              entry.id === user?.id && "bg-primary/10 hover:bg-primary/15"
                            )}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getRankIcon(entry.rank)}
                                {getRankBadge(entry.rank)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {entry.username}
                              {entry.id === user?.id && (
                                <Badge variant="outline" className="ml-2">
                                  {t('scoreboard.you') || 'You'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.teamName || <span className="italic">{t('scoreboard.no_team') || 'No team'}</span>}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {entry.points.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {entry.solves}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalIndividualPages >= 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        {t('common.page') || 'Page'} {individualPage} {t('common.of') || 'of'} {totalIndividualPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIndividualPage(p => Math.max(1, p - 1))}
                          disabled={individualPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t('common.previous') || 'Previous'}
                        </Button>

                        <div className="flex items-center gap-1">
                          {renderPageButtons(individualPage, totalIndividualPages, (n: number) => setIndividualPage(n))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIndividualPage(p => Math.min(totalIndividualPages, p + 1))}
                          disabled={individualPage === totalIndividualPages}
                        >
                          {t('common.next') || 'Next'}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('scoreboard.team_leaderboard') || 'Team Leaderboard'}
              </CardTitle>
              <CardDescription>
                {t('scoreboard.scoreboard_description') || 'Top teams ranked by combined points'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTeamData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? t('challenges.no_challenges_yet') || 'No results found' : t('scoreboard.no_teams_yet') || 'No teams have scored yet'}
                </div>
              ) : (
                <>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {t('common.showing') || 'Showing'} {filteredTeamData.length} {t('team.team') || 'team'}{filteredTeamData.length !== 1 ? 's' : ''}
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">{t('scoreboard.rank') || 'Rank'}</TableHead>
                          <TableHead>{t('team.team') || 'Team'}</TableHead>
                          <TableHead className="text-right">{t('scoreboard.members') || 'Members'}</TableHead>
                          <TableHead className="text-right">{t('scoreboard.points') || 'Points'}</TableHead>
                          <TableHead className="text-right">{t('scoreboard.solves') || 'Solves'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTeamData.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className={cn(
                              "transition-colors",
                              entry.id === user?.teamId && "bg-primary/10 hover:bg-primary/15"
                            )}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getRankIcon(entry.rank)}
                                {getRankBadge(entry.rank)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {entry.name}
                              {entry.id === user?.teamId && (
                                <Badge variant="outline" className="ml-2">
                                  {t('scoreboard.your_team') || 'Your Team'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {entry.memberCount}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {entry.points.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {entry.solves}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalTeamPages >= 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        {t('common.page') || 'Page'} {teamPage} {t('common.of') || 'of'} {totalTeamPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTeamPage(p => Math.max(1, p - 1))}
                          disabled={teamPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t('common.previous') || 'Previous'}
                        </Button>

                        <div className="flex items-center gap-1">
                          {renderPageButtons(teamPage, totalTeamPages, (n: number) => setTeamPage(n))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTeamPage(p => Math.min(totalTeamPages, p + 1))}
                          disabled={teamPage === totalTeamPages}
                        >
                          {t('common.next') || 'Next'}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
