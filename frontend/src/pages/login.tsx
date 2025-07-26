import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import LoginContent from "@/components/LoginContent";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import axios from "@/lib/axios";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [form, setForm] = useState({ identifier: "", password: "" });

  useEffect(() => {
    if (router.query.success === "register") {
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
      const res = await axios.post("/api/login", form);
      login();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:refresh"));
      }
      localStorage.setItem("showToast", JSON.stringify({ type: "success", key: "login_success", lang: language }));
      router.push("/pwn");
    } catch (error: any) {
      const errorKey = error?.response?.data?.error || "Error during login";
      // Show error toast immediately, don't store in localStorage since user stays on login page
      toast.error(t(errorKey), { className: "bg-red-600 text-white" });
    }
  };

  return (
    <LoginContent form={form} onChange={onChange} onSubmit={handleLogin} />
  );
};

export default LoginPage;
