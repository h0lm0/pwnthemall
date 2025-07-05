import React from "react";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const LoginPage: React.FC = () => {
  const { darkMode } = useTheme();


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
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className={`w-full max-w-md p-8 rounded-xl shadow-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      >
        <h2 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-black'}`}
        >
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
          className={`w-full p-3 mb-4 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={`w-full p-3 mb-6 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
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
