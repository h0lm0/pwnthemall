/// <reference types="react" />
import React, { useState } from "react";
import { UserFormData } from "@/models/User";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";

interface UserFormProps {
  initialData?: UserFormData;
  isEdit?: boolean;
  onSubmit: (data: UserFormData) => void;
}

export default function UserForm({ initialData, isEdit, onSubmit }: UserFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<UserFormData>({
    username: initialData?.username || "",
    email: initialData?.email || "",
    password: "",
    role: initialData?.role || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-2">
      <div className="grid gap-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input id="username" name="username" value={form.username} onChange={handleChange} required autoFocus />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" name="password" type="password" value={form.password || ""} onChange={handleChange} autoComplete="new-password" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">{t('role')}</Label>
        <Select value={form.role} onValueChange={(role: string) => setForm((f: UserFormData) => ({ ...f, role }))}>
          <SelectTrigger id="role" name="role">
            <SelectValue placeholder={t('select_role')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('admin')}</SelectItem>
            <SelectItem value="member">{t('user')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">{isEdit ? t('update_user') : t('create_user_button')}</Button>
    </form>
  );
}
