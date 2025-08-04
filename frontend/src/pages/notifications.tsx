import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useLanguage } from "@/context/LanguageContext";
import Head from "next/head";
import { Loader } from "lucide-react";
import NotificationsContent from "@/components/NotificationsContent";

export default function NotificationsPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const { getSiteName } = useSiteConfig();
  const { t } = useLanguage();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked) {
    return <Loader />;
  }

  if (!loggedIn) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{t('notifications')} - {getSiteName()}</title>
      </Head>
      <div className="space-y-6 px-4 py-10 bg-muted min-h-screen">
        <NotificationsContent />
      </div>
    </>
  );
} 