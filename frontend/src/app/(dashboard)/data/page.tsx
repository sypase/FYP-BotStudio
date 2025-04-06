'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { serverURL } from '@/utils/utils'
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Download, Globe, AlertCircle, Loader2, FileJson, Copy, History, Trash2, Edit, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface QAPair {
  question: string
  answer: string
}

interface ScrapeResponse {
  message: string
  data: {
    scrape: {
      _id: string
      url: string
      qaPairs: QAPair[]
      s3FileUrl: string
      createdAt: string
    }
    fileUrl: string
  }
}

interface ScrapeHistoryItem {
  _id: string
  url: string
  createdAt: string
  s3FileUrl: string
  s3FileName: string
}

const CustomAccordion: React.FC<{ 
  qaPairs: QAPair[]
  onEditPair: (index: number, pair: QAPair) => void
  onDeletePair: (index: number) => void
}> = ({ qaPairs, onEditPair, onDeletePair }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedPair, setEditedPair] = useState<QAPair>({ question: '', answer: '' })

  const toggleAccordion = (index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index))
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditedPair(qaPairs[index])
  }

  const saveEdit = () => {
    if (editingIndex !== null) {
      onEditPair(editingIndex, editedPair)
      setEditingIndex(null)
    }
  }

  return (
    <div>
      {qaPairs.map((pair, index) => (
        <div key={index} className="border-b border-gray-200">
          <div className="w-full flex items-center justify-between p-4">
            <button 
              className="flex-1 text-left flex items-center justify-between"
              onClick={() => toggleAccordion(index)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="mr-2">
                  Q{index + 1}
                </Badge>
                {pair.question}
              </div>
            </button>
            <div className="flex gap-2 ml-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => startEditing(index)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDeletePair(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
          
          {activeIndex === index && (
            <div className="p-4 bg-gray-50 text-black">
              <p>{pair.answer}</p>
            </div>
          )}
        </div>
      ))}

      {/* Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Q&A Pair</DialogTitle>
            <DialogDescription>
              Make changes to this question and answer pair.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right">
                Question
              </Label>
              <Textarea
                id="question"
                value={editedPair.question}
                onChange={(e) => setEditedPair({...editedPair, question: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="answer" className="text-right">
                Answer
              </Label>
              <Textarea
                id="answer"
                value={editedPair.answer}
                onChange={(e) => setEditedPair({...editedPair, answer: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={saveEdit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const AddQAPairDialog: React.FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddPair: (pair: QAPair) => void
}> = ({ open, onOpenChange, onAddPair }) => {
  const [newPair, setNewPair] = useState<QAPair>({ question: '', answer: '' })

  const handleAdd = () => {
    if (newPair.question.trim() && newPair.answer.trim()) {
      onAddPair(newPair)
      setNewPair({ question: '', answer: '' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Q&A Pair</DialogTitle>
          <DialogDescription>
            Create a new question and answer pair for this scrape.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-question" className="text-right">
              Question
            </Label>
            <Textarea
              id="new-question"
              value={newPair.question}
              onChange={(e) => setNewPair({...newPair, question: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-answer" className="text-right">
              Answer
            </Label>
            <Textarea
              id="new-answer"
              value={newPair.answer}
              onChange={(e) => setNewPair({...newPair, answer: e.target.value})}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAdd}>
            Add Pair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ScraperPage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState('form')
  const [token, setToken] = useState<string | null>(null)
  const [history, setHistory] = useState<ScrapeHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [currentScrapeId, setCurrentScrapeId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'))
    }
  }, [])

  const fetchHistory = async () => {
    if (!token) return
    
    try {
      setHistoryLoading(true)
      const response = await axios.get(`${serverURL}/scrape/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setHistory(response.data.data)
    } catch (error) {
      console.error('Error fetching history:', error)
      toast.error('Failed to load scrape history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadScrape = async (id: string) => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await axios.get(`${serverURL}/scrape/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const scrape = response.data.data
      setQaPairs(scrape.qaPairs)
      setFileUrl(scrape.s3FileUrl)
      setCurrentScrapeId(scrape._id)
      setActiveTab('results')
      toast.success(`Loaded scrape from ${scrape.url}`)
    } catch (error) {
      console.error('Error loading scrape:', error)
      toast.error('Failed to load scrape')
    } finally {
      setLoading(false)
    }
  }

  const updateScrape = async (updatedPairs: QAPair[]) => {
    if (!token || !currentScrapeId) return
    
    try {
      setLoading(true)
      const response = await axios.put(
        `${serverURL}/scrape/${currentScrapeId}`,
        { qaPairs: updatedPairs },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      setQaPairs(updatedPairs)
      setFileUrl(response.data.data.s3FileUrl)
      toast.success('Scrape updated successfully')
      fetchHistory() // Refresh history
    } catch (error) {
      console.error('Error updating scrape:', error)
      toast.error('Failed to update scrape')
    } finally {
      setLoading(false)
    }
  }

  const addQAPairs = async (newPairs: QAPair[]) => {
    if (!token || !currentScrapeId) return
    
    try {
      setLoading(true)
      const response = await axios.patch(
        `${serverURL}/scrape/${currentScrapeId}`,
        { qaPairs: newPairs },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      setQaPairs(response.data.data.qaPairs)
      setFileUrl(response.data.data.s3FileUrl)
      toast.success('Q&A pairs added successfully')
      fetchHistory() // Refresh history
    } catch (error) {
      console.error('Error adding Q&A pairs:', error)
      toast.error('Failed to add Q&A pairs')
    } finally {
      setLoading(false)
    }
  }

  const deleteScrape = async () => {
    if (!token || !currentScrapeId) return
    
    try {
      setLoading(true)
      await axios.delete(`${serverURL}/scrape/${currentScrapeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      setQaPairs([])
      setFileUrl(null)
      setCurrentScrapeId(null)
      setActiveTab('form')
      toast.success('Scrape deleted successfully')
      fetchHistory() // Refresh history
    } catch (error) {
      console.error('Error deleting scrape:', error)
      toast.error('Failed to delete scrape')
    } finally {
      setLoading(false)
      setDeleteConfirmOpen(false)
    }
  }

  useEffect(() => {
    if (token && activeTab === 'history') {
      fetchHistory()
    }
  }, [token, activeTab])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (!token) {
      setError('No authentication token found. Please log in.')
      setLoading(false)
      return
    }

    try {
      const scrapePromise = axios.post<ScrapeResponse>(
        `${serverURL}/scrape`,
        { url },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      toast.promise(scrapePromise, {
        loading: 'Scraping website content...',
        success: (response) => {
          if (response.data?.data?.scrape?.qaPairs) {
            setQaPairs(response.data.data.scrape.qaPairs)
            setFileUrl(response.data.data.fileUrl || response.data.data.scrape.s3FileUrl)
            setCurrentScrapeId(response.data.data.scrape._id)
            setActiveTab('results')
            fetchHistory() // Refresh history after new scrape
            return `Generated ${response.data.data.scrape.qaPairs.length} Q&A pairs`
          }
          return 'Scraping completed!'
        },
        error: (error) => {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'An error occurred while scraping the website'
          setError(errorMessage)
          return errorMessage
        },
      })

      await scrapePromise
    } catch (error: any) {
      console.error('Error fetching QA pairs:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred while scraping the website'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('All Q&A pairs have been copied to your clipboard')
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
        toast.error('Failed to copy Q&A pairs to clipboard')
      })
  }

  const handleEditPair = (index: number, updatedPair: QAPair) => {
    const updatedPairs = [...qaPairs]
    updatedPairs[index] = updatedPair
    updateScrape(updatedPairs)
  }

  const handleDeletePair = (index: number) => {
    const updatedPairs = [...qaPairs]
    updatedPairs.splice(index, 1)
    updateScrape(updatedPairs)
  }

  const handleAddPair = (newPair: QAPair) => {
    addQAPairs([newPair])
  }

  return (
    <div className="p-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Website Scraper</h1>
        <p className="text-muted-foreground">Extract content from websites and generate Q&A pairs using AI</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="form">Scrape Website</TabsTrigger>
          <TabsTrigger value="results" disabled={qaPairs.length === 0}>
            Results {qaPairs.length > 0 && `(${qaPairs.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Scraper</CardTitle>
              <CardDescription>Enter a website URL to scrape content and generate Q&A pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium">
                    Website URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="url"
                        id="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        "Scrape Website"
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && (
                <div className="space-y-3 mt-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {fileUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileJson className="mr-2 h-5 w-5" />
                  Saved QA Pairs
                </CardTitle>
                <CardDescription>Your Q&A pairs have been saved and are ready for download</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Download JSON File
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Scrape
                </Button>
              </CardContent>
            </Card>
          )}

          {qaPairs.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Generated Q&A Pairs</CardTitle>
                    <CardDescription>
                      {qaPairs.length} question-answer pairs generated from {url}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pair
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CustomAccordion 
                  qaPairs={qaPairs} 
                  onEditPair={handleEditPair}
                  onDeletePair={handleDeletePair}
                />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(qaPairs, null, 2))}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy All Q&A Pairs
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Scrape History
              </CardTitle>
              <CardDescription>
                View your previous website scrapes and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No scrape history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item._id} className="hover:bg-gray-50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.url}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadScrape(item._id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={item.s3FileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Q&A Pair Dialog */}
      <AddQAPairDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onAddPair={handleAddPair}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the scrape and all its Q&A pairs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteScrape} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Scrape"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ScraperPage