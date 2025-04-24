"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { encode } from "gpt-tokenizer";

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

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Token Counter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your text here..."
              value={text}
              onChange={handleTextChange}
              className="min-h-[200px]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Character count: {text.length}
            </div>
            <div className="text-lg font-semibold">
              Token count: {tokenCount}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 