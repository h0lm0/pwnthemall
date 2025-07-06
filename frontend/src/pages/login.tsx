import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import LoginContent from "@/components/LoginContent";

const LoginPage = () => {
  const { darkMode } = useTheme();
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (router.query.success === "register") {
      setMessage("Registration successful. Please verify now your email to login.");
      setMessageType("success");

      // Optionnel : nettoyer l'URL sans recharger
      const { success, ...rest } = router.query;
      const query = new URLSearchParams(rest as Record<string, string>).toString();
      router.replace(`/login${query ? `?${query}` : ""}`, undefined, { shallow: true });
    }
  }, [router.query]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    try {
      await axios.post(`/api/login`, form);
      login();
      router.push("/pwn");
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || "Error during login";
      setMessage(errMsg);
      setMessageType("error");
    }
  };

  return (
    <LoginContent
      darkMode={darkMode}
      form={form}
      message={message}
      messageType={messageType}
      onChange={onChange}
      onSubmit={handleLogin}
    />
  );
};

export default LoginPage;
