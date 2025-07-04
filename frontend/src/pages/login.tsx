import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

const LoginPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains("dark-mode"));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await axios.post(`/api/login`, form);
      login();
      router.push("/pwn");
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.error || "Erreur lors de la connexion";
      setMessage(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Connexion
        </h2>

        {message && (
          <div className="mb-4 text-sm text-center p-2 rounded bg-red-600 text-white">
            {message}
          </div>
        )}

        <input
          type="text"
          placeholder="Nom d'utilisateur ou Email"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          className="w-full p-3 mb-4 bg-gray-800 text-white border border-gray-700 rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 mb-6 bg-gray-800 text-white border border-gray-700 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
