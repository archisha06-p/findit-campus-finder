import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy / safe Gemini client initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fallback rule-based natural language intent parser for instant response or if API key is unconfigured
function fallbackParseIntent(query: string, defaultLocation?: string) {
  const q = query.toLowerCase();

  let urgency: "low" | "normal" | "high" | "critical" = "normal";
  if (
    q.includes("exam in") ||
    q.includes("urgent") ||
    q.includes("critical") ||
    q.includes("right now") ||
    q.includes("immediately") ||
    q.includes("dying") ||
    q.includes("running out") ||
    q.includes("mins") ||
    q.includes("minutes") && (q.includes("exam") || q.includes("class") || q.includes("lab"))
  ) {
    urgency = "critical";
  } else if (q.includes("soon") || q.includes("half an hour") || q.includes("fast") || q.includes("emergency")) {
    urgency = "high";
  } else if (q.includes("tomorrow") || q.includes("later") || q.includes("next week")) {
    urgency = "low";
  }

  // Location extraction
  let user_location = defaultLocation || "Block B";
  if (q.includes("block b")) user_location = "Block B";
  else if (q.includes("block a")) user_location = "Block A";
  else if (q.includes("block c")) user_location = "Block C";
  else if (q.includes("library") || q.includes("central library")) user_location = "Central Library";
  else if (q.includes("student center")) user_location = "Student Center";
  else if (q.includes("hostel")) user_location = "Hostel";
  else if (q.includes("computer lab")) user_location = "Computer Lab";
  else if (q.includes("electronics lab")) user_location = "Electronics Lab";
  else if (q.includes("cafeteria")) user_location = "Cafeteria";
  else if (q.includes("admin")) user_location = "Admin Building";

  // Duration extraction
  let duration_minutes = 60;
  const hourMatch = q.match(/(\d+)\s*(?:hour|hr)/);
  const minMatch = q.match(/(\d+)\s*(?:minute|min)/);
  if (minMatch) {
    duration_minutes = parseInt(minMatch[1], 10);
  } else if (hourMatch) {
    duration_minutes = parseInt(hourMatch[1], 10) * 60;
  } else if (q.includes("half an hour") || q.includes("half hour")) {
    duration_minutes = 30;
  }

  // Item & Category extraction
  let item = "Resource";
  let category = "General";
  let acceptable_alternatives: string[] = [];

  if (q.includes("scientific calculator") || q.includes("calculator") || q.includes("fx-991") || q.includes("casio")) {
    item = q.includes("scientific") ? "Scientific Calculator" : "Scientific Calculator";
    category = "Academic";
    acceptable_alternatives = ["Basic Calculator", "Lab Computer with Calc Software", "Student-owned Scientific Calculator"];
  } else if (q.includes("usb-c") || q.includes("type-c") || (q.includes("charger") && (q.includes("laptop") || q.includes("phone")))) {
    item = "USB-C Charger";
    category = "Electronics";
    acceptable_alternatives = ["65W Multi-Port Charger", "Power Bank 20000mAh", "Student-owned USB-C Cable"];
  } else if (q.includes("hdmi")) {
    item = q.includes("cable") ? "HDMI Cable" : "HDMI Adapter";
    category = "Electronics";
    acceptable_alternatives = ["USB-C to HDMI Hub", "VGA to HDMI Adapter", "Wireless Display Dongle"];
  } else if (q.includes("lightning") || q.includes("iphone charger")) {
    item = "Lightning Cable";
    category = "Electronics";
    acceptable_alternatives = ["USB-C to Lightning Adapter", "Power Bank"];
  } else if (q.includes("textbook") || q.includes("physics") || q.includes("chemistry") || q.includes("book")) {
    if (q.includes("physics")) item = "Physics Textbook (Halliday & Resnick)";
    else if (q.includes("chemistry")) item = "Chemistry Textbook (Atkins)";
    else item = "Course Textbook";
    category = "Academic";
    acceptable_alternatives = ["Library Reference Copy", "Digital PDF Station", "Senior Study Notes"];
  } else if (q.includes("lab coat") || q.includes("goggles") || q.includes("multimeter") || q.includes("breadboard")) {
    if (q.includes("coat")) item = "Cotton Lab Coat (White)";
    else if (q.includes("goggle")) item = "Safety Lab Goggles";
    else if (q.includes("multimeter")) item = "Digital Multimeter";
    else item = "Solderless Breadboard Kit";
    category = "Academic";
    acceptable_alternatives = ["Lab Spare Equipment", "Lab Technician Emergency Reserve"];
  } else if (q.includes("umbrella")) {
    item = "Campus Loaner Umbrella";
    category = "Emergency/useful";
    acceptable_alternatives = ["Rain Poncho", "Hostel Desk Umbrella"];
  } else if (q.includes("headphone") || q.includes("earphone") || q.includes("headset")) {
    item = "Noise Cancelling Headphones";
    category = "Study";
    acceptable_alternatives = ["Earplugs", "Study Cubicle Headset"];
  } else if (q.includes("projector") || q.includes("quiet place") || q.includes("room")) {
    item = "Discussion Room with Projector";
    category = "Academic";
    acceptable_alternatives = ["Library Pod B", "Seminar Hall 202"];
  } else if (q.includes("power bank")) {
    item = "Fast Charging Power Bank";
    category = "Electronics";
    acceptable_alternatives = ["Extension Board", "Wall Charger Spot"];
  } else {
    // Generic extraction from query
    item = query.slice(0, 30).trim();
  }

  return {
    item,
    category,
    quantity: 1,
    duration_minutes,
    urgency,
    user_location,
    max_distance_minutes: 10,
    preferred_condition: "Good",
    acceptable_alternatives,
    source: "heuristic",
  };
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// Natural Language Intent Parser endpoint
app.post("/api/ai/parse-intent", async (req, res) => {
  const { query, defaultLocation } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "Missing or invalid query" });
    return;
  }

  const ai = getGeminiClient();

  if (!ai) {
    const fallback = fallbackParseIntent(query, defaultLocation);
    res.json({ ...fallback, aiPowered: false });
    return;
  }

  try {
    const prompt = `You are a campus resource request parser for FINDIT.
Extract structured information from this student request:
"${query}"
Student's current or implied location context: "${defaultLocation || 'Block B'}"

Return ONLY structured JSON matching this schema:
{
  "item": string (e.g. "Scientific Calculator", "USB-C Charger", "HDMI Adapter"),
  "category": string ("Academic", "Electronics", "Study", "Emergency/useful"),
  "quantity": number (default 1),
  "duration_minutes": number (default 60 unless specified, e.g. "exam in 20 mins" might need 60 mins or 30 mins),
  "urgency": "low" | "normal" | "high" | "critical" (use "critical" for exams starting soon, dead laptop, immediate deadlines),
  "user_location": string (e.g. "Block B", "Block A", "Central Library", "Student Center", "Computer Lab"),
  "max_distance_minutes": number (default 10),
  "preferred_condition": string ("Good", "Any", "New"),
  "acceptable_alternatives": string[] (2-3 reasonable substitute items if exact item is unavailable)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING },
            category: { type: Type.STRING },
            quantity: { type: Type.INTEGER },
            duration_minutes: { type: Type.INTEGER },
            urgency: { type: Type.STRING },
            user_location: { type: Type.STRING },
            max_distance_minutes: { type: Type.INTEGER },
            preferred_condition: { type: Type.STRING },
            acceptable_alternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["item", "category", "urgency", "user_location", "duration_minutes"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      ...parsed,
      aiPowered: true,
      source: "gemini-3.8-flash",
    });
  } catch (error) {
    console.error("Gemini API intent parsing error, falling back:", error);
    const fallback = fallbackParseIntent(query, defaultLocation);
    res.json({ ...fallback, aiPowered: false, fallbackTriggered: true });
  }
});

// Explainable matching endpoint
app.post("/api/ai/explain-match", async (req, res) => {
  const { resource, intent } = req.body;
  const ai = getGeminiClient();

  if (!ai || !resource || !intent) {
    // Return structured default bullet explanations
    const reasons = [
      resource.available ? "Available right now for immediate pickup" : "Limited inventory reservation queue",
      `${resource.distance ?? 2} min walk from your location (${intent?.user_location || "campus"})`,
      `Supports requested duration of ${intent?.duration_minutes || 60} minutes`,
      `Matches requested item type: ${resource.name}`,
    ];
    res.json({
      explanation: `Best match because it is ${resource.available ? "available now" : "nearby"}, ${resource.distance ?? 2} minutes away, and supports a ${resource.borrowDuration || 60}-minute borrowing period.`,
      bulletPoints: reasons,
    });
    return;
  }

  try {
    const prompt = `You are FINDIT's explainable matching engine. Explain in student-friendly, concise language why this campus resource is the top recommended match.
Resource:
${JSON.stringify(resource, null, 2)}

User parsed intent:
${JSON.stringify(intent, null, 2)}

Return JSON with:
{
  "explanation": "1-sentence summary starting with 'Best match because...'",
  "bulletPoints": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error) {
    console.error("Explain match error:", error);
    res.json({
      explanation: `Best match because it is available, ${resource.distance ?? 2} minutes away, and supports a ${resource.borrowDuration || 60}-minute borrowing period.`,
      bulletPoints: [
        "Available for immediate pickup",
        `Only ${resource.distance ?? 2} minutes from your current location`,
        `Accommodates ${intent.duration_minutes || 60} minute session`,
        "Verified verified facility equipment",
      ],
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FINDIT server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
