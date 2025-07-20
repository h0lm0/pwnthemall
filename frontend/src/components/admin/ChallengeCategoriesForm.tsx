import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/context/LanguageContext"

import { ChallengeCategoryFormData } from "@/models/ChallengeCategory"
interface ChallengeCategoryFormProps {
  initialData?: ChallengeCategoryFormData
  isEdit?: boolean
  onSubmit: (data: ChallengeCategoryFormData) => void
}

export default function ChallengeCategoryForm({ initialData, isEdit, onSubmit }: ChallengeCategoryFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ChallengeCategoryFormData>({
    Name: initialData?.Name || "",
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
        <Label htmlFor="Name">{t('name')}</Label>
        <Input id="Name" name="Name" value={form.Name} onChange={handleChange} required autoFocus />
      </div>

      <Button type="submit" className="w-full">{t('save')}</Button>
    </form>
  )
}
