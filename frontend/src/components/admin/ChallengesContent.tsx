import Head from "next/head"
import { useState } from "react"
import { Challenge } from "@/models/Challenge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus } from "lucide-react"
import ChallengeAdminForm from "./ChallengeAdminForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChallengesContentProps {
  challenges: Challenge[]
  onRefresh: () => void
}

export default function ChallengesContent({ challenges, onRefresh }: ChallengesContentProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEdit = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setIsDialogOpen(true)
  }

  const handleClose = () => {
    setSelectedChallenge(null)
    setIsDialogOpen(false)
    onRefresh()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (hidden: boolean) => {
    return hidden ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
  }

  return (
    <>
      <Head>
        <title>Challenge Management</title>
      </Head>
      <div className="bg-muted min-h-screen p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Challenge Management</h1>
          <div className="flex items-center gap-2">
            {/* Placeholder for future actions to mirror admin pages layout */}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Challenges</CardTitle>
            <CardDescription>
              Manage challenge configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>First Blood</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.name}</TableCell>
                  <TableCell>{challenge.category?.name || "N/A"}</TableCell>
                  <TableCell>{challenge.type?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(challenge.difficulty?.name || "")}>
                      {challenge.difficulty?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{challenge.points}</TableCell>
                  <TableCell>
                    <Badge variant={challenge.enableFirstBlood ? "default" : "secondary"}>
                      {challenge.enableFirstBlood ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(challenge.hidden ?? false)}>
                      {challenge.hidden ? "Hidden" : "Visible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(challenge)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Challenge Configuration</DialogTitle>
              <DialogDescription>
                Configure points, decay formula, first blood bonus, and hints for this challenge
              </DialogDescription>
            </DialogHeader>
            {selectedChallenge && (
              <ChallengeAdminForm
                challenge={selectedChallenge}
                onClose={handleClose}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
