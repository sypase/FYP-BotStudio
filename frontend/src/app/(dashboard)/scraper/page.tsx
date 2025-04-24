'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
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
import { Download, Globe, AlertCircle, Loader2, FileJson, Copy, History, Trash2, Edit, Plus, FileUp } from 'lucide-react'
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
import { useDropzone } from 'react-dropzone'

interface QAPair {
  question: string
  answer: string
}

interface ScrapeResponse {
  message: string
  data: {
    scrape: {
      _id: string
      name: string
      url: string
      qaPairs: QAPair[]
      s3FileUrl: string
      createdAt: string
      sourceType: string
    }
    fileUrl: string
  }
}

interface ScrapeHistoryItem {
  _id: string
  name: string
  url?: string
  createdAt: string
  s3FileUrl: string
  s3FileName: string
  sourceType: string
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
        <div key={index} className="border-b border-gray-800">
          <div className="w-full flex items-center justify-between p-4">
            <button 
              className="flex-1 text-left flex items-center justify-between"
              onClick={() => toggleAccordion(index)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="mr-2 bg-gray-800 text-gray-300 border-gray-700">
                  Q{index + 1}
                </Badge>
                <span className="text-white">{pair.question}</span>
              </div>
            </button>
            <div className="flex gap-2 ml-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => startEditing(index)}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDeletePair(index)}
                className="text-gray-300 hover:text-red-500 hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {activeIndex === index && (
            <div className="p-4 bg-gray-800 text-gray-300">
              <p>{pair.answer}</p>
            </div>
          )}
        </div>
      ))}

      {/* Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Q&A Pair</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to this question and answer pair.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right text-gray-300">
                Question
              </Label>
              <Textarea
                id="question"
                value={editedPair.question}
                onChange={(e) => setEditedPair({...editedPair, question: e.target.value})}
                className="col-span-3 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="answer" className="text-right text-gray-300">
                Answer
              </Label>
              <Textarea
                id="answer"
                value={editedPair.answer}
                onChange={(e) => setEditedPair({...editedPair, answer: e.target.value})}
                className="col-span-3 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={saveEdit}
              className="bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
            >
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
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Q&A Pair</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new question and answer pair for this scrape.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-question" className="text-right text-gray-300">
              Question
            </Label>
            <Textarea
              id="new-question"
              value={newPair.question}
              onChange={(e) => setNewPair({...newPair, question: e.target.value})}
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-answer" className="text-right text-gray-300">
              Answer
            </Label>
            <Textarea
              id="new-answer"
              value={newPair.answer}
              onChange={(e) => setNewPair({...newPair, answer: e.target.value})}
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleAdd}
            className="bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
          >
            Add Pair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CSVUploader: React.FC<{
  onUpload: (file: File, name?: string) => void
  loading: boolean
}> = ({ onUpload, loading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-gray-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <FileUp className="h-8 w-8 text-gray-400" />
        <p className="text-gray-300">
          {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here, or click to select'}
        </p>
        <p className="text-sm text-gray-400">Only CSV files are supported</p>
      </div>
    </div>
  )
}

const ScraperPage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [csvLoading, setCsvLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState('form')
  const [token, setToken] = useState<string | null>(null)
  const [history, setHistory] = useState<ScrapeHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [currentScrapeId, setCurrentScrapeId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [activeFormTab, setActiveFormTab] = useState('website') // 'website' or 'csv'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'))
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchHistory()
    }
  }, [token])

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
      toast.success(`Loaded scrape: ${scrape.name}`)
    } catch (error) {
      console.error('Error loading scrape:', error)
      toast.error('Failed to load scrape')
    } finally {
      setLoading(false)
    }
  }

  const updateScrape = async (updatedPairs: QAPair[], updatedName?: string) => {
    if (!token || !currentScrapeId) return
    
    try {
      setLoading(true)
      const response = await axios.put(
        `${serverURL}/scrape/${currentScrapeId}`,
        { 
          qaPairs: updatedPairs,
          ...(updatedName && { name: updatedName })
        },
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

  const handleCSVUpload = async (file: File, name?: string) => {
    if (!token) {
      setError('No authentication token found. Please log in.')
      return
    }

    setCsvLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('qaFile', file)
      if (name) {
        formData.append('name', name)
      }

      const response = await axios.post(`${serverURL}/scrape/upload-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      const scrape = response.data.data.scrape
      setQaPairs(scrape.qaPairs)
      setFileUrl(scrape.s3FileUrl)
      setCurrentScrapeId(scrape._id)
      setActiveTab('results')
      fetchHistory()
      toast.success('CSV uploaded and processed successfully')
    } catch (error: any) {
      console.error('Error uploading CSV:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error processing CSV file'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setCsvLoading(false)
    }
  }

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
        { url, name: name || undefined },
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

  const handleDownload = async (scrapeId: string, fileName: string) => {
    try {
      const response = await axios.get(`${serverURL}/scrape/download/${scrapeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName || 'scrape'}.json`);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="container mx-auto py-8 dark:bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Web Scraper</h1>

      <Tabs defaultValue="website" className="w-full">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="website" className="text-gray-300 data-[state=active]:text-white">
            <Globe className="h-4 w-4 mr-2" />
            From Website
          </TabsTrigger>
          <TabsTrigger value="csv" className="text-gray-300 data-[state=active]:text-white">
            <FileJson className="h-4 w-4 mr-2" />
            From CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="website">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Scrape from Website</CardTitle>
              <CardDescription className="text-gray-400">
                Enter a website URL to scrape content and generate Q&A pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Scrape Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    placeholder="Enter a name for this scrape"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-gray-300">Website URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    placeholder="Enter website URL"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    'Start Scraping'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Upload CSV File</CardTitle>
              <CardDescription className="text-gray-400">
                Upload a CSV file containing Q&A pairs to create a new scrape
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-name" className="text-gray-300">Scrape Name</Label>
                  <Input
                    id="csv-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    placeholder="Enter a name for this scrape"
                  />
                </div>
                <CSVUploader onUpload={handleCSVUpload} loading={csvLoading} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scrape Results */}
      {currentScrapeId && (
        <Card className="mt-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">{name}</CardTitle>
                <CardDescription className="text-gray-400">
                  {url}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(JSON.stringify(qaPairs))}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(fileUrl || '#', '_blank')}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAddDialogOpen(true)}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CustomAccordion
              qaPairs={qaPairs}
              onEditPair={handleEditPair}
              onDeletePair={handleDeletePair}
            />
          </CardContent>
        </Card>
      )}

      {/* Scrape History */}
      <Card className="mt-8 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Scrape History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-gray-800 rounded-lg bg-gray-800 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No scrape history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="p-4 border border-gray-800 rounded-lg bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{item.name || 'Unnamed Scrape'}</h3>
                      <p className="text-sm text-gray-400">
                        Created: {new Date(item.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        Source: {item.sourceType === 'csv_upload' ? 'CSV Upload' : 'Website'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => loadScrape(item._id)}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(item._id, item.name)}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddQAPairDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddPair={handleAddPair}
      />
    </div>
  )
}

export default ScraperPage