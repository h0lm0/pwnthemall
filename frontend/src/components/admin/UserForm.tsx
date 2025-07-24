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
    email: initialData?.email ?? "",
    password: "",
    role: initialData?.role || ""
  });
  const [errors, setErrors] = useState<{username?: string, email?: string, password?: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error = "";
    if (name === "username" && value.length > 32) error = t('username_too_long') || "Username too long (max 32)";
    if (name === "email" && value.length > 254) error = t('email_too_long') || "Email too long (max 254)";
    if (name === "password" && value.length > 72) error = t('password_too_long') || "Password too long (max 72)";
    setErrors({ ...errors, [name]: error });
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.username.length > 32 || (form.email?.length ?? 0) > 254) return;
    if (form.password && form.password.length > 72) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-2">
      <div className="grid gap-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input id="username" name="username" value={form.username} onChange={handleChange} required autoFocus maxLength={32} />
        {errors.username && <span className="text-red-500 text-xs">{errors.username}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" value={form.email || ""} onChange={handleChange} required maxLength={254} />
        {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" name="password" type="password" value={form.password || ""} onChange={handleChange} autoComplete="new-password" maxLength={72} />
        {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">{t('role')}</Label>
        <Select value={form.role} onValueChange={(role: string) => setForm((f: UserFormData) => ({ ...f, role }))}>
          <SelectTrigger id="role" name="role">
            <SelectValue placeholder={t('select_role')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('admin')}</SelectItem>
            <SelectItem value="member">{t('member')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">{isEdit ? t('update_user') : t('create_user_button')}</Button>
    </form>
  );
}
