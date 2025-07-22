import { useState } from "react";
import { Challenge } from "@/models/Challenge";
import Head from "next/head";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext"
import { CheckCircle, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

interface CategoryContentProps {
  cat: string;
  challenges: Challenge[];
  onChallengeUpdate?: () => void;
}

const CategoryContent = ({ cat, challenges = [], onChallengeUpdate }: CategoryContentProps) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedChallenge) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/challenges/${selectedChallenge.id}/submit`, { flag });

      toast.success(res.data.message || 'Challenge solved!');
      // Refresh challenges after successful submission
      if (onChallengeUpdate) {
        onChallengeUpdate();
      }
    } catch (err: any) {
      const errorKey = err.response?.data?.error || err.response?.data?.result;
      toast.error('Incorrect flag: ' + (errorKey || 'Try again'));
    } finally {
      setLoading(false);
      setFlag("");
    }
  };
  
  const { t } = useLanguage();
  
  // Safety check for challenges
  if (!challenges || challenges.length === 0) {
    return (
      <>
        <Head>
          <title>pwnthemall - {cat}</title>
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
        <title>pwnthemall - {cat}</title>
      </Head>

      <main className="bg-muted flex flex-col items-center justify-start min-h-screen px-6 py-10 text-center">
        <h1 className="text-3xl font-bold mb-6 text-cyan-600 dark:text-cyan-400">
          {cat}
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-7xl">
          {(challenges || []).map((challenge) => (
            <Dialog key={challenge.id}>
              <DialogTrigger asChild>
                <Card
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setFlag("");
                  }}
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
                  <CardContent className="text-left space-y-2">
                    <div className="text-xs text-gray-500 mt-2">
                      {challenge.type?.name || 'Unknown Type'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {challenge.difficulty?.name || 'Unknown Difficulty'}
                    </div>
                    {challenge.solved && (
                      <Badge variant="secondary" className="text-xs bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 border border-green-500 dark:border-green-400">
                        {t('solved')}
                      </Badge>
                    )}
                    {!challenge.solved && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-500">
                        {t('unsolved')}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </DialogTrigger>

              <DialogContent className="max-w-4xl">
                <DialogHeader>
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

                <div className="mt-4 text-left whitespace-pre-wrap">
                  {selectedChallenge?.description || 'No description available'}
                </div>

                {selectedChallenge?.solved ? (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <BadgeCheck className="w-5 h-5" />
                      <span className="font-medium">{t('already_solved')}</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {t('challenge_already_solved')}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
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
                    >
                      {loading ? t('submitting') : t('submit')}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
    </>
  );
};

export default CategoryContent;
