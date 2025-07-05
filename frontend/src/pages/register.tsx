import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';

const RegisterPage: React.FC = () => {
  const { darkMode } = useTheme();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await axios.post(`/api/register`, form);
      router.push('/login');
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || 'Une erreur est survenue';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleRegister}
        className={`w-full max-w-md p-8 rounded-xl shadow-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      >
        <h2 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Créer un compte</h2>

        {message && (
          <div
            className={`mb-4 text-sm text-center p-2 rounded ${
              message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {message.text}
          </div>
        )}

        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className={`w-full p-3 mb-4 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={`w-full p-3 mb-4 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={`w-full p-3 mb-6 border rounded ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded disabled:opacity-50"
        >
          {loading ? "En cours..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
