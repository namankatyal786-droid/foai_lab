import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(express.json());

  // API route for image generation
  app.post("/api/generate", async (req, res) => {
    console.log("Received generation request:", req.body.prompt ? "Prompt present" : "No prompt");
    try {
      const { prompt, token } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const hfToken = token || process.env.HF_TOKEN;
      if (!hfToken) {
        console.warn("Missing HF token in request and environment");
        return res.status(400).json({ error: "Hugging Face token is missing. Please provide it in settings or configure HF_TOKEN environment variable." });
      }

      console.log("Calling Hugging Face API...");
      const response = await fetch(
        "https://router.huggingface.co/nscale/v1/images/generations",
        {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            response_format: "b64_json",
            prompt: prompt,
            model: "stabilityai/stable-diffusion-xl-base-1.0",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HF API Error:", errorText);
        return res.status(response.status).json({ error: "Failed to generate image", details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen when not in Vercel environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
