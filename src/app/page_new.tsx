"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import marketplaceData from "@/data/marketplace.json";

interface AgentConfig {
  name: string;
  persona: string;
  instructions: string;
  capabilities: string[];
}

export default function Home() {
  const [config, setConfig] = useState<AgentConfig>({
    name: "CodeNinja",
    persona: "A highly efficient, slightly sarcastic expert in TypeScript and System Architecture.",
    instructions: "Always suggest refactorings. Use emojis sparingly. Be direct and concise.",
    capabilities: ["Debugging", "Architecture Design", "Automated Testing"],
  });

  const [priority, setPriority] = useState<"mvp" | "quality" | "business">("quality");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const generateMarkdown = (overrideConfig?: AgentConfig, overridePriority?: string) => {
    const targetConfig = overrideConfig || config;
    const targetPriority = (overridePriority || priority) as "mvp" | "quality" | "business";

    const priorityInstructions = {
      mvp: "### MVP Priority\nFocus on speed and functionality. Prefer quick wins over architectural perfection. Suggest shortcuts where appropriate.",
      quality: "### Perfect Quality Priority\nFocus on architectural excellence, type safety, and testability. No shortcuts allowed. Prefer long-term maintainability.",
      business: "### Business Value Priority\nFocus on features that drive user engagement or revenue. Balance technical debt with delivery speed. Always ask 'Does this help the user?'",
    };

    return `---
name: ${targetConfig.name}
description: ${targetConfig.persona}
---
# Instructions
${targetConfig.instructions}

${priorityInstructions[targetPriority]}

# Capabilities
${targetConfig.capabilities.map((c) => `- ${c}`).join("\n")}

# Metadata
- Created via AgentVibe Platform
- Type: Antigravity Skill
- Priority Profile: ${targetPriority.toUpperCase()}
`;
  };

  const handleExport = async () => {
    const content = generateMarkdown();
    const zip = new JSZip();

    // Add SKILL.md
    zip.file("SKILL.md", content);

    // Add install.bat for Windows
    const installBat = `@echo off
echo ==========================================
echo AgentVibe: One-Click Installer
echo ==========================================
set AGENT_NAME=${config.name.replace(/\s+/g, "-")}
set TARGET_DIR=.gemini/skills/%AGENT_NAME%

echo Installing %AGENT_NAME% to %TARGET_DIR%...

if not exist ".gemini" mkdir .gemini
if not exist ".gemini/skills" mkdir .gemini/skills
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

copy /y SKILL.md "%TARGET_DIR%\\SKILL.md"

echo.
echo [SUCCESS] Agent %AGENT_NAME% installed!
echo You can now use it in Antigravity.
echo.
pause`;

    zip.file("install.bat", installBat);

    // Generate ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `-kit.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [personaInput, setPersonaInput] = useState("");
  const [suggestedAgents, setSuggestedAgents] = useState<string[]>([]);

  const analyzePersona = (input: string) => {
    if (!input.trim()) {
      setSuggestedAgents([]);
      return;
    }

    const keywords = input.toLowerCase();
    const matches = marketplaceData.filter(agent => {
      const agentText = `  `.toLowerCase();
      return agent.tags.some(tag => keywords.includes(tag)) ||
        keywords.includes(agent.category) ||
        agent.name.toLowerCase().split(' ').some(word => keywords.includes(word));
    });

    setSuggestedAgents(matches.slice(0, 3).map(a => a.id));
  };

  const composeFromMarketplace = () => {
    if (suggestedAgents.length === 0) return;

    const selectedMarketplaceAgents = marketplaceData.filter(a => suggestedAgents.includes(a.id));

    // Mix and match from suggested agents
    const mixedPersona = selectedMarketplaceAgents.map(a => a.persona).join(' ');
    const mixedInstructions = selectedMarketplaceAgents.map(a => a.instructions).join(' ');
    const mixedCapabilities = [...new Set(selectedMarketplaceAgents.flatMap(a => a.capabilities))];

    setConfig({
      name: personaInput.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') || "CustomAgent",
      persona: mixedPersona.slice(0, 200) + '...',
      instructions: mixedInstructions,
      capabilities: mixedCapabilities.slice(0, 5)
    });
  };

  const [installStatus, setInstallStatus] = useState<{ type: "success" | "error" | "loading"; msg: string } | null>(null);
  const [view, setView] = useState<"architect" | "marketplace">("architect");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const AGENTS_PER_PAGE = 9;

  const handleDirectInstall = async (overrideConfig?: AgentConfig, overridePriority?: string) => {
    const targetConfig = overrideConfig || config;
    const targetPriority = overridePriority || priority;

    setInstallStatus({ type: "loading", msg: `Installing ${targetConfig.name}...` });
    try {
      const response = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetConfig.name,
          content: generateMarkdown(targetConfig, targetPriority),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setInstallStatus({ type: "success", msg: data.message });
        setTimeout(() => setInstallStatus(null), 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setInstallStatus({ type: "error", msg: error.message || "Failed to install" });
    }
  };

  const handleBulkImport = async () => {
    if (selectedAgents.length === 0) return;

    setInstallStatus({ type: "loading", msg: `Installing ${selectedAgents.length} agents...` });

    try {
      const agents = marketplaceData.filter(a => selectedAgents.includes(a.id));
      let successCount = 0;

      for (const agent of agents) {
        const response = await fetch("/api/install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: agent.name,
            content: generateMarkdown(agent as any, agent.priority),
          }),
        });

        const data = await response.json();
        if (data.success) successCount++;
      }

      setInstallStatus({
        type: "success",
        msg: `? Successfully installed ${successCount}/${selectedAgents.length} agents!`
      });
      setSelectedAgents([]);
      setTimeout(() => setInstallStatus(null), 5000);
    } catch (error: any) {
      setInstallStatus({ type: "error", msg: error.message || "Failed to install agents" });
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen p-8 md:p-16 flex flex-col gap-12 max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-6xl">??</span>
            Agent<span className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">Vibe</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Your AI agent army. Deploy specialists in one click.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView("architect")}
              className={`px-6 py-2 rounded-xl border text-sm font-semibold transition-all ${view === 'architect' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-neutral-500'}`}
            >
              Architect
            </button>
            <button 
              onClick={() => setView("marketplace")}
              className={`px-6 py-2 rounded-xl border text-sm font-semibold transition-all ${view === 'marketplace' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-neutral-500'}`}
            >
              Marketplace
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Describe your ideal agent (e.g., 'fast ninja coder')..."
              value={personaInput}
              onChange={(e) => { setPersonaInput(e.target.value); analyzePersona(e.target.value); }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
            {suggestedAgents.length > 0 && (
              <button
                onClick={composeFromMarketplace}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 justify-center"
              >
                <span>??</span>
                Compose from {suggestedAgents.length} agents
              </button>
            )}
          </div>
        </div>
      </header>