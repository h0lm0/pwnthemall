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
import { FirstBloodManager } from "./FirstBloodManager"
import { ChallengeCategory } from "@/models/ChallengeCategory"
import { ChallengeDifficulty } from "@/models/ChallengeDifficulty"

interface ChallengeAdminFormProps {
  challenge: Challenge
  onClose: () => void
}

interface DecayFormula {
  id: number
  name: string
  step: number
  minPoints: number
}

interface Hint {
  id: number
  content: string
  cost: number
  challengeId: number
}

interface FirstBloodBonus {
  points: number
  badge: string
}

export default function ChallengeAdminForm({ challenge, onClose }: ChallengeAdminFormProps) {
  const [loading, setLoading] = useState(false)
  const [generalLoading, setGeneralLoading] = useState(false)
  const [decayFormulas, setDecayFormulas] = useState<DecayFormula[]>([])
  const [challengeCategories, setChallengeCategories] = useState<ChallengeCategory[]>([])
  const [challengeDifficulties, setChallengeDifficulties] = useState<ChallengeDifficulty[]>([])
  const [formData, setFormData] = useState({
    points: challenge.points || 0,
    enableFirstBlood: challenge.enableFirstBlood || false,
    decayFormulaId: challenge.decayFormulaId || null as number | null,
    hints: challenge.hints || [] as Hint[],
  })
  
  // Convert arrays to FirstBloodBonus objects for easier management
  const initializeFirstBloodBonuses = (): FirstBloodBonus[] => {
    const bonuses = challenge.firstBloodBonuses || []
    const badges = challenge.firstBloodBadges || []
    
    if (bonuses.length === 0) return []
    
    return bonuses.map((points, index) => ({
      points,
      badge: badges[index] || 'trophy'
    }))
  }
  
  const [firstBloodBonuses, setFirstBloodBonuses] = useState<FirstBloodBonus[]>(initializeFirstBloodBonuses())
  const [generalData, setGeneralData] = useState({
    name: challenge.name || "",
    description: challenge.description || "",
    author: challenge.author || "",
    hidden: challenge.hidden || false,
    categoryId: challenge.categoryId || 1,
    difficultyId: challenge.difficultyId || 1,
  })
  const [newHint, setNewHint] = useState({ content: "", cost: 0 })

  useEffect(() => {
    fetchDecayFormulas()
    fetchChallengeCategories()
    fetchChallengeDifficulties()
  }, [])

  const fetchDecayFormulas = async () => {
    try {
      const response = await axios.get("/api/decay-formulas")
      // Filter out decay formulas with empty names and ensure all required fields
      const validFormulas = response.data.filter((formula: DecayFormula) => 
        formula.name && formula.name.trim() !== '' && formula.id > 0
      ).map((formula: any) => ({
        id: formula.id,
        name: formula.name,
        step: formula.step || 10,
        minPoints: formula.minPoints || 10,
        maxDecay: formula.maxDecay || 90.0
      }))
      setDecayFormulas(validFormulas)
    } catch (error) {
      console.error("Failed to fetch decay formulas:", error)
    }
  }

  const fetchChallengeCategories = async () => {
    try {
      const response = await axios.get("/api/challenge-categories")
      setChallengeCategories(response.data)
    } catch (error) {
      console.error("Failed to fetch challenge categories:", error)
    }
  }

  const fetchChallengeDifficulties = async () => {
    try {
      const response = await axios.get(`/api/admin/challenges/${challenge.id}`)
      if (response.data.challengeDifficulties) {
        setChallengeDifficulties(response.data.challengeDifficulties)
      }
    } catch (error) {
      console.error("Failed to fetch challenge difficulties:", error)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Convert FirstBloodBonus objects back to separate arrays
      const firstBloodBonusesArray = firstBloodBonuses.map(bonus => bonus.points)
      const firstBloodBadgesArray = firstBloodBonuses.map(bonus => bonus.badge)
      
      await axios.put(`/api/admin/challenges/${challenge.id}`, {
        points: formData.points,
        enableFirstBlood: formData.enableFirstBlood,
        firstBloodBonuses: firstBloodBonusesArray,
        firstBloodBadges: firstBloodBadgesArray,
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

  const handleGeneralSubmit = async () => {
    setGeneralLoading(true)
    try {
      await axios.put(`/api/admin/challenges/${challenge.id}/general`, generalData)
      toast.success("Challenge information updated successfully")
      onClose()
    } catch (error) {
      toast.error("Failed to update challenge information")
      console.error(error)
    } finally {
      setGeneralLoading(false)
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
      await axios.delete(`/api/admin/challenges/hints/${hintId}`)
      
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
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="points">Points & Decay</TabsTrigger>
          <TabsTrigger value="firstblood">First Blood</TabsTrigger>
          <TabsTrigger value="hints">Hints</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Edit the basic information for this challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Challenge Name</Label>
                <Input
                  id="name"
                  value={generalData.name}
                  onChange={(e) => setGeneralData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter challenge name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={generalData.description}
                  onChange={(e) => setGeneralData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter challenge description"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={generalData.author}
                  onChange={(e) => setGeneralData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Enter author name"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={generalData.categoryId?.toString() || ""}
                  onValueChange={(value) => setGeneralData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {challengeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={generalData.difficultyId?.toString() || ""}
                  onValueChange={(value) => setGeneralData(prev => ({ ...prev, difficultyId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {challengeDifficulties.map((difficulty) => (
                      <SelectItem key={difficulty.id} value={difficulty.id.toString()}>
                        {difficulty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hidden">Hidden</Label>
                <Switch
                  id="hidden"
                  checked={generalData.hidden}
                  onCheckedChange={(checked: boolean) => setGeneralData(prev => ({ ...prev, hidden: checked }))}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleGeneralSubmit} disabled={generalLoading} className="w-full">
                  {generalLoading ? "Saving..." : "Save General Information"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                        {formula.name} - Step: {formula.step}, Min: {formula.minPoints}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="firstblood" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Label htmlFor="enableFirstBlood">Enable First Blood System</Label>
            <Switch
              id="enableFirstBlood"
              checked={formData.enableFirstBlood}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, enableFirstBlood: checked }))}
            />
          </div>

          {formData.enableFirstBlood && (
            <FirstBloodManager 
              bonuses={firstBloodBonuses}
              onChange={setFirstBloodBonuses}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
