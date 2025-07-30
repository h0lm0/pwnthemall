import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Search, X } from 'lucide-react';
import { User as UserModel } from '@/models/User';
import { useLanguage } from '@/context/LanguageContext';
import axios from '@/lib/axios';

interface UserSelectorProps {
  selectedUserId?: number;
  onUserSelect: (userId: number | undefined) => void;
  disabled?: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onUserSelect,
  disabled = false
}) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Set selected user when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<UserModel[]>('/api/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: UserModel) => {
    setSelectedUser(user);
    onUserSelect(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    onUserSelect(undefined);
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
      <Label>{t("select_user")}</Label>
      
      {/* Selected user display */}
      {selectedUser ? (
        <div className="flex items-center justify-between p-3 border rounded-md bg-background">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <span className="font-medium">{selectedUser.username}</span>
              <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
            </div>
            <Badge variant={selectedUser.role === 'admin' ? 'destructive' : 'secondary'}>
              {selectedUser.role}
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
          <User className="h-4 w-4 mr-2" />
          {isLoading ? t("loading_users") : t("select_user_placeholder")}
        </Button>
      )}

      {/* User selection dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("select_user")}</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search_users")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-40 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? t("no_users_found") : t("no_users_available")}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-muted border-b last:border-b-0 transition-colors"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <span className="font-medium">{user.username}</span>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
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