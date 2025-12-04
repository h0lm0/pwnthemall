import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { toast } from 'sonner';

interface TeamScore {
  totalScore: number;
  availableScore: number;
  spentOnHints: number;
  testMode?: boolean; // Admin without team - hints are free
}

interface PurchaseHintResponse {
  success: boolean;
  hint?: any;
  updatedChallenge?: any;
}

export const useHints = () => {
  const [teamScore, setTeamScore] = useState<TeamScore | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTeamScore = async () => {
    try {
      const response = await axios.get<TeamScore>('/api/teams/score');
      setTeamScore(response.data);
    } catch (error: any) {
      console.error('Failed to fetch team score:', error);
      
      // Only show error toast for non-auth errors to avoid spamming
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        // Set default values if fetch fails
        setTeamScore({
          totalScore: 0,
          availableScore: 0,
          spentOnHints: 0
        });
      }
    }
  };

  const purchaseHint = async (hintId: number): Promise<PurchaseHintResponse> => {
    if (loading) return { success: false }; // Prevent multiple simultaneous purchases
    
    setLoading(true);
    try {
      const response = await axios.post(`/api/challenges/hints/${hintId}/purchase`);
      toast.success('Indice acheté avec succès !');
      
      // Refresh team score after purchase
      await fetchTeamScore();
      
      return {
        success: true,
        hint: response.data.hint,
        updatedChallenge: response.data.challenge
      };
    } catch (error: any) {
      console.error('Failed to purchase hint:', error);
      
      if (error.response?.data?.error === 'hint_already_purchased') {
        toast.error('Cet indice a déjà été acheté');
      } else if (error.response?.data?.error === 'insufficient_points') {
        const required = error.response.data.required;
        const available = error.response.data.available;
        toast.error(`Points insuffisants. Requis: ${required}, Disponible: ${available}`);
      } else if (error.response?.data?.error === 'no_team') {
        toast.error('Vous devez faire partie d\'une équipe pour acheter des indices');
      } else if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter');
      } else if (error.response?.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard');
      } else if (!error.response) {
        toast.error('Erreur de connexion. Vérifiez votre connexion internet');
      } else {
        toast.error('Erreur lors de l\'achat de l\'indice');
      }
      
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamScore();
  }, []);

  return {
    teamScore,
    loading,
    purchaseHint,
    refreshTeamScore: fetchTeamScore,
    resetTeamScore: () => setTeamScore(null),
  };
};
