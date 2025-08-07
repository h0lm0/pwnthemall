import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { CTFStatus } from "@/hooks/use-ctf-status";
import { Challenge, Solve } from "@/models/Challenge";
import { BadgeCheck, Trophy, Play, Square, Settings, Clock } from "lucide-react";
import ConnectionInfo from "@/components/ConnectionInfo";
import axios from "@/lib/axios";
import { toast } from "sonner";
import Head from "next/head";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstances } from "@/hooks/use-instances";
import { debugError } from "@/lib/debug";

interface CategoryContentProps {
  cat: string;
  challenges: Challenge[];
  onChallengeUpdate?: () => void;
  ctfStatus: CTFStatus;
  ctfLoading: boolean;
}

const CategoryContent = ({ cat, challenges = [], onChallengeUpdate, ctfStatus, ctfLoading }: CategoryContentProps) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [solves, setSolves] = useState<Solve[]>([]);
  const [solvesLoading, setSolvesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [instanceStatus, setInstanceStatus] = useState<{[key: number]: 'running' | 'stopped' | 'building' | 'expired'}>({});
  const [instanceDetails, setInstanceDetails] = useState<{[key: number]: any}>({});
  const [connectionInfo, setConnectionInfo] = useState<{[key: number]: string[]}>({});
  const { getSiteName } = useSiteConfig();
  const { loading: instanceLoading, startInstance, stopInstance, killInstance, getInstanceStatus: fetchInstanceStatus } = useInstances();

  // Fetch instance status for all Docker challenges when challenges are loaded
  const [statusFetched, setStatusFetched] = useState(false);
  
  useEffect(() => {
    if (!challenges || challenges.length === 0 || statusFetched) return;
    
    const fetchAllInstanceStatuses = async () => {
      const dockerChallenges = challenges.filter(challenge => isDockerChallenge(challenge));
      
      for (const challenge of dockerChallenges) {
        try {
          const status = await fetchInstanceStatus(challenge.id.toString());
          if (status) {
            // Map API status to local status
            let localStatus: 'running' | 'stopped' | 'building' | 'expired' = 'stopped';
            if (status.status === 'running') {
              localStatus = 'running';
            } else if (status.status === 'building') {
              localStatus = 'building';
            } else if (status.status === 'expired') {
              localStatus = 'expired';
            } else {
              // 'no_instance', 'stopped', 'no_team', etc. all map to 'stopped'
              localStatus = 'stopped';
            }
            
            setInstanceStatus(prev => ({
              ...prev,
              [challenge.id]: localStatus
            }));

            // Store connection info if available
            if (status.connection_info && status.connection_info.length > 0) {
              setConnectionInfo(prev => ({
                ...prev,
                [challenge.id]: status.connection_info
              }));
            } else {
              setConnectionInfo(prev => ({
                ...prev,
                [challenge.id]: []
              }));
            }
          }
        } catch (error) {
          debugError(`Failed to fetch status for challenge ${challenge.id}:`, error);
        }
      }
      setStatusFetched(true);
    };

    fetchAllInstanceStatuses();
  }, [challenges.length, statusFetched]); // Only run once when challenges load

  // Clear solves data when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSolves([]);
      setSolvesLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedChallenge) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/challenges/${selectedChallenge.id}/submit`, { flag });

      toast.success(t(res.data.message) || 'Challenge solved!');
      // Refresh challenges after successful submission
      if (onChallengeUpdate) {
        onChallengeUpdate();
      }
      // Refresh solves after successful submission
      if (selectedChallenge) {
        fetchSolves(selectedChallenge.id);
      }
    } catch (err: any) {
      const errorKey = err.response?.data?.error || err.response?.data?.result;
      toast.error(t(errorKey) || 'Try again');
    } finally {
      setLoading(false);
      setFlag("");
    }
  };

  const fetchSolves = async (challengeId: number) => {
    if (!Number.isInteger(challengeId) || challengeId <= 0) {
      debugError('Invalid challenge ID provided to fetchSolves');
      setSolves([]);
      setSolvesLoading(false);
      return;
    }
    
    setSolvesLoading(true);
    try {
      const response = await axios.get<Solve[]>(`/api/challenges/${challengeId}/solves`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      setSolves(response.data || []);
    } catch (err: any) {
      debugError('Failed to fetch solves:', err);
      setSolves([]);
    } finally {
      setSolvesLoading(false);
    }
  };

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setFlag("");
    setOpen(true);
    setActiveTab("description");
    // Clear previous solves data and fetch fresh data
    setSolves([]);
    setSolvesLoading(false);
    fetchSolves(challenge.id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      debugError('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleStartInstance = async (challengeId: number) => {
    try {
      setInstanceStatus(prev => ({ ...prev, [challengeId]: 'building' }));
      await startInstance(challengeId.toString());
      // Fetch the actual status from backend after starting
      const status = await fetchInstanceStatus(challengeId.toString());
      if (status) {
        let localStatus: 'running' | 'stopped' | 'building' | 'expired' = 'running';
        if (status.status === 'running') {
          localStatus = 'running';
        } else if (status.status === 'building') {
          localStatus = 'building';
        } else if (status.status === 'expired') {
          localStatus = 'expired';
        } else {
          localStatus = 'stopped';
        }
        setInstanceStatus(prev => ({ ...prev, [challengeId]: localStatus }));

        // Store connection info if available
        if (status.connection_info && status.connection_info.length > 0) {
          setConnectionInfo(prev => ({
            ...prev,
            [challengeId]: status.connection_info
          }));
        } else {
          setConnectionInfo(prev => ({
            ...prev,
            [challengeId]: []
          }));
        }
      } else {
        setInstanceStatus(prev => ({ ...prev, [challengeId]: 'running' }));
      }
    } catch (error) {
      setInstanceStatus(prev => ({ ...prev, [challengeId]: 'stopped' }));
    }
  };

  const handleStopInstance = async (challengeId: number) => {
    try {
      await stopInstance(challengeId.toString());
      // Immediately set status to stopped for better UX
      setInstanceStatus(prev => ({ ...prev, [challengeId]: 'stopped' }));
      
      // Wait a moment for backend to process, then verify status
      setTimeout(async () => {
        try {
          const status = await fetchInstanceStatus(challengeId.toString());
          if (status) {
            let localStatus: 'running' | 'stopped' | 'building' | 'expired' = 'stopped';
            if (status.status === 'running') {
              localStatus = 'running';
            } else if (status.status === 'building') {
              localStatus = 'building';
            } else if (status.status === 'expired') {
              localStatus = 'expired';
            } else {
              localStatus = 'stopped';
            }
            setInstanceStatus(prev => ({ ...prev, [challengeId]: localStatus }));
          }
        } catch (error) {
          debugError('Failed to verify status after stopping:', error);
        }
      }, 1000); // Wait 1 second before verifying
    } catch (error) {
      // Keep current status on error
    }
  };

  const isDockerChallenge = (challenge: Challenge) => {
    return challenge.type?.name?.toLowerCase() === 'docker';
  };

  const getLocalInstanceStatus = (challengeId: number) => {
    return instanceStatus[challengeId] || 'stopped';
  };
  
  const { t } = useLanguage();
  
  // Safety check for challenges
  if (!challenges || challenges.length === 0) {
    return (
      <>
        <Head>
          <title>{getSiteName()} - {cat}</title>
        </Head>
        <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center">
          <h1 className="text-3xl font-bold mb-6 text-cyan-600 dark:text-cyan-400">
            {cat}
          </h1>
          <p className="text-muted-foreground">{t('no_challenges_available') || 'No challenges available'}</p>
        </main>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>{getSiteName()} - {cat}</title>
      </Head>

      <main className="bg-muted flex flex-col items-center justify-start min-h-screen px-6 py-10 text-center">
        <h1 className="text-3xl font-bold mb-6 text-cyan-600 dark:text-cyan-400">
          {cat}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-7xl">
          {(challenges || []).map((challenge) => (
            <Card
              key={challenge.id}
              onClick={() => handleChallengeSelect(challenge)}
              className={`hover:shadow-lg transition-shadow duration-200 cursor-pointer relative ${
                challenge.solved 
                  ? 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700' 
                  : ''
              }`}
            >
              {challenge.solved && (
                <div className="absolute top-2 right-2">
                  <BadgeCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              <CardHeader>
                <CardTitle className={`${
                  challenge.solved 
                    ? 'text-green-700 dark:text-green-200' 
                    : 'text-cyan-700 dark:text-cyan-300'
                }`}>
                  {challenge.name || 'Unnamed Challenge'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-left">
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {challenge.type?.name || 'Unknown Type'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {challenge.difficulty?.name || 'Unknown Difficulty'}
                  </Badge>
                  {isDockerChallenge(challenge) && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        getLocalInstanceStatus(challenge.id) === 'running' 
                          ? 'bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 border border-green-500 dark:border-green-400' 
                          : getLocalInstanceStatus(challenge.id) === 'building'
                          ? 'bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 border border-yellow-500 dark:border-yellow-400'
                          : getLocalInstanceStatus(challenge.id) === 'expired'
                          ? 'bg-red-300 dark:bg-red-700 text-red-900 dark:text-red-100 border border-red-500 dark:border-red-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500'
                      } pointer-events-none select-none`}
                    >
                      {getLocalInstanceStatus(challenge.id) === 'running' ? t('running') : 
                       getLocalInstanceStatus(challenge.id) === 'building' ? t('building') : 
                       getLocalInstanceStatus(challenge.id) === 'expired' ? t('expired') : t('stopped')}
                    </Badge>
                  )}
                  {challenge.solved && (
                    <Badge variant="secondary" className="text-xs bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 border border-green-500 dark:border-green-400 pointer-events-none select-none">
                      {t('solved')}
                    </Badge>
                  )}
                  {!challenge.solved && (
                    <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500 pointer-events-none select-none">
                      {t('unsolved')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl w-[90vw] h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle className={`${
                selectedChallenge?.solved 
                  ? 'text-green-600 dark:text-green-300' 
                  : 'text-cyan-600 dark:text-cyan-300'
              }`}>
                {selectedChallenge?.name || 'Unnamed Challenge'}
                {selectedChallenge?.solved && (
                  <BadgeCheck className="inline-block w-6 h-6 ml-2 text-green-600 dark:text-green-400" />
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t('difficulty')}: {selectedChallenge?.difficulty?.name || 'Unknown'} - {t('author')}: {selectedChallenge?.author || 'Unknown'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                <TabsList className={`grid w-full mb-4 flex-shrink-0 bg-card border rounded-lg p-1 ${
                  selectedChallenge && isDockerChallenge(selectedChallenge) 
                    ? 'grid-cols-3' 
                    : 'grid-cols-2'
                }`}>
                  <TabsTrigger value="description">{t('description')}</TabsTrigger>
                  <TabsTrigger value="solves">{t('solves')}</TabsTrigger>
                  {selectedChallenge && isDockerChallenge(selectedChallenge) && (
                    <TabsTrigger value="instance">{t('docker_instance')}</TabsTrigger>
                  )}
                </TabsList>
                    
                    <div className="flex-1 min-h-0">
                      <TabsContent value="description" className="h-full overflow-y-auto">
                        <div className="text-left whitespace-pre-wrap text-foreground leading-relaxed min-h-full">
                          {selectedChallenge?.description || 'No description available'}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="solves" className="h-full overflow-y-auto">
                        <div className="min-h-full">
                          {solvesLoading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto mb-2"></div>
                              <p className="text-muted-foreground">{t('loading') || 'Loading...'}</p>
                            </div>
                          ) : !solves || solves.length === 0 ? (
                            <div className="text-center py-8">
                              <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                              <p className="text-lg font-medium text-foreground mb-2">{t('no_solves_yet')}</p>
                              <p className="text-sm text-muted-foreground">{t('be_the_first')}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {t('solves')} ({solves?.length || 0})
                                </h3>
                              </div>
                              {solves && solves.map((solve, index) => (
                                <div 
                                  key={`${solve.teamId}-${solve.challengeId}`} 
                                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-200"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white font-bold text-sm shadow-sm">
                                      {index < 3 ? (
                                        <span className="text-lg">
                                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </span>
                                      ) : (
                                        index + 1
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-foreground">{solve.team?.name || 'Unknown Team'}</span>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {solve.username ? (
                                          <>
                                            {t('solved_by')} <span className="font-medium text-foreground/80">{solve.username}</span>
                                          </>
                                        ) : (
                                          <>
                                            {t('solved_by')} {solve.team?.name || 'Unknown Team'}
                                          </>
                                        )}
                                        {' '}{t('on')} {formatDate(solve.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                      +{solve.points} pts
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {formatDate(solve.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {selectedChallenge && isDockerChallenge(selectedChallenge) && (
                        <TabsContent value="instance" className="h-full overflow-y-auto">
                          <div className="min-h-full">
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg border bg-card">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{t('instance_status')}:</span>
                                    <div className="flex items-center gap-2">
                                      {getLocalInstanceStatus(selectedChallenge.id) === 'running' && (
                                        <>
                                          <Play className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-medium text-green-600">{t('running')}</span>
                                        </>
                                      )}
                                      {getLocalInstanceStatus(selectedChallenge.id) === 'building' && (
                                        <>
                                          <Settings className="w-4 h-4 text-yellow-600 animate-spin" />
                                          <span className="text-sm font-medium text-yellow-600">{t('building')}</span>
                                        </>
                                      )}
                                      {getLocalInstanceStatus(selectedChallenge.id) === 'expired' && (
                                        <>
                                          <Square className="w-4 h-4 text-red-600" />
                                          <span className="text-sm font-medium text-red-600">{t('expired')}</span>
                                        </>
                                      )}
                                      {getLocalInstanceStatus(selectedChallenge.id) === 'stopped' && (
                                        <>
                                          <Square className="w-4 h-4 text-gray-600" />
                                          <span className="text-sm font-medium text-gray-600">{t('stopped')}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Connection Info Section */}
                                  {getLocalInstanceStatus(selectedChallenge.id) === 'running' && 
                                   connectionInfo[selectedChallenge.id] && 
                                   connectionInfo[selectedChallenge.id].length > 0 && (
                                     <ConnectionInfo 
                                       challengeId={selectedChallenge.id} 
                                       connectionInfo={connectionInfo[selectedChallenge.id]} 
                                     />
                                   )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {getLocalInstanceStatus(selectedChallenge.id) === 'stopped' && (
                                  <Button
                                    onClick={() => handleStartInstance(selectedChallenge.id)}
                                    disabled={instanceLoading}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                                  >
                                    {instanceLoading ? (
                                      <>
                                        <Settings className="w-4 h-4 mr-2 animate-spin" />
                                        {t('starting')}
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-4 h-4 mr-2" />
                                        {t('start_instance')}
                                      </>
                                    )}
                                  </Button>
                                )}
                                
                                {getLocalInstanceStatus(selectedChallenge.id) === 'running' && (
                                  <Button
                                    onClick={() => handleStopInstance(selectedChallenge.id)}
                                    disabled={instanceLoading}
                                    variant="destructive"
                                  >
                                    {instanceLoading ? (
                                      <>
                                        <Settings className="w-4 h-4 mr-2 animate-spin" />
                                        {t('stopping')}
                                      </>
                                    ) : (
                                      <>
                                        <Square className="w-4 h-4 mr-2" />
                                        {t('stop_instance')}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      )}
                    </div>
                  </Tabs>
                </div>

                {activeTab === "description" && (
                  selectedChallenge?.solved ? (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg flex-shrink-0">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <BadgeCheck className="w-5 h-5" />
                        <span className="font-medium">{t('already_solved')}</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {t('challenge_already_solved')}
                      </p>
                    </div>
                  ) : !ctfLoading && (ctfStatus.status === 'not_started' || ctfStatus.status === 'ended') ? (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg flex-shrink-0">
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          {ctfStatus.status === 'not_started' 
                            ? (t('ctf_not_started') || 'CTF Not Started')
                            : (t('ctf_ended') || 'CTF Ended')
                          }
                        </span>
                      </div>
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        {ctfStatus.status === 'not_started' 
                          ? (t('flag_submission_not_available_yet') || 'Flag submission is not available yet. Please wait for the CTF to start.')
                          : (t('flag_submission_no_longer_available') || 'Flag submission is no longer available. The CTF has ended.')
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 flex-shrink-0 pb-2">
                      <Input
                        placeholder={t('enter_your_flag')}
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && flag.trim()) {
                            handleSubmit();
                          }
                        }}
                        className="w-full"
                        disabled={loading}
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !flag.trim()}
                        className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600"
                      >
                        {loading ? t('submitting') : t('submit')}
                      </Button>
                    </div>
                  )
                )}
              </DialogContent>
            </Dialog>
          </main>
        </>
      );
    };

export default CategoryContent;