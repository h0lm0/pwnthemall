import React, { useState } from "react"
import type { JSX } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserFormData } from "@/models/User"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
interface UserFormProps {
  initialData?: UserFormData
  isEdit?: boolean
  onSubmit: (data: UserFormData) => void
}

export default function UserForm({ initialData, isEdit, onSubmit }: UserFormProps) {
  const [form, setForm] = useState<UserFormData>({
    Username: initialData?.Username || "",
    Email: initialData?.Email || "",
    Password: "",
    Role: initialData?.Username || ""
  })
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (e.target.name === "Password" && error) {
      setError("");
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEdit && (form.Password || "").length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError("");
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-2">
      <div className="grid gap-2">
        <Label htmlFor="Username">Username</Label>
        <Input id="Username" name="Username" value={form.Username} onChange={handleChange} required autoFocus />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="Email">Email</Label>
        <Input id="Email" name="Email" type="email" value={form.Email} onChange={handleChange} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="Role">Role</Label>
        <Select
          name="Role"
          defaultValue={form.Role}
          onValueChange={(value: string) => setForm({ ...form, Role: value })}
          required
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Role</SelectLabel>
              <SelectItem value="member">member</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {!isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="Password">Password</Label>
          <Input id="Password" name="Password" type="password" value={form.Password || ""} onChange={handleChange} required minLength={8} />
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full">Save</Button>
    </form>
  )
}
