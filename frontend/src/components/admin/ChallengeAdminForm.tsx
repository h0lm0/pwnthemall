import { useState, useEffect } from "react"
import { Challenge } from "@/models/Challenge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import axios from "@/lib/axios"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ChallengeAdminFormProps {
  challenge: Challenge
  onClose: () => void
}

interface DecayFormula {
  id: number
  name: string
  type: string
  decayStep: number
  minPoints: number
}

interface Hint {
  id: number
  content: string
  cost: number
  challengeId: number
}

export default function ChallengeAdminForm({ challenge, onClose }: ChallengeAdminFormProps) {
  const [loading, setLoading] = useState(false)
  const [decayFormulas, setDecayFormulas] = useState<DecayFormula[]>([])
  const [formData, setFormData] = useState({
    points: challenge.points || 0,
    enableFirstBlood: challenge.enableFirstBlood || false,
    firstBloodBonus: challenge.firstBloodBonus || 100,
    decayFormulaId: challenge.decayFormulaId || null as number | null,
    hints: challenge.hints || [] as Hint[],
  })
  const [newHint, setNewHint] = useState({ content: "", cost: 0 })

  useEffect(() => {
    fetchDecayFormulas()
  }, [])

  const fetchDecayFormulas = async () => {
    try {
      const response = await axios.get("/api/decay-formulas")
      // Filter out decay formulas with empty names
      const validFormulas = response.data.filter((formula: DecayFormula) => formula.name && formula.name.trim() !== '')
      setDecayFormulas(validFormulas)
    } catch (error) {
      console.error("Failed to fetch decay formulas:", error)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await axios.put(`/api/challenges/admin/${challenge.id}`, {
        points: formData.points,
        enableFirstBlood: formData.enableFirstBlood,
        firstBloodBonus: formData.firstBloodBonus,
        decayFormulaId: formData.decayFormulaId,
        hints: formData.hints.map(hint => ({
          id: hint.id,
          content: hint.content,
          cost: hint.cost,
          isActive: true
        }))
      })
      toast.success("Challenge configuration updated successfully")
      onClose()
    } catch (error) {
      toast.error("Failed to update challenge configuration")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHint = () => {
    if (!newHint.content.trim() || newHint.cost < 0) {
      toast.error("Please provide valid hint content and cost")
      return
    }

    const newHintData = {
      id: 0,
      content: newHint.content,
      cost: newHint.cost,
      challengeId: challenge.id
    }
    
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, newHintData]
    }))
    
    setNewHint({ content: "", cost: 0 })
    toast.success("Hint added to form")
  }

  const handleDeleteHint = async (hintId: number) => {
    try {
      await axios.delete(`/api/challenges/admin/hints/${hintId}`)
      
      setFormData(prev => ({
        ...prev,
        hints: prev.hints.filter(hint => hint.id !== hintId)
      }))
      
      toast.success("Hint deleted successfully")
    } catch (error) {
      toast.error("Failed to delete hint")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="points" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="points">Points & Decay</TabsTrigger>
          <TabsTrigger value="firstblood">First Blood</TabsTrigger>
          <TabsTrigger value="hints">Hints</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points Configuration</CardTitle>
              <CardDescription>
                Set the base points and decay formula for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="points">Base Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="decayFormula">Decay Formula</Label>
                <Select
                  value={formData.decayFormulaId?.toString() || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, decayFormulaId: value === "none" ? null : parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a decay formula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {decayFormulas.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id.toString()}>
                        {formula.name} ({formula.type}) - Step: {formula.decayStep}, Min: {formula.minPoints}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firstblood" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>First Blood Bonus</CardTitle>
              <CardDescription>
                Configure the first blood bonus for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableFirstBlood">Enable First Blood Bonus</Label>
                <Switch
                  id="enableFirstBlood"
                  checked={formData.enableFirstBlood}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, enableFirstBlood: checked }))}
                />
              </div>

              {formData.enableFirstBlood && (
                <div>
                  <Label htmlFor="firstBloodBonus">First Blood Bonus Points</Label>
                  <Input
                    id="firstBloodBonus"
                    type="number"
                    min="0"
                    value={formData.firstBloodBonus}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstBloodBonus: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Hints</CardTitle>
              <CardDescription>
                Manage hints for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hintContent">Hint Content</Label>
                  <Textarea
                    id="hintContent"
                    value={newHint.content}
                    onChange={(e) => setNewHint(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter hint content..."
                  />
                </div>
                <div>
                  <Label htmlFor="hintCost">Cost (points)</Label>
                  <Input
                    id="hintCost"
                    type="number"
                    min="0"
                    value={newHint.cost}
                    onChange={(e) => setNewHint(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <Button onClick={handleAddHint} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hint
                </Button>
              </div>

              {formData.hints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Existing Hints</h4>
                  {formData.hints.map((hint) => (
                    <div key={hint.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{hint.content}</p>
                        <p className="text-xs text-muted-foreground">Cost: {hint.cost} points</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHint(hint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
