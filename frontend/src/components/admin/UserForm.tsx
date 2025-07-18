import React, { useState } from "react";
import { UserFormData } from "@/models/User";

interface UserFormProps {
  initialData?: UserFormData;
  isEdit?: boolean;
  onSubmit: (data: UserFormData) => void;
}

export default function UserForm({ initialData, isEdit, onSubmit }: UserFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" value={form.username} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password || ""} onChange={handleChange} autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="role">Role</label>
        <input id="role" name="role" value={form.role || ""} onChange={handleChange} />
      </div>
      <button type="submit">{isEdit ? "Update User" : "Create User"}</button>
    </form>
  );
}
