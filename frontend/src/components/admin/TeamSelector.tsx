import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Search, X } from 'lucide-react';
import { Team } from '@/models/Team';
import { useLanguage } from '@/context/LanguageContext';
import axios from '@/lib/axios';

interface TeamSelectorProps {
  selectedTeamId?: number;
  onTeamSelect: (teamId: number | undefined) => void;
  disabled?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeamId,
  onTeamSelect,
  disabled = false
}) => {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Filter teams based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
    }
  }, [searchTerm, teams]);

  // Set selected team when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      const team = teams.find(t => t.id === selectedTeamId);
      setSelectedTeam(team || null);
    } else {
      setSelectedTeam(null);
    }
  }, [selectedTeamId, teams]);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Team[]>('/api/teams');
      setTeams(response.data);
      setFilteredTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    onTeamSelect(team.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedTeam(null);
    onTeamSelect(undefined);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="relative">
      <Label>{t("select_team")}</Label>
      
      {/* Selected team display */}
      {selectedTeam ? (
        <div className="flex items-center justify-between p-3 border rounded-md bg-background">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">{selectedTeam.name}</span>
            <Badge variant="secondary">
              {selectedTeam.users?.length || 0} {t("members")}
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={handleToggle}
          disabled={disabled || isLoading}
        >
          <Users className="h-4 w-4 mr-2" />
          {isLoading ? t("loading_teams") : t("select_team_placeholder")}
        </Button>
      )}

      {/* Team selection dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("select_team")}</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search_teams")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-40 overflow-y-auto">
              {filteredTeams.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? t("no_teams_found") : t("no_teams_available")}
                </div>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-muted border-b last:border-b-0 transition-colors"
                    onClick={() => handleTeamSelect(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{team.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {team.users?.length || 0} {t("members")}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 