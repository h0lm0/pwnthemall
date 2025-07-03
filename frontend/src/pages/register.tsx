import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RegisterPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains('dark-mode'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(`/api/users`, form);
      setMessage({ type: 'success', text: 'Inscription réussie !' });
      setForm({ username: '', email: '', password: '' });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || 'Une erreur est survenue';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <form onSubmit={handleRegister} className="w-full max-w-md bg-gray-900 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Créer un compte</h2>

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
          className="w-full p-3 mb-4 bg-gray-800 text-white border border-gray-700 rounded"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 mb-4 bg-gray-800 text-white border border-gray-700 rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 mb-6 bg-gray-800 text-white border border-gray-700 rounded"
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
