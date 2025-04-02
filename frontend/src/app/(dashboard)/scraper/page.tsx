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
import { Download, Globe, AlertCircle, Loader2, FileJson, Copy, History } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

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
}

const CustomAccordion: React.FC<{ qaPairs: QAPair[] }> = ({ qaPairs }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index))
  }

  return (
    <div>
      {qaPairs.map((pair, index) => (
        <div key={index} className="border-b border-gray-200">
          <button className="w-full text-left flex items-center justify-between p-4" onClick={() => toggleAccordion(index)}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="mr-2">
                Q{index + 1}
              </Badge>
              {pair.question}
            </div>
          </button>
          {activeIndex === index && (
            <div className="p-4 bg-gray-50 text-black">
              <p>{pair.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
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

  useEffect(() => {
    // Safely get token from localStorage
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
      setActiveTab('results')
      toast.success(`Loaded scrape from ${scrape.url}`)
    } catch (error) {
      console.error('Error loading scrape:', error)
      toast.error('Failed to load scrape')
    } finally {
      setLoading(false)
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
              <CardContent>
                <Button asChild variant="outline" className="gap-2">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Download JSON File
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {qaPairs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Q&A Pairs</CardTitle>
                <CardDescription >
                  {qaPairs.length} question-answer pairs generated from {url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomAccordion qaPairs={qaPairs} />
              </CardContent>
              <CardFooter>
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
    </div>
  )
}

export default ScraperPage