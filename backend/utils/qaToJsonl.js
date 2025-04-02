// qaToJsonl.js
export function convertQAtoJSONL(qaPairs, organizationConfig = {}) {
  const defaultConfig = {
    organizationName: "Islington College",
    systemPrompt: "You are an official assistant for {organizationName}.",
    botName: "{organizationName} Bot",
    tone: "professional",
    responseGuidelines: "Provide accurate information from official sources.",
    metadata: {},
  };

  // Merge configs
  const config = {
    ...defaultConfig,
    ...organizationConfig,
  };

  // Replace template variables
  const processTemplate = (str) => {
    return str.replace(/{organizationName}/g, config.organizationName);
  };

  const jsonlLines = qaPairs.map((pair) => {
    const message = {
      messages: [
        {
          role: "system",
          content: [
            processTemplate(config.systemPrompt),
            `Tone: ${config.tone}`,
            `Guidelines: ${processTemplate(config.responseGuidelines)}`,
            `Bot Name: ${processTemplate(config.botName)}`,
          ].join("\n"),
        },
        {
          role: "user",
          content: pair.question.replace(/^\d+\.\s*/, ""), // Remove numbering
        },
        {
          role: "assistant",
          content: pair.answer,
        },
      ],
      metadata: {
        ...config.metadata,
        organization: config.organizationName,
        created_at: new Date().toISOString(),
      },
    };
    return JSON.stringify(message);
  });

  return jsonlLines.join("\n");
}
