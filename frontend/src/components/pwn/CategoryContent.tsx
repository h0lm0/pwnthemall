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
import { toast } from "sonner";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext"

interface CategoryContentProps {
  cat: string;
  challenges: Challenge[];
}

const CategoryContent = ({ cat, challenges }: CategoryContentProps) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedChallenge) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/challenges/${selectedChallenge.id}/submit`, { flag });

      toast.success(t('flag_correct'), {
        description: res.data.message || t('well_done'),
      });
    } catch (err: any) {
      toast.error(t('incorrect_flag'), {
        description: err.response?.data?.message || t('try_again'),
      });
    } finally {
      setLoading(false);
      setFlag("");
    }
  };
  const { t } = useLanguage();
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
          {challenges.map((challenge) => (
            <Dialog key={challenge.id}>
              <DialogTrigger asChild>
                <Card
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setFlag("");
                  }}
                  className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="text-cyan-700 dark:text-cyan-300">
                      {challenge.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-left space-y-2">
                    <div className="text-xs text-gray-500 mt-2">
                      {challenge.type.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {challenge.difficulty.name}
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-cyan-600 dark:text-cyan-300">
                    {selectedChallenge?.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {t('difficulty')}: {selectedChallenge?.difficulty.name} - {t('author')}: {selectedChallenge?.author}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 text-left whitespace-pre-wrap">
                  {selectedChallenge?.description}
                </div>

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
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
    </>
  );
};

export default CategoryContent;
