import Head from "next/head"
import { useState, useMemo, useEffect } from "react"
import { Challenge } from "@/models/Challenge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Plus, Search, ArrowUpDown } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterDifficulty, setFilterDifficulty] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Get unique values for filters
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(challenges.map(c => c.category?.name).filter(Boolean)))
    return uniqueCategories.sort()
  }, [challenges])

  const difficulties = useMemo(() => {
    const uniqueDifficulties = Array.from(new Set(challenges.map(c => c.difficulty?.name).filter(Boolean)))
    return uniqueDifficulties.sort()
  }, [challenges])

  // Filter and sort challenges
  const filteredAndSortedChallenges = useMemo(() => {
    let filtered = challenges.filter(challenge => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.type?.name.toLowerCase().includes(searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = filterCategory === "all" || challenge.category?.name === filterCategory

      // Difficulty filter
      const matchesDifficulty = filterDifficulty === "all" || challenge.difficulty?.name === filterDifficulty

      // Status filter
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "visible" && !challenge.hidden) ||
        (filterStatus === "hidden" && challenge.hidden)

      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
    })

    // Sort challenges
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "category":
          aValue = a.category?.name || ""
          bValue = b.category?.name || ""
          break
        case "difficulty":
          aValue = a.difficulty?.name || ""
          bValue = b.difficulty?.name || ""
          break
        case "points":
          aValue = a.points
          bValue = b.points
          break
        case "type":
          aValue = a.type?.name || ""
          bValue = b.type?.name || ""
          break
        default:
          return 0
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue)
        return sortOrder === "asc" ? comparison : -comparison
      } else {
        const comparison = aValue - bValue
        return sortOrder === "asc" ? comparison : -comparison
      }
    })

    return filtered
  }, [challenges, searchTerm, sortBy, sortOrder, filterCategory, filterDifficulty, filterStatus])

  // Paginated challenges
  const paginatedChallenges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedChallenges.slice(startIndex, endIndex)
  }, [filteredAndSortedChallenges, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedChallenges.length / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterDifficulty, filterStatus])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

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
            
            {/* Search and Filter Section */}
            <div className="space-y-4 pt-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search challenges by name, category, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-')
                  setSortBy(field)
                  setSortOrder(order as "asc" | "desc")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                    <SelectItem value="category-desc">Category (Z-A)</SelectItem>
                    <SelectItem value="difficulty-asc">Difficulty (A-Z)</SelectItem>
                    <SelectItem value="difficulty-desc">Difficulty (Z-A)</SelectItem>
                    <SelectItem value="points-asc">Points (Low to High)</SelectItem>
                    <SelectItem value="points-desc">Points (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {Math.min(filteredAndSortedChallenges.length, paginatedChallenges.length)} of {filteredAndSortedChallenges.length} filtered challenges ({challenges.length} total)
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("category")}
                  >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("type")}
                  >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("difficulty")}
                  >
                    Difficulty
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("points")}
                  >
                    Points
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>First Blood</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedChallenges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No challenges found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedChallenges.map((challenge) => (
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
                ))
              )}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedChallenges.length)} of {filteredAndSortedChallenges.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
