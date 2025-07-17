import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserFormData } from "@/models/User"

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
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
      {!isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="Password">Password</Label>
          <Input id="Password" name="Password" type="password" value={form.Password || ""} onChange={handleChange} required />
        </div>
      )}
      <Button type="submit" className="w-full">Save</Button>
    </form>
  )
}
