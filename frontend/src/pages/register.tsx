import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import RegisterContent from "@/components/RegisterContent";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const RegisterPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

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

  return (
    <RegisterContent
      form={form}
      loading={loading}
      message={null}
      onChange={onChange}
      onSubmit={handleRegister}
    />
  );
};

export default RegisterPage;
