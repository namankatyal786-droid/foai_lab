import { useState, FormEvent, useEffect } from "react";
import { Image as ImageIcon, Send, Loader2, Download, Sparkles, AlertCircle, Settings, X, Key, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GenerationResponse {
  data?: Array<{ b64_json: string }>;
  error?: string;
  details?: string;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [hfToken, setHfToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("hf_token");
    if (savedToken) {
      setHfToken(savedToken);
    }
  }, []);

  const saveToken = () => {
    localStorage.setItem("hf_token", hfToken);
    setIsTokenSaved(true);
    setTimeout(() => setIsTokenSaved(false), 2000);
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt,
          token: hfToken.trim() || undefined
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Server returned an unexpected response (HTML). This usually means the API route is not found or the server crashed.`);
      }

      const data: GenerationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.data && data.data[0]?.b64_json) {
        setGeneratedImage(`data:image/png;base64,${data.data[0].b64_json}`);
      } else {
        throw new Error("No image data received from the server");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Settings Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all shadow-xl"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 text-neutral-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Key className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">API Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Hugging Face Token
                  </label>
                  <input
                    type="password"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    placeholder="hf_..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Your token is stored locally in your browser and used for API requests.
                  </p>
                </div>

                <button
                  onClick={saveToken}
                  className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  {isTokenSaved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Token Saved!</span>
                    </>
                  ) : (
                    <span>Save Token</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Header */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Powered by Stable Diffusion XL</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              Imagine Anything.
            </h1>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
              Turn your words into stunning visuals with our AI-powered image generator.
            </p>
          </motion.div>
        </header>

        {/* Input Section */}
        <section className="mb-12">
          <motion.form
            onSubmit={handleGenerate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
            <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with neon lights and flying cars..."
                className="flex-1 bg-transparent px-4 py-3 outline-none text-neutral-200 placeholder:text-neutral-600"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:hover:bg-white transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </section>

        {/* Output Section */}
        <section className="min-h-[400px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 text-neutral-500"
              >
                <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-indigo-500 animate-spin" />
                <p className="animate-pulse">Crafting your masterpiece...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 max-w-md text-center"
              >
                <AlertCircle className="w-12 h-12" />
                <div>
                  <h3 className="font-bold text-lg mb-1">Generation Failed</h3>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm font-medium underline underline-offset-4 hover:text-red-300"
                >
                  Dismiss
                </button>
              </motion.div>
            ) : generatedImage ? (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-700" />
                <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
                  <img
                    src={generatedImage}
                    alt={prompt}
                    className="w-full max-w-2xl h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Download Image</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-neutral-600"
              >
                <div className="w-24 h-24 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10" />
                </div>
                <p className="text-center max-w-xs">
                  Your generated image will appear here. Try a descriptive prompt!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-neutral-900 text-center text-neutral-600 text-sm">
        <p>© 2026 Hugging Face Image Gen. Built with React & Express.</p>
      </footer>
    </div>
  );
}
