import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { BadgeIcon } from "@/components/badges/BadgeIcon"

interface FirstBloodBonus {
  points: number
  badge: string
}

interface FirstBloodManagerProps {
  bonuses: FirstBloodBonus[]
  onChange: (bonuses: FirstBloodBonus[]) => void
}

const availableBadges = [
  { value: 'trophy', label: 'Trophy' },
  { value: 'medal', label: 'Medal' },
  { value: 'crown', label: 'Crown' },
  { value: 'star', label: 'Star' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'fire', label: 'Fire' },
  { value: 'lightning', label: 'Lightning' },
  { value: 'rocket', label: 'Rocket' }
]

export const FirstBloodManager: React.FC<FirstBloodManagerProps> = ({ bonuses, onChange }) => {
  const [newBonus, setNewBonus] = useState<FirstBloodBonus>({ points: 100, badge: 'trophy' })

  const addBonus = () => {
    if (newBonus.points <= 0) return
    
    const updatedBonuses = [...bonuses, { ...newBonus }]
    onChange(updatedBonuses)
    setNewBonus({ points: 100, badge: 'trophy' })
  }

  const removeBonus = (index: number) => {
    const updatedBonuses = bonuses.filter((_, i) => i !== index)
    onChange(updatedBonuses)
  }

  const updateBonus = (index: number, field: keyof FirstBloodBonus, value: string | number) => {
    const updatedBonuses = bonuses.map((bonus, i) => 
      i === index ? { ...bonus, [field]: value } : bonus
    )
    onChange(updatedBonuses)
  }

  return (
    <Card className="bg-card text-card-foreground border-border">
      <CardHeader>
        <CardTitle className="text-foreground">First Blood Bonuses</CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure position-based bonuses and badges for first solves
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new bonus */}
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <Label className="text-sm font-medium text-foreground">Add New Bonus</Label>
          <div className="flex gap-3 mt-2">
            <div className="flex-1">
              <Input
                type="number"
                min="1"
                value={newBonus.points}
                onChange={(e) => setNewBonus(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                placeholder="Bonus points"
                className="bg-background text-foreground border-input"
              />
            </div>
            <div className="flex-1">
              <Select
                value={newBonus.badge}
                onValueChange={(value) => setNewBonus(prev => ({ ...prev, badge: value }))}
              >
                <SelectTrigger className="bg-background text-foreground border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {availableBadges.map((badge) => (
                    <SelectItem 
                      key={badge.value} 
                      value={badge.value}
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <BadgeIcon badgeType={badge.value} className="w-4 h-4" />
                        {badge.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={addBonus}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Existing bonuses */}
        {bonuses.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Configured Bonuses (Position Order)
            </Label>
            {bonuses.map((bonus, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <BadgeIcon badgeType={bonus.badge} className="w-5 h-5 text-foreground" />
                  <span className="text-sm text-foreground">
                    {bonus.points} points
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={bonus.points}
                    onChange={(e) => updateBonus(index, 'points', parseInt(e.target.value) || 0)}
                    className="w-20 bg-background text-foreground border-input"
                  />
                  <Select
                    value={bonus.badge}
                    onValueChange={(value) => updateBonus(index, 'badge', value)}
                  >
                    <SelectTrigger className="w-32 bg-background text-foreground border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      {availableBadges.map((badge) => (
                        <SelectItem 
                          key={badge.value} 
                          value={badge.value}
                          className="hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <BadgeIcon badgeType={badge.value} className="w-4 h-4" />
                            {badge.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBonus(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {bonuses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No bonuses configured yet. Add your first bonus above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FirstBloodManager
