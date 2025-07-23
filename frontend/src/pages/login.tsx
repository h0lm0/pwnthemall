import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import LoginContent from "@/components/LoginContent";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [form, setForm] = useState({ identifier: "", password: "" });

  useEffect(() => {
    // Always clear any previous toast on mount
    localStorage.removeItem("showToast");
    // Show toast if flag is set in localStorage
    const toastData = localStorage.getItem("showToast");
    if (toastData) {
      const { type, key, lang } = JSON.parse(toastData);
      if (!lang || lang === language) {
        if (type === "success") {
          toast.success(t(key));
        } else {
          toast.error(t(key), { className: "bg-red-600 text-white" });
        }
        localStorage.removeItem("showToast");
      }
    }
    if (router.query.success === "register") {
      toast.success(t('registration_successful'));
      // Optionnel : nettoyer l'URL sans recharger
      const { success, ...rest } = router.query;
      const query = new URLSearchParams(rest as Record<string, string>).toString();
      router.replace(`/login${query ? `?${query}` : ""}`, undefined, { shallow: true });
    }
  }, [router.query, t, router, language]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/login`, form);
      // Set toast flag before redirect
      localStorage.setItem("showToast", JSON.stringify({ type: "success", key: "login_success", lang: language }));
      login();
      router.push("/pwn");
    } catch (error: any) {
      const errorKey = error?.response?.data?.error || "Error during login";
      // Show error toast immediately, don't store in localStorage since user stays on login page
      toast.error(t(errorKey), { className: "bg-red-600 text-white" });
    }
  };

  return (
    <LoginContent
      form={form}
      onChange={onChange}
      onSubmit={handleLogin}
    />
  );
};

export default LoginPage;
