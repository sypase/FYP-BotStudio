'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { serverURL } from '@/utils/utils';
import { Switch } from '@/components/ui/switch';
import { CopyIcon, TrashIcon } from '@radix-ui/react-icons';

interface ApiKey {
  _id: string;
  name: string;
  key: string;
  createdAt: string;
  isActive: boolean;
}

interface ErrorResponse {
  error: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${serverURL}/api-keys`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || 'Failed to fetch API keys');
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setApiKeys(data);
      } else {
        console.error('Received non-array data:', data);
        setApiKeys([]);
        toast.error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setApiKeys([]);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to fetch API keys');
      } else {
        toast.error('Failed to fetch API keys');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${serverURL}/api-keys/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('API key generated successfully');
        setNewKeyName('');
        fetchApiKeys();
      } else {
        toast.error(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleApiKey = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${serverURL}/api-keys/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast.success(`API key ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchApiKeys();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update API key status');
      }
    } catch (error) {
      toast.error('Failed to update API key status');
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`${serverURL}/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast.success('API key deleted successfully');
        fetchApiKeys();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete API key');
      }
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API Keys</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter API key name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <Button onClick={generateApiKey} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading API keys...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-gray-500">No API keys found</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key._id}
                  className="flex flex-col p-4 border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{key.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Active</span>
                        <Switch
                          checked={key.isActive}
                          onCheckedChange={() => toggleApiKey(key._id, key.isActive)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteApiKey(key._id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 p-2 rounded flex-1">
                      {key.key}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 