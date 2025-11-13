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
  apiError?: string | null;
}

export default function UserForm({ initialData, isEdit, onSubmit, apiError }: UserFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<UserFormData>({
    username: initialData?.username || "",
    email: initialData?.email ?? "",
    password: "",
    role: initialData?.role || ""
  });
  const [errors, setErrors] = useState<{username?: string, email?: string, password?: string, role?: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error = "";
    if (name === "username" && value.length > 32) error = t('username_too_long') || "Username too long (max 32)";
    if (name === "email" && value.length > 254) error = t('email_too_long') || "Email too long (max 254)";
    if (name === "password" && value.length > 72) error = t('password_too_long') || "Password too long (max 72)";
    setErrors({ ...errors, [name]: error });
    setForm({ ...form, [name]: value });
  };

  const handleRoleChange = (role: string) => {
    let error = "";
    if (!role) error = t('role_required');
    setErrors({ ...errors, role: error });
    setForm((f: UserFormData) => ({ ...f, role }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { ...errors };
    if (!form.role) {
      newErrors.role = t('role_required');
      hasError = true;
    }
    if (form.username.length > 32 || (form.email?.length ?? 0) > 254) hasError = true;
    if (form.password && form.password.length > 72) hasError = true;
    setErrors(newErrors);
    if (hasError) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-2">
      {apiError && <div className="text-red-500 text-sm mb-2">{apiError}</div>}
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
        <Select value={form.role} onValueChange={handleRoleChange} required>
          <SelectTrigger id="role" name="role">
            <SelectValue placeholder={t('select_role')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('admin')}</SelectItem>
            <SelectItem value="member">{t('member')}</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <span className="text-red-500 text-xs">{errors.role}</span>}
      </div>
      <Button type="submit" className="w-full">{isEdit ? t('update_user') : t('create_user')}</Button>
    </form>
  );
}
