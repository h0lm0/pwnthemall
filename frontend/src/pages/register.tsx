import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useTheme } from "@/context/ThemeContext";
import RegisterContent from "@/components/RegisterContent";

const RegisterPage = () => {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await axios.post(`/api/register`, form);

      router.push({
        pathname: "/login",
        query: { success: "register" },
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || "An error has occurred";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContent
      darkMode={darkMode}
      form={form}
      loading={loading}
      message={message}
      onChange={onChange}
      onSubmit={handleRegister}
    />
  );
};

export default RegisterPage;
