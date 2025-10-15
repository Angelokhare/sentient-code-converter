import { generateObject, generateText } from "ai";
import { createFireworks } from "@ai-sdk/fireworks";
import { z } from "zod";

// --- Schema Definition ---
const CodeConversionOutput = z.object({
converted_code: z.string().describe("Converted code text (not escaped)"),
conversion_notes: z.string().optional().nullable(),
dependencies: z.array(z.string()).optional().nullable(),
warnings: z.array(z.string()).optional().nullable(),
});

export async function convertCodeToLanguage(
sourceCode: string,
sourceLanguage: string,
targetLanguage: string
): Promise<string> {
const MAX_CODE_LENGTH = 50000;
if (sourceCode.length > MAX_CODE_LENGTH) {
console.warn(`⚠️ Code is too large (${sourceCode.length} chars). Max = ${MAX_CODE_LENGTH}.`);
return `# ❌ File Too Large
# The code is too large for AI conversion (${Math.round(sourceCode.length / 1024)}KB).
# Try smaller files or split modules.
`;
}

// Detect React or frontend code
const reactLikePatterns = [
/from\s+['"]react['"]/i,
/ReactDOM/i,
/<\w+/,
/useState|useEffect|useRef|useContext|useMemo/i,
/function\s+\w+\s*\(.*\)\s*{[\s\S]*return\s*<.*>/i,
/\.tsx?$/i,
/import\s+.*\s+from\s+['"].*\.css['"]/i,
];

if (
reactLikePatterns.some((pattern) => pattern.test(sourceCode)) &&
!['javascript', 'typescript'].includes(targetLanguage.toLowerCase())
) {
console.warn(`⚠️ Detected React or frontend code — skipping ${targetLanguage} conversion.`);
return `# ⚠️ Conversion Skipped
# The provided file appears to be React or frontend TypeScript/JSX code.
# These depend on the browser (DOM, JSX, hooks) and can’t be meaningfully converted to ${targetLanguage}.
`;
}

// --- Target language display map ---
const languageMap: Record<string, string> = {
python: "Python 3.10+",
javascript: "JavaScript (ES6+)",
typescript: "TypeScript",
java: "Java 17+",
cpp: "C++17+",
csharp: "C# 10+",
go: "Go 1.20+",
rust: "Rust (latest)",
ruby: "Ruby 3+",
php: "PHP 8+",
swift: "Swift 5+",
kotlin: "Kotlin 1.8+",
};
const targetLangName = languageMap[targetLanguage.toLowerCase()] || targetLanguage;

const prompt = `
You are a professional Code Conversion AI.
Convert the following ${sourceLanguage} code to ${targetLangName}.

Return ONLY JSON like this:
{
"converted_code": "the converted code (no markdown or escaping)",
"conversion_notes": "optional notes",
"dependencies": ["optional libs"],
"warnings": ["optional warnings"]
}

Code to convert:
${sourceCode}
`;

const fireworksClient = createFireworks({
apiKey: import.meta.env.VITE_FIREWORKS_API_KEY as string,
});

try {
// --- Primary attempt: structured JSON output ---
const result = await generateObject({
model: fireworksClient("accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new"),
temperature: 0.1,
schema: CodeConversionOutput,
prompt,
maxRetries: 2,
});

if (result.object.conversion_notes)
console.log("📝 Notes:", result.object.conversion_notes);
if (result.object.dependencies?.length)
console.log("📦 Dependencies:", result.object.dependencies.join(", "));
if (result.object.warnings?.length)
console.warn("⚠️ Warnings:", result.object.warnings.join("; "));

return result.object.converted_code.trim();
} catch (error) {
console.error("❌ Structured conversion failed:", error);

// --- Secondary fallback: text-only output (no JSON parsing required) ---
try {
console.log("🔄 Attempting fallback (generateText)...");
const fallbackResult = await generateText({
model: fireworksClient("accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new"),
temperature: 0.2,
prompt: `Convert the following ${sourceLanguage} code to ${targetLangName}.
Return only the converted code — no explanations, markdown, or notes.

${sourceCode}`,
});

return fallbackResult.text.trim();
} catch (fallbackError) {
console.error("Fallback conversion also failed:", fallbackError);
return `# ❌ Conversion failed.
# ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}
# Try again or split the file into smaller sections.`;
}
}
}

// --- Legacy function for backward compatibility ---
export async function convertCodeToPython(
sourceCode: string,
sourceLanguage: string
): Promise<string> {
return convertCodeToLanguage(sourceCode, sourceLanguage, "python");
}