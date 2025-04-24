"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { encode } from "gpt-tokenizer";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw } from "lucide-react";

export default function TokenCounterPage() {
  const [text, setText] = useState("");
  const [tokenCount, setTokenCount] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    // Count tokens using gpt-tokenizer
    const tokens = encode(newText);
    setTokenCount(tokens.length);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    setText("");
    setTokenCount(0);
  };

  return (
    <div className="container mx-auto p-6 dark:bg-gray-950 min-h-screen">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">OpenAI Token Counter</CardTitle>
          <CardDescription className="text-gray-400">
            Count tokens for OpenAI's GPT models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your text here..."
              value={text}
              onChange={handleTextChange}
              className="min-h-[200px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Character count: {text.length}
            </div>
            <div className="text-lg font-semibold text-white">
              Token count: {tokenCount}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
              onClick={handleCopy}
              disabled={!text}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
            <Button
              className="bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
              onClick={handleClear}
              disabled={!text}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 