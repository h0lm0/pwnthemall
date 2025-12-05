import { useState, useEffect } from "react"
import { Challenge, ChallengeCategory, ChallengeDifficulty } from "@/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import axios from "@/lib/axios"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FirstBloodManager } from "./FirstBloodManager"

interface ChallengeAdminFormProps {
  readonly challenge: Challenge
  readonly onClose: () => void
}

interface DecayFormula {
  id: number
  name: string
  type: string
  step: number
  minPoints: number
}

interface Hint {
  id: number
  title?: string
  content: string
  cost: number
  challengeId: number
  isActive?: boolean
  autoActiveAt?: string | null
}

interface FirstBloodBonus {
  points: number
  badge: string
}

export default function ChallengeAdminForm({ challenge, onClose }: ChallengeAdminFormProps) {
  const [loading, setLoading] = useState(false)
  const [generalLoading, setGeneralLoading] = useState(false)

  // Helper function to format datetime for backend
  const formatDateTimeForBackend = (dateString: string | null): string | null => {
    if (!dateString) return null
    // Convert datetime-local format to ISO string
    try {
      const date = new Date(dateString)
      return date.toISOString()
    } catch (error) {
      console.error('Error formatting date:', error)
      return null
    }
  }

  // Helper function to format datetime from backend for frontend
  const formatDateTimeForFrontend = (isoString: string | null): string => {
    if (!isoString) return ""
    try {
      const date = new Date(isoString)
      // Format to datetime-local format (YYYY-MM-DDTHH:mm)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (error) {
      console.error('Error parsing date:', error)
      return ""
    }
  }
  const [decayFormulas, setDecayFormulas] = useState<DecayFormula[]>([])
  const [challengeCategories, setChallengeCategories] = useState<ChallengeCategory[]>([])
  const [challengeDifficulties, setChallengeDifficulties] = useState<ChallengeDifficulty[]>([])
  const [formData, setFormData] = useState({
    points: challenge.points || 0,
    enableFirstBlood: challenge.enableFirstBlood || false,
    decayFormulaId: challenge.decayFormulaId || null as number | null,
    hints: challenge.hints || [] as Hint[],
  })
  
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
  const [coverPosition, setCoverPosition] = useState({
    x: challenge.coverPositionX ?? 50,
    y: challenge.coverPositionY ?? 50,
  })
  const [coverLoading, setCoverLoading] = useState(false)
  const [newHint, setNewHint] = useState({ title: "", content: "", cost: 0, isActive: true, autoActiveAt: null as string | null })
  const [editingHints, setEditingHints] = useState<{[key: number]: {title: string, content: string, cost: number, isActive: boolean, autoActiveAt: string | null}}>({})

  useEffect(() => {
    fetchDecayFormulas()
    fetchChallengeCategories()
    fetchChallengeDifficulties()
    fetchChallengeData()
  }, [])

  const fetchChallengeData = async () => {
    try {
      const response = await axios.get(`/api/admin/challenges/${challenge.id}`)
      const challengeData = response.data.challenge
      
      setFormData({
        points: challengeData.points || 0,
        enableFirstBlood: challengeData.enableFirstBlood || false,
        decayFormulaId: challengeData.decayFormulaId || null,
        hints: challengeData.hints || []
      })

      const bonuses = challengeData.firstBloodBonuses || []
      const badges = challengeData.firstBloodBadges || []
      
      if (bonuses.length > 0) {
        setFirstBloodBonuses(bonuses.map((points: number, index: number) => ({
          points,
          badge: badges[index] || 'trophy'
        })))
      } else {
        setFirstBloodBonuses([])
      }
      
    } catch (error) {
      console.error("Failed to fetch challenge data:", error)
    }
  }

  const fetchDecayFormulas = async () => {
    try {
      const response = await axios.get("/api/decay-formulas")
      const validFormulas = response.data.filter((formula: DecayFormula) => 
        formula.name && formula.name.trim() !== '' && formula.id > 0
      ).map((formula: any) => ({
        id: formula.id,
        name: formula.name,
        step: formula.step || 10,
        minPoints: formula.minPoints || 10,
        maxDecay: formula.maxDecay || 90
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
          title: hint.title || "Hint",
          content: hint.content,
          cost: hint.cost,
          isActive: !!(hint as Hint).isActive,
          autoActiveAt: formatDateTimeForBackend((hint as Hint).autoActiveAt || null)
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

  const handleAddHint = async () => {
    if (!newHint.title.trim() || !newHint.content.trim() || newHint.cost < 0) {
      toast.error("Please provide valid hint title, content and cost")
      return
    }

    const newHintData = {
      id: 0,
      title: newHint.title,
      content: newHint.content,
      cost: newHint.cost,
      challengeId: challenge.id,
      isActive: newHint.isActive,
      autoActiveAt: newHint.autoActiveAt
    }
    
    const updatedHints = [...formData.hints, newHintData]
    
    setFormData(prev => ({
      ...prev,
      hints: updatedHints
    }))
    
    try {
      const response = await axios.put(`/api/admin/challenges/${challenge.id}`, {
        points: formData.points,
        enableFirstBlood: formData.enableFirstBlood,
        firstBloodBonuses: firstBloodBonuses.map(bonus => bonus.points),
        firstBloodBadges: firstBloodBonuses.map(bonus => bonus.badge),
        decayFormulaId: formData.decayFormulaId,
        hints: updatedHints.map(hint => ({
          id: hint.id,
          title: hint.title || "Hint",
          content: hint.content,
          cost: hint.cost,
          isActive: !!(hint as Hint).isActive,
          autoActiveAt: formatDateTimeForBackend((hint as Hint).autoActiveAt || null)
        }))
      })
      
      const updatedChallenge = response.data
      if (updatedChallenge.hints) {
        setFormData(prev => ({
          ...prev,
          hints: updatedChallenge.hints
        }))
      }
      
      toast.success("Hint added successfully")
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        hints: prev.hints.slice(0, -1)
      }))
      toast.error("Failed to add hint")
      console.error(error)
      return
    }
    
    setNewHint({ title: "", content: "", cost: 0, isActive: true, autoActiveAt: null })
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

  const handleSaveHint = async (hintId: number, updatedHint: { title: string; content: string; cost: number; isActive: boolean; autoActiveAt: string | null }) => {
    const originalHints = [...formData.hints]
    const updatedHints = formData.hints.map(h => 
      h.id === hintId 
        ? { ...h, title: updatedHint.title, content: updatedHint.content, cost: updatedHint.cost, isActive: updatedHint.isActive, autoActiveAt: updatedHint.autoActiveAt }
        : h
    )
    
    setFormData(prev => ({
      ...prev,
      hints: updatedHints
    }))
    setEditingHints(prev => {
      const { [hintId]: removed, ...rest } = prev;
      return rest;
    })

    try {
      const response = await axios.put(`/api/admin/challenges/${challenge.id}`, {
        points: formData.points,
        enableFirstBlood: formData.enableFirstBlood,
        firstBloodBonuses: firstBloodBonuses.map(bonus => bonus.points),
        firstBloodBadges: firstBloodBonuses.map(bonus => bonus.badge),
        decayFormulaId: formData.decayFormulaId,
        hints: updatedHints.map(hint => ({
          id: hint.id,
          title: hint.title || "Hint",
          content: hint.content,
          cost: hint.cost,
          isActive: !!(hint as Hint).isActive,
          autoActiveAt: formatDateTimeForBackend((hint as Hint).autoActiveAt || null)
        }))
      })

      const updatedChallenge = response.data
      if (updatedChallenge.hints) {
        setFormData(prev => ({
          ...prev,
          hints: updatedChallenge.hints
        }))
      }

      toast.success("Hint updated successfully")
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        hints: originalHints
      }))
      setEditingHints(prev => ({
        ...prev,
        [hintId]: updatedHint
      }))
      
      toast.error("Failed to update hint")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cover">Cover</TabsTrigger>
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
                  onValueChange={(value) => setGeneralData(prev => ({ ...prev, categoryId: Number.parseInt(value) }))}
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
                  onValueChange={(value) => setGeneralData(prev => ({ ...prev, difficultyId: Number.parseInt(value) }))}
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

        <TabsContent value="cover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image Position</CardTitle>
              <CardDescription>
                Adjust how the cover image is cropped on challenge cards. Drag the focal point marker to set the position.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {challenge.coverImg ? (
                <>
                  {/* Full Image with draggable focal point */}
                  <div className="space-y-2">
                    <Label>Full Image (drag the marker to set focal point)</Label>
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div 
                      className="relative w-full border rounded-lg overflow-hidden bg-muted select-none"
                      style={{ maxHeight: '400px' }}
                      onMouseMove={(e) => {
                        if (e.buttons !== 1) return // Only when mouse button is pressed
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                        setCoverPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                        setCoverPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
                      }}
                    >
                      <img
                        src={`/api/challenges/${challenge.id}/cover`}
                        alt="Full cover"
                        className="w-full h-auto pointer-events-none select-none"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                        draggable={false}
                      />
                      {/* Draggable focal point marker */}
                      <div 
                        className="absolute w-8 h-8 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                        style={{ 
                          left: `${coverPosition.x}%`, 
                          top: `${coverPosition.y}%`,
                          backgroundColor: 'rgba(59, 130, 246, 0.7)'
                        }}
                      >
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400" />
                        <div className="absolute inset-2 rounded-full bg-white/50" />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-2">
                    <Label>Preview (as seen on challenge cards)</Label>
                    <div className="flex justify-center">
                      <div className="w-80 h-48 rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={`/api/challenges/${challenge.id}/cover`}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This preview shows how the image will appear on challenge cards
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={async () => {
                        setCoverLoading(true)
                        try {
                          await axios.put(`/api/admin/challenges/${challenge.id}/general`, {
                            ...generalData,
                            coverPositionX: coverPosition.x,
                            coverPositionY: coverPosition.y,
                          })
                          toast.success("Cover position saved successfully")
                        } catch (error) {
                          toast.error("Failed to save cover position")
                          console.error(error)
                        } finally {
                          setCoverLoading(false)
                        }
                      }} 
                      disabled={coverLoading} 
                      className="w-full"
                    >
                      {coverLoading ? "Saving..." : "Save Cover Position"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No cover image configured for this challenge.</p>
                  <p className="text-sm mt-2">Upload a cover image to the challenge directory to enable this feature.</p>
                </div>
              )}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, points: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="decayFormula">Decay Formula</Label>
                <Select
                  value={formData.decayFormulaId?.toString() || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, decayFormulaId: value === "none" ? null : Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a decay formula" />
                  </SelectTrigger>
                  <SelectContent>
                    {decayFormulas.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id.toString()}>
                        {formula.type === 'fixed' 
                          ? formula.name 
                          : `${formula.name} - Step: ${formula.step}, Min: ${formula.minPoints}`
                        }
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Challenge Hints</CardTitle>
                  <CardDescription>
                    Manage hints for this challenge
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await axios.post('/api/admin/challenges/hints/activate-scheduled')
                      toast.success('Hint activation check completed')
                      // Refresh the challenge data to show updated hint statuses
                      const response = await axios.get(`/api/admin/challenges/${challenge.id}`)
                      const updatedChallenge = response.data.challenge
                      if (updatedChallenge.hints) {
                        setFormData(prev => ({
                          ...prev,
                          hints: updatedChallenge.hints
                        }))
                      }
                    } catch (error) {
                      console.error('Error activating scheduled hints:', error);
                      toast.error('Failed to activate scheduled hints')
                    }
                  }}
                >
                  Activate all Hints
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hintTitle">Hint Title</Label>
                  <Input
                    id="hintTitle"
                    value={newHint.title}
                    onChange={(e) => setNewHint(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter hint title..."
                  />
                </div>
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
                    onChange={(e) => setNewHint(prev => ({ ...prev, cost: Number.parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                {/* New hint auto-activation fields */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="newHintActive"
                    checked={newHint.isActive}
                    onCheckedChange={(checked) => setNewHint(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="newHintActive">Active</Label>
                </div>
                
                <div>
                  <Label htmlFor="newHintAutoActive">Auto-activation date/time (optional)</Label>
                  <Input
                    id="newHintAutoActive"
                    type="datetime-local"
                    value={newHint.autoActiveAt || ""}
                    onChange={(e) => setNewHint(prev => ({ ...prev, autoActiveAt: e.target.value || null }))}
                    placeholder="Set auto-activation time"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to disable auto-activation. The hint will become visible at this exact time.
                  </p>
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
                    <div key={hint.id} className="p-3 border rounded-lg space-y-3 bg-background/50 hover:bg-background/80 transition-colors">
                      {editingHints[hint.id] ? (
                        // Mode édition
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`hint-title-${hint.id}`}>Title</Label>
                              <Input
                                id={`hint-title-${hint.id}`}
                                value={editingHints[hint.id].title}
                                onChange={(e) => setEditingHints(prev => ({
                                  ...prev,
                                  [hint.id]: { 
                                    ...prev[hint.id], 
                                    title: e.target.value
                                  }
                                }))}
                                placeholder="Hint title"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`hint-cost-${hint.id}`}>Cost (points)</Label>
                              <Input
                                id={`hint-cost-${hint.id}`}
                                type="number"
                                min="0"
                                value={editingHints[hint.id].cost}
                                onChange={(e) => setEditingHints(prev => ({
                                  ...prev,
                                  [hint.id]: { 
                                    ...prev[hint.id],
                                    cost: Number.parseInt(e.target.value) || 0
                                  }
                                }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`hint-content-${hint.id}`}>Content</Label>
                            <Textarea
                              id={`hint-content-${hint.id}`}
                              value={editingHints[hint.id].content}
                              onChange={(e) => setEditingHints(prev => ({
                                ...prev,
                                [hint.id]: { 
                                  ...prev[hint.id],
                                  content: e.target.value
                                }
                              }))}
                              rows={2}
                            />
                          </div>
                          
                          {/* New auto-activation fields */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`hint-active-${hint.id}`}
                                checked={editingHints[hint.id].isActive}
                                onCheckedChange={(checked) => setEditingHints(prev => ({
                                  ...prev,
                                  [hint.id]: { 
                                    ...prev[hint.id],
                                    isActive: checked,
                                    // Clear auto-activation when manually disabling
                                    autoActiveAt: checked ? prev[hint.id].autoActiveAt : null
                                  }
                                }))}
                              />
                              <Label htmlFor={`hint-active-${hint.id}`}>Active</Label>
                            </div>
                            
                            <div>
                              <Label htmlFor={`hint-auto-active-${hint.id}`}>Auto-activation date/time (optional)</Label>
                              <Input
                                id={`hint-auto-active-${hint.id}`}
                                type="datetime-local"
                                value={formatDateTimeForFrontend(editingHints[hint.id].autoActiveAt)}
                                onChange={(e) => setEditingHints(prev => ({
                                  ...prev,
                                  [hint.id]: { 
                                    ...prev[hint.id],
                                    autoActiveAt: e.target.value || null
                                  }
                                }))}
                                placeholder="Set auto-activation time"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Leave empty to disable auto-activation. The hint will become visible at this exact time.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updatedHint = editingHints[hint.id];
                                  handleSaveHint(hint.id, updatedHint);
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingHints(prev => {
                                  const { [hint.id]: removed, ...rest } = prev;
                                  return rest;
                                })}
                              >
                                Cancel
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHint(hint.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{hint.title || "Hint"}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{hint.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">Cost: {hint.cost} points</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Status: {(hint as Hint).isActive ? (
                                  <span className="text-green-600">Active</span>
                                ) : (
                                  <span className="text-red-600">Inactive</span>
                                )}
                              </p>
                              {(hint as Hint).autoActiveAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Auto-activation: {new Date((hint as Hint).autoActiveAt!).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingHints(prev => ({
                                  ...prev,
                                  [hint.id]: {
                                    title: hint.title || "",
                                    content: hint.content,
                                    cost: hint.cost,
                                    isActive: !!(hint as Hint).isActive,
                                    autoActiveAt: (hint as Hint).autoActiveAt ? formatDateTimeForFrontend((hint as Hint).autoActiveAt!) : null
                                  }
                                }))}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteHint(hint.id)}
                              >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
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
