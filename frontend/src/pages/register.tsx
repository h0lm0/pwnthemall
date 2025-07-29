import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter } from "next/router";
import { useSiteConfig } from "@/context/SiteConfigContext";
import RegisterContent from "@/components/RegisterContent";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import Head from "next/head";
import Link from "next/link";

const RegisterPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { getSiteName, siteConfig, loading: configLoading } = useSiteConfig();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // Check if registration is enabled
  useEffect(() => {
    // Only check if config is loaded (not loading)
    if (!configLoading) {
      // Default to disabled if config is not available (security first)
      const isEnabled = siteConfig.REGISTRATION_ENABLED === "true" || siteConfig.REGISTRATION_ENABLED === "1";
      setRegistrationEnabled(isEnabled);
    }
  }, [siteConfig.REGISTRATION_ENABLED, configLoading]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`/api/register`, form);
      toast.success(t("registration_successful"));
      router.push({
        pathname: "/login",
        query: { success: "register" },
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || "An error has occurred";
      toast.error(t(errMsg) || errMsg, { className: "bg-red-600 text-white" });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while config is being loaded
  if (configLoading) {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <div className="bg-muted flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('loading') || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If registration is disabled, show disabled message
  if (!registrationEnabled) {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <div className="bg-muted flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">{t('registration_disabled')}</h1>
              <p className="text-muted-foreground mb-4">{t('registration_disabled_message')}</p>
              <Link href="/login" className="text-primary hover:underline">
                {t('back_to_login')}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
    <RegisterContent
      form={form}
      loading={loading}
      message={null}
      onChange={onChange}
      onSubmit={handleRegister}
    />
    </>
  );
};

export default RegisterPage;
