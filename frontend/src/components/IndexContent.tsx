import Head from 'next/head';
import Image from 'next/image';
import AnimatedText from './AnimatedText';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { CTFStatus } from '@/hooks/use-ctf-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users } from 'lucide-react';
import { useRouter } from 'next/router';

interface IndexContentProps {
  ctfStatus: CTFStatus;
  ctfLoading: boolean;
  isLoggedIn: boolean;
  hasTeam: boolean;
  userRole: string | null;
}

const IndexContent = ({ ctfStatus, ctfLoading, isLoggedIn, hasTeam, userRole }: IndexContentProps) => {
  const { t } = useLanguage();
  const { getSiteName, loading } = useSiteConfig();
  const router = useRouter();
  
  // Show CTF status message only when CTF hasn't started
  if (isLoggedIn && !ctfLoading && ctfStatus.status === 'not_started') {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="flex flex-col items-center justify-center mb-8">
            <Image
              src="/logo-no-text.png"
              alt="CTF logo"
              className="opacity-100"
              width={120}
              height={120}
              priority
            />
          </div>
          
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <CardTitle className="text-2xl text-blue-600">
                {t('ctf_not_started') || 'CTF Not Started'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('ctf_not_started_message') || 'The CTF has not started yet. Challenges will be available once the competition begins.'}
              </p>
              
              {!hasTeam && userRole !== "admin" && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-green-600">
                      {t('prepare_team') || 'Prepare Your Team'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('join_create_team_message') || 'Join or create a team before the CTF starts.'}
                  </p>
                  <Button 
                    onClick={() => router.push('/team')}
                    className="w-full"
                  >
                    {t('manage_team') || 'Manage Team'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
      <main className="bg-muted flex flex-col items-center justify-center text-center min-h-screen px-6">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col items-center justify-center mb-8">
            <Image
              src="/logo-no-text.png"
              alt="CTF logo"
              className="opacity-100"
              width={180}
              height={180}
              priority
            />
            <p className="text-xl md:text-2xl font-medium mb-8 text-cyan-600 dark:text-cyan-400">
              <AnimatedText text={t('will_you_pwn_them')} delay={150} />
            </p>
          </div>
          

        </div>
      </main>
    </>
  );
};

export default IndexContent;
