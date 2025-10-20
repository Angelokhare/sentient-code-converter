import express from "express";
import cors from "cors";
import { z } from "zod";
import { generateObject } from "ai";
import { createFireworks } from "@ai-sdk/fireworks";
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));

// --- Zod schema for converted file output ---
const ConvertedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

type UploadedFile = { path: string; content: string; name?: string };

// --- Initialize Fireworks client ---
const fireworksClient = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY as string,
});

// --- Convert a single file using Dobby AI ---
async function convertFileWithDobby(
  file: UploadedFile,
  targetLanguage: string,
  targetVersion: string
) {
  const prompt = `
You are Dobby, an expert AI code converter.

Convert the following file to ${targetLanguage} ${
    targetVersion === "latest" ? "" : `(${targetVersion})`
  }.
Preserve logic, comments, and structure.

Output ONLY valid JSON matching this schema:
{
  "path": "<string - file path or name>",
  "content": "<string - converted file contents>"
}

Do not include markdown fences, explanations, or any text outside JSON.

File Path: ${file.path}
Filename: ${file.name || ""}
Code:
\`\`\`
${file.content}
\`\`\`
`;

  try {
    const result = await generateObject({
      model: fireworksClient(
        // ⚠️ Make sure this model exists and supports object output
        "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new"
      ),
      schema: ConvertedFileSchema,
      prompt,
      // No responseFormat — Fireworks doesn't support JSON schema formatting
      maxRetries: 2,
    });

    // If object is missing or invalid, handle gracefully
    if (!result.object?.content || !result.object?.path) {
      throw new Error("Invalid or empty conversion result.");
    }

    return result.object;
  } catch (err: any) {
    console.error("🔥 Dobby conversion error:", err.message || err);
    // Graceful fallback so your API doesn't crash
    return {
      path: file.path || "unknown",
      content: `/* Dobby failed to convert file: ${err.message} */\n${file.content}`,
    };
  }
}

// --- API endpoint ---
app.post("/api/convert", async (req, res) => {
  try {
    const { files, targetLanguage, targetVersion } = req.body as {
      files: UploadedFile[];
      targetLanguage: string;
      targetVersion: string;
    };

    if (!files?.length)
      return res.status(400).json({ error: "No files provided" });

    const results = [];

    for (const f of files) {
      const converted = await convertFileWithDobby(
        f,
        targetLanguage,
        targetVersion
      );
      results.push(converted);
      await new Promise((r) => setTimeout(r, 200)); // prevent rate spikes
    }

    return res.json({ files: results });
  } catch (err: any) {
    console.error("🔥 API error:", err.message || err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`⚙️ Dobby AI server running on http://localhost:${port}`);
});