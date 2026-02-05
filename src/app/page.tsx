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
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [visitorId, setVisitorId] = useState<string>("");

  useEffect(() => {
    setMounted(true);

    // Generate or retrieve unique visitor ID
    let uid = localStorage.getItem('agentarmy_uid');
    if (!uid) {
      uid = 'av_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('agentarmy_uid', uid);
    }
    setVisitorId(uid);

    // Increment visit count (stored locally for demo, would use API in production)
    const visits = JSON.parse(localStorage.getItem('agentarmy_visits') || '{}');
    const uniqueVisitors = Object.keys(visits).length;
    if (!visits[uid]) {
      visits[uid] = { firstVisit: Date.now(), lastVisit: Date.now(), count: 1 };
    } else {
      visits[uid].lastVisit = Date.now();
      visits[uid].count++;
    }
    localStorage.setItem('agentarmy_visits', JSON.stringify(visits));
    setVisitorCount(Object.keys(visits).length);
  }, []);

  const generateMarkdown = (overrideConfig?: AgentConfig, overridePriority?: string) => {
    const targetConfig = overrideConfig || config;
    const targetPriority = (overridePriority || priority) as "mvp" | "quality" | "business";

    const priorityInstructions = {
      mvp: `### 🚀 MVP Priority Mode
- Focus on speed and functionality over perfection
- Prefer quick wins and working solutions
- Suggest shortcuts where appropriate
- Ship fast, iterate later`,
      quality: `### 🎯 Perfect Quality Priority Mode
- Focus on architectural excellence and type safety
- No shortcuts allowed - do it right the first time
- Ensure testability and maintainability
- Consider edge cases and error handling`,
      business: `### 💰 Business Value Priority Mode
- Focus on features that drive user engagement or revenue
- Balance technical debt with delivery speed
- Always ask "Does this help the user?"
- Prioritize measurable impact`,
    };

    const agentSlug = targetConfig.name.replace(/\s+/g, "-").toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];

    return `---
name: ${targetConfig.name}
description: ${targetConfig.persona}
version: 1.2.0
author: ClawArmy Tactical
---

# 🛰️ AGENT_DESIGNATION: ${targetConfig.name}

> **TACTICAL_PERSONA:** ${targetConfig.persona}

## ⚓ STRATEGIC_OBJECTIVES

${targetConfig.instructions}

${priorityInstructions[targetPriority]}

## ⚡ CAPABILITIES_MATRIX

${targetConfig.capabilities.map((c) => `- [x] **${c.toUpperCase()}** - Specialized execution module.`).join("\n")}

## 🛠️ OPERATIONAL_PROTOCOLS

### 1. INITIALIZATION_PHASE
Upon activation, perform a deep-scan of the current codebase and project metadata. Identify architectural patterns and potential mission blockers immediately.

### 2. EXECUTION_STANDARDS
- **PRECISION:** All output must be technically accurate and context-aware.
- **SECURITY:** Prioritize memory-safe patterns and secure data handling.
- **EFFICIENCY:** Optimize for performance and long-term maintainability.
- **RATIONALE:** Every suggestion must be backed by technical justification.

### 3. COMMUNICATION_ENCRYPTION
- Use clear, professional, and tactical language.
- Format code blocks with appropriate syntax highlighting.
- Use ⚠️ for critical security or performance warnings.
- Use ✅ for verified solutions and successful refactors.

## 📡 SQUAD_INTEGRATION

\`\`\`
User: Execute mission protocol for ${targetConfig.capabilities[0]?.toLowerCase() || "intelligence"}
Agent: "Satellite link established. Initiating ${targetConfig.name} analysis module..."
\`\`\`

## 🛰️ ACTIVATION_VECTORS

Mention **@${agentSlug}** or use the **/${agentSlug}** workflow to summon this specialist.

---

*Verified by [ClawArmy](https://clawarmy.vercel.app) • Tactical Grade: ${targetPriority.toUpperCase()}*
`;
  };

  const handleExport = async (overrideConfig?: AgentConfig, overridePriority?: string) => {
    const targetConfig = overrideConfig || config;
    const targetPriority = overridePriority || priority;
    const content = generateMarkdown(targetConfig, targetPriority);
    const slug = targetConfig.name.replace(/\s+/g, "-").toLowerCase();
    const zip = new JSZip();

    // 1. Mission Briefing
    const briefing = `--- CLAW_ARMY MISSION BRIEFING ---
AGENT: ${targetConfig.name}
PRIORITY: ${targetPriority.toUpperCase()}
SLOT: /${slug}

DEPLOYMENT INSTRUCTIONS:
1. Extract the contents of this ZIP into your project root.
2. The agent will be placed in /agents/${slug}/
3. The workflow will be placed in /.agent/workflows/${slug}.md
4. You can now use the /${slug} command in your Antigravity-enabled IDE.
`;
    zip.file("MISSION_BRIEFING.txt", briefing);

    // 2. Add SKILL.md in the correct hierarchy
    zip.file(`agents/${slug}/SKILL.md`, content);

    // 3. Add Workflow file in the correct hierarchy
    const workflowContent = `---
description: Activates the ${targetConfig.name} specialist
---
1. Read the instructions in \`agents/${slug}/SKILL.md\`.
2. Adopt the persona and wait for user input.
`;
    zip.file(`.agent/workflows/${slug}.md`, workflowContent);

    // 4. Mission Deployment Validator (Optional BAT)
    const validatorBat = `@echo off
echo [CHECK] Validating ClawArmy Mission Deployment...
if exist "agents\\${slug}\\SKILL.md" (
  echo [PASS] Agent Skill Detected.
) else (
  echo [FAIL] Agent Skill Missing. Ensure you unzipped to root.
)
if exist ".agent\\workflows\\${slug}.md" (
  echo [PASS] Mission Workflow Detected.
) else (
  echo [FAIL] Mission Workflow Missing.
)
pause`;
    zip.file("validate-deployment.bat", validatorBat);

    // Generate ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-tactical-kit.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Simple parsing for SKILL.md metadata
      const nameMatch = content.match(/^name:\s*(.*)$/m);
      const personaMatch = content.match(/^description:\s*(.*)$/m);
      const instructionsMatch = content.match(/##\s+(?:Instructions|STRATEGIC_OBJECTIVES)\s*([\s\S]*?)(?=##|$)/i);

      if (nameMatch || personaMatch) {
        setConfig({
          name: nameMatch?.[1]?.trim() || "Imported Specialist",
          persona: personaMatch?.[1]?.trim() || "A specialist imported from a mission file.",
          instructions: instructionsMatch?.[1]?.trim() || "Mission parameters extracted from file.",
          capabilities: ["Imported_Unit"]
        });
        setInstallStatus({ type: "success", msg: "📡 INTEL_DECRYPTED: Agent parameters successfully imported." });
        setTimeout(() => setInstallStatus(null), 4000);
      } else {
        setInstallStatus({ type: "error", msg: "❌ DATA_CORRUPTION: Not a recognized ClawArmy mission file." });
        setTimeout(() => setInstallStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const publishToMarketplace = async () => {
    // Validate required fields first
    if (!config.name?.trim() || !config.persona?.trim() || !config.instructions?.trim()) {
      setInstallStatus({ type: "error", msg: "❌ MISSION_INCOMPLETE: Name, Persona, and Instructions are required." });
      setTimeout(() => setInstallStatus(null), 4000);
      return;
    }

    setInstallStatus({ type: "loading", msg: "📡 Transmitting intel to Global HQ..." });

    // Get visitor ID for submission tracking
    const submitterId = localStorage.getItem('agentarmy_uid') || 'anonymous';

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch("/api/agents/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          priority,
          submitter_id: submitterId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Server rejected the request`);
      }

      const data = await response.json();

      if (data.success) {
        setInstallStatus({
          type: "success",
          msg: data.simulated
            ? `⚠️ ${data.message}`
            : data.merged
              ? `🧬 ${data.message}`
              : `📡 ${data.message}`
        });
      } else {
        throw new Error(data.error || "Unknown server error");
      }
    } catch (error: any) {
      // Handle specific error types
      let errorMsg = "Link unstable.";

      if (error.name === 'AbortError') {
        errorMsg = "Request timed out. Check your connection.";
      } else if (error.message?.includes('fetch')) {
        errorMsg = "Network error. Are you online?";
      } else if (error.message) {
        errorMsg = error.message;
      }

      setInstallStatus({ type: "error", msg: `❌ TRANSMISSION_FAILURE: ${errorMsg}` });
    }
    setTimeout(() => setInstallStatus(null), 6000);
  };

  const [personaInput, setPersonaInput] = useState("");
  const [suggestedAgents, setSuggestedAgents] = useState<string[]>([]);

  const analyzePersona = (input: string) => {
    if (!input.trim()) {
      setSuggestedAgents([]);
      return;
    }

    const words = input.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const matches = marketplaceData.filter(agent => {
      const agentText = `${agent.name} ${agent.persona} ${agent.category} ${agent.tags.join(' ')}`.toLowerCase();
      // Match if any significant word from input exists in agent data
      return words.some(word => agentText.includes(word));
    });

    setSuggestedAgents(matches.slice(0, 3).map(a => a.id));
  };

  const composeFromMarketplace = () => {
    if (!personaInput.trim()) return;

    const selectedMarketplaceAgents = marketplaceData.filter(a => suggestedAgents.includes(a.id));

    if (selectedMarketplaceAgents.length > 0) {
      // 🧬 PERMUTATION & COMBINATION SYNTHESIS
      // We merge the essence of ALL matched agents into one master blueprint
      const syntheticName = selectedMarketplaceAgents.length > 1
        ? selectedMarketplaceAgents.map(a => a.name.split(' ')[0]).join('')
        : personaInput.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

      const combinedPersona = `ULTRA_SYNTHETIC_PERSONA: A hybrid of ${selectedMarketplaceAgents.map(a => a.name).join(' + ')}. ${selectedMarketplaceAgents.map(a => a.persona).join(' ')}`;

      // COMBINATION: Interleave instructions for cross-functional mastery
      const combinedInstructions = `[SYNTHESIZED_OPERATIONAL_PROTOCOLS]\n` +
        selectedMarketplaceAgents.map(a => `### ${a.name}_MODULE:\n${a.instructions}`).join('\n\n');

      // PERMUTATION: Unique set of all matched capabilities
      const combinedCapabilities = [...new Set(selectedMarketplaceAgents.flatMap(a => a.capabilities))].slice(0, 10);

      setConfig({
        name: syntheticName.slice(0, 20),
        persona: combinedPersona.slice(0, 500),
        instructions: combinedInstructions,
        capabilities: combinedCapabilities
      });
      setInstallStatus({ type: "success", msg: `🧬 SYNTHESIS_COMPLETE: Created ${syntheticName} using ${selectedMarketplaceAgents.length}-way combination logic.` });
    } else {
      // Custom Blueprint fallback...
      const customName = personaInput.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') || "CustomAgent";
      setConfig({
        ...config,
        name: customName,
        persona: `CUSTOM_STRIKE_FORCE: ${personaInput}`,
        instructions: `MISSION_OBJECTIVE: Act as a specialist focused on ${personaInput}. Ensure high-precision output and tactical efficiency.`
      });
      setInstallStatus({ type: "success", msg: "🛠️ CUSTOM_BLUEPRINT_CREATED: Initialized agent based on your raw input." });
    }

    setView("architect");
    setPersonaInput("");
    setSuggestedAgents([]);
    setTimeout(() => setInstallStatus(null), 5000);
  };

  const [isLocal, setIsLocal] = useState(false);
  useEffect(() => {
    setIsLocal(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }, []);

  const downloadMissionBat = (targetConfig: AgentConfig, targetPriority: string) => {
    const mdContent = generateMarkdown(targetConfig, targetPriority);
    const slug = targetConfig.name.replace(/\s+/g, "-").toLowerCase();

    const workflowContent = `---
description: Activates the ${targetConfig.name} specialist
---
1. Read the instructions in \`agents/${slug}/SKILL.md\`.
2. Adopt the persona and wait for user input.`;

    // Create a self-extracting PowerShell one-liner in a BAT file
    const batContent = `@echo off
TITLE ClawArmy Deployment: ${targetConfig.name}
echo ==========================================
echo ClawArmy: Tactical Mission Deployment
echo ==========================================
echo [AGENT]: ${targetConfig.name}
echo.

powershell -Command "$skill = @'\n${mdContent.replace(/'/g, "''")}\n'@; $flow = @'\n${workflowContent.replace(/'/g, "''")}\n'@; if (!(Test-Path 'agents/${slug}')) { New-Item -ItemType Directory -Path 'agents/${slug}' -Force }; if (!(Test-Path '.agent/workflows')) { New-Item -ItemType Directory -Path '.agent/workflows' -Force }; Set-Content -Path 'agents/${slug}/SKILL.md' -Value $skill -Encoding UTF8; Set-Content -Path '.agent/workflows/${slug}.md' -Value $flow -Encoding UTF8"

echo.
echo [SUCCESS] Mission deployed! Use /${slug} to begin.
echo.
pause`;

    const blob = new Blob([batContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deploy-${slug}.bat`;
    link.click();
    URL.revokeObjectURL(url);

    setInstallStatus({ type: "success", msg: "🛰️ Mission BAT Downloaded! Run it in your project root to deploy the agent." });
    setTimeout(() => setInstallStatus(null), 8000);
  };

  const [installStatus, setInstallStatus] = useState<{ type: "success" | "error" | "loading"; msg: string } | null>(null);
  const [view, setView] = useState<"architect" | "marketplace">("architect");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const AGENTS_PER_PAGE = 9;

  const handleMissionDeploy = async (overrideConfig?: AgentConfig, overridePriority?: string) => {
    const targetConfig = overrideConfig || config;
    const targetPriority = overridePriority || priority;
    const slug = targetConfig.name.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!isLocal) {
      // Generate INLINE PowerShell script that creates the agent directly
      // This way custom agents work without being in the database
      const markdown = generateMarkdown(targetConfig, targetPriority);
      const escapedMarkdown = markdown
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '`"')
        .replace(/\$/g, '`$')
        .replace(/\r\n/g, '\n');

      const inlineScript = `
# ClawArmy Tactical Deployment: ${targetConfig.name}
$agentDir = "agents/${slug}"
$workflowDir = ".agent/workflows"

Write-Host "Initializing ClawArmy Deployment: ${targetConfig.name}..." -ForegroundColor Cyan

if (!(Test-Path $agentDir)) { New-Item -ItemType Directory -Force -Path $agentDir | Out-Null }
if (!(Test-Path $workflowDir)) { New-Item -ItemType Directory -Force -Path $workflowDir | Out-Null }

$skillContent = @"
${escapedMarkdown}
"@

$workflowContent = @"
---
description: Activates the ${targetConfig.name} specialist
---
1. Read the instructions in \`agents/${slug}/SKILL.md\`.
2. Adopt the persona and wait for user input.
"@

$skillContent | Out-File -FilePath "$agentDir/SKILL.md" -Encoding utf8
$workflowContent | Out-File -FilePath "$workflowDir/${slug}.md" -Encoding utf8

Write-Host "[SUCCESS] ${targetConfig.name} is now operational!" -ForegroundColor Green
Write-Host "Use /${slug} in Antigravity to activate." -ForegroundColor Yellow
`;

      // Encode as base64 for clean transfer
      const encoded = btoa(unescape(encodeURIComponent(inlineScript)));
      const cmd = `powershell -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encoded}')) | iex"`;

      navigator.clipboard.writeText(cmd);
      setInstallStatus({ type: "success", msg: "⚡ MAGIC_COMMAND_COPIED: Paste in your project root to auto-deploy mission." });
      setTimeout(() => setInstallStatus(null), 6000);
      return;
    }

    setInstallStatus({ type: "loading", msg: `Executing mission install for ${targetConfig.name}...` });
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
        setInstallStatus({ type: "success", msg: `✅ MISSION_DEPLOYED: Specialist ${targetConfig.name} is now operational in your /agents/ folder.` });
        setTimeout(() => setInstallStatus(null), 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setInstallStatus({ type: "error", msg: "❌ DIRECT_COMM_FAILURE: Attempting secondary Tactical Kit export..." });
      setTimeout(() => handleExport(targetConfig, targetPriority), 2000);
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
        msg: `✅ Successfully installed ${successCount}/${selectedAgents.length} agents!`
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
    <main className="min-h-screen p-8 md:p-16 flex flex-col gap-12 max-w-7xl mx-auto tactical-grid scanlines relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-20 tactical-grid"></div>
      <div className="radar-sweep"></div>
      <div className="data-stream"></div>

      {/* Dynamic Tactical Background Elements */}
      <div className="floating-tactical-data top-10 left-10">LAT: 34.0522 N</div>
      <div className="floating-tactical-data top-20 left-10">LONG: 118.2437 W</div>
      <div className="floating-tactical-data bottom-10 right-10">MISSION_STATUS: ACTIVE</div>
      <div className="floating-tactical-data bottom-20 right-10">ENCRYPTION: AES-256</div>

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between relative p-4 glass rounded-2xl targeting-reticle targeting-reticle-tl targeting-reticle-tr targeting-reticle-bl targeting-reticle-br">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <img
              src="/mascot.png"
              alt="ClawArmy"
              className="w-28 h-28 -rotate-3 hover:rotate-0 transition-all duration-700 drop-shadow-[0_0_15px_rgba(255,0,0,0.2)] filter brightness-110"
            />
            <span className="tech-font">Claw</span><span className="tech-font bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Army</span>
          </h1>
          <p className="text-neutral-500 text-[10px] tech-font tracking-[0.3em] opacity-80 uppercase">
            // Mission Status: Ready_to_Deploy
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
              className={`px-6 py-2 rounded-xl border text-sm font-semibold transition-all ${view === 'marketplace' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10'}`}
            >
              Marketplace
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type: 'security', 'ninja', 'fast coder'..."
                value={personaInput}
                onChange={(e) => { setPersonaInput(e.target.value); analyzePersona(e.target.value); }}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <button
                onClick={composeFromMarketplace}
                disabled={!personaInput.trim()}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 flex items-center gap-2 tech-font uppercase tracking-widest relative overflow-hidden group ${personaInput.trim()
                  ? 'text-white'
                  : 'bg-white/5 border border-white/10 text-neutral-500 cursor-not-allowed'
                  }`}
              >
                {personaInput.trim() && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${suggestedAgents.length > 0 ? "from-red-600 via-pink-600 to-red-600" : "from-blue-600 via-cyan-600 to-blue-600"} bg-[length:200%_100%] animate-flow-gradient z-0 opacity-100 transition-opacity`}></div>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>{suggestedAgents.length > 0 ? "✨" : "🛠️"}</span>
                  {!personaInput.trim() ? "Awaiting_Intel" : suggestedAgents.length > 0 ? `COMPOSE_INTELLIGENCE (${suggestedAgents.length})` : "GENERATE_CUSTOM_BLUEPRINT"}
                </span>
                {personaInput.trim() && <div className="absolute inset-0 border border-white/20 rounded-xl z-20"></div>}
              </button>
            </div>
            {personaInput && (
              <p className={`text-[10px] tech-font tracking-widest animate-pulse ${suggestedAgents.length > 0 ? "text-red-400" : "text-blue-400"}`}>
                {suggestedAgents.length > 0
                  ? `>> INTEL_SYNC: Found ${suggestedAgents.length} marketplace matches to enhance your squad.`
                  : ">> CUSTOM_INTEL: No direct matches. Generating unique specialist from mission data."}
              </p>
            )}
          </div>
        </div>
      </header>

      {view === "architect" ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          {/* Editor Side */}
          <div className="glass p-8 rounded-3xl flex flex-col gap-6 glow targeting-reticle targeting-reticle-tl targeting-reticle-tr opacity-95 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 tech-font tracking-tighter">
                <span className="w-2 h-2 rounded-full bg-red-500 led-active animate-pulse"></span>
                COMMAND CENTER
              </h2>
              <label className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[10px] tech-font text-neutral-400 hover:text-white transition-all flex items-center gap-2">
                <span>📂</span> IMPORT_INTEL
                <input type="file" className="hidden" accept=".md,.txt" onChange={handleImportFile} />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-neutral-500 tech-font uppercase tracking-widest">Agent_Designation</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-red-500/30 text-white tech-font"
                placeholder="SIGNAL-01"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-400">Core Persona</label>
              <textarea
                rows={3}
                value={config.persona}
                onChange={(e) => setConfig({ ...config, persona: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                placeholder="Describe how the agent behaves..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-400">Instructions</label>
              <textarea
                rows={5}
                value={config.instructions}
                onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                placeholder="Specific guidelines for the agent..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-400">Strategic Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "mvp", label: "MVP", color: "from-orange-500/20 to-orange-500/10 border-orange-500/30 text-orange-400" },
                  { id: "quality", label: "Quality", color: "from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-400" },
                  { id: "business", label: "Business", color: "from-emerald-500/20 to-emerald-500/10 border-emerald-500/30 text-emerald-400" }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id as any)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${priority === p.id
                      ? `bg-gradient-to-tr ${p.color} ring-2 ring-white/10`
                      : "bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10"
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleMissionDeploy()}
              className="mt-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-5 rounded-2xl shadow-xl ring-1 ring-white/20 active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1 glow tech-font relative group overflow-hidden glitch-hover"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-lg tracking-tighter uppercase flex items-center gap-2">
                <span className="led-active bg-white w-1.5 h-1.5 rounded-full animate-pulse"></span>
                ONE-CLICK INSTALL
              </span>
              <span className="text-[9px] opacity-80 font-normal uppercase tracking-[0.2em] text-red-100">
                {isLocal ? "Target: /agents/ (Internal_Injection)" : "Auto-Copy Magic PowerShell Link"}
              </span>
            </button>

            {!isLocal && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="text-[10px] tech-font text-blue-400 font-bold tracking-widest uppercase opacity-70">Secondary_Export_Modules</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => downloadMissionBat(config, priority)}
                    className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold py-3 rounded-xl active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1 tech-font"
                  >
                    <span className="text-[10px] tracking-tighter uppercase">DOWNLOAD_BAT</span>
                  </button>
                  <button
                    onClick={() => handleExport()}
                    className="bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold py-3 rounded-xl active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1 tech-font"
                  >
                    <span className="text-[10px] tracking-tighter uppercase">EXPORT_ZIP</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={publishToMarketplace}
              className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1 glow tech-font mt-2 border-dashed"
            >
              <span className="tracking-tighter uppercase flex items-center gap-2">
                <span>📡</span> SUBMIT_TO_GLOBAL_ARMY
              </span>
              <span className="text-[9px] opacity-60 font-normal uppercase tracking-[0.2em]">Your agent will be reviewed by the Commander</span>
            </button>

            {installStatus && (
              <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${installStatus.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                installStatus.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  "bg-blue-500/10 border-blue-500/20 text-blue-400"
                }`}>
                {installStatus.msg}
              </div>
            )}
          </div>

          {/* Preview Side */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-4 tech-font">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase opacity-80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 led-active"></span>
                SKILL.md_PREVIEW
              </h2>
              <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black rounded border border-red-500/20 uppercase tracking-[0.3em] led-active">
                Real-Time
              </span>
            </div>

            <div className="glass p-8 rounded-3xl h-[600px] overflow-auto glow font-mono text-sm leading-relaxed text-neutral-300 relative targeting-reticle targeting-reticle-tr targeting-reticle-bl bg-neutral-900/50">
              <div className="absolute top-0 right-0 p-2 opacity-10 tech-font pointer-events-none text-[10px]">INTEL_STREAM_v3.1</div>
              <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                {generateMarkdown()}
              </pre>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-white tech-font tracking-tighter">MISSION_BOARD</h2>
                {selectedAgents.length > 0 && (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-md text-[10px] font-bold tech-font uppercase tracking-widest led-active">
                    {selectedAgents.length} SQUAD_MEMBERS_SELECTED
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Search agents by name, description, or tags..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {["all", "security", "design", "performance", "backend", "testing", "devops", "database", "mobile", "seo", "reliability", "refactoring", "documentation"].map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${selectedCategory === cat
                    ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
                    : 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10'
                    }`}
                >
                  {cat === "all" ? "All Agents" : cat}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            // Filter logic
            const filtered = marketplaceData.filter(a => {
              const matchesSearch =
                a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.persona.toLowerCase().includes(search.toLowerCase()) ||
                a.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
              const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;
              return matchesSearch && matchesCategory;
            });

            // Pagination logic
            const totalPages = Math.ceil(filtered.length / AGENTS_PER_PAGE);
            const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
            const paginatedAgents = filtered.slice(startIndex, startIndex + AGENTS_PER_PAGE);

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedAgents.length > 0 ? paginatedAgents.map(agent => (
                    <div
                      key={agent.id}
                      onClick={() => toggleAgentSelection(agent.id)}
                      className={`glass p-6 rounded-3xl flex flex-col gap-4 transition-all group relative overflow-hidden h-full cursor-pointer targeting-reticle targeting-reticle-tl targeting-reticle-br ${selectedAgents.includes(agent.id)
                        ? 'border-2 border-red-500/50 bg-red-500/5 glow'
                        : 'hover:border-red-500/30 hover:bg-white/5'
                        }`}
                    >
                      {/* Checkbox */}
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => toggleAgentSelection(agent.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-red-500 checked:border-red-500 cursor-pointer transition-all"
                        />
                      </div>

                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-6xl text-red-400">🤖</span>
                      </div>

                      <div className="flex justify-between items-start gap-2 mt-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1 flex items-center gap-1 tech-font">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 led-active animate-pulse"></span>
                            Active_Mission
                          </span>
                          <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors uppercase tracking-tight tech-font">{agent.name}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase whitespace-nowrap border ${agent.priority === 'mvp' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          agent.priority === 'quality' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                          {agent.priority === 'quality' ? 'Elite' : agent.priority === 'business' ? 'Special Ops' : 'Recon'}
                        </span>
                      </div>

                      <p className="text-neutral-400 text-sm flex-grow line-clamp-3 leading-relaxed font-serif italic">"{agent.persona}"</p>

                      <div className="flex flex-wrap gap-1.5">
                        {agent.capabilities.map(c => (
                          <span key={c} className="text-[9px] text-neutral-500 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase font-black tracking-widest">
                            {c}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-2">
                        {isLocal ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMissionDeploy(agent as any, agent.priority); }}
                            className="flex-1 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg tech-font text-[10px] uppercase tracking-tighter"
                          >
                            ⚡ ONE-CLICK_INSTALL
                          </button>
                        ) : (
                          <div className="flex flex-1 gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMissionDeploy(agent as any, agent.priority); }}
                              className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-95 tech-font text-[9px] uppercase tracking-tighter"
                              title="Download Mission BAT"
                            >
                              BAT_INSTALLER
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport(agent as any, agent.priority);
                              }}
                              className="flex-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white font-bold py-3 rounded-xl transition-all active:scale-95 tech-font text-[9px] uppercase tracking-tighter"
                              title="Download Tactical ZIP"
                            >
                              ZIP_EXPORT
                            </button>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Generate a universal PowerShell one-liner that fetches the agent script from this server
                            const cmd = `powershell -Command "iwr -useb https://${window.location.host}/api/install?get=${agent.id} | iex"`;
                            navigator.clipboard.writeText(cmd);
                            setInstallStatus({ type: "success", msg: "Magic Mission Link Copied! Send this to your friend." });
                            setTimeout(() => setInstallStatus(null), 4000);
                          }}
                          className="px-4 bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 rounded-xl transition-all active:scale-95 flex items-center justify-center group"
                          title="Copy Magic Install Link for Friends"
                        >
                          <span className="opacity-50 group-hover:opacity-100">🔗</span>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-500">
                      <span className="text-6xl mb-4">🔍</span>
                      <p className="text-lg">No agents found matching your criteria</p>
                      <p className="text-sm">Try adjusting your search or category filter</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                    >
                      Previous
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl font-semibold transition-all ${currentPage === page
                            ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Results Count */}
                <div className="text-center text-neutral-500 text-sm">
                  Showing {paginatedAgents.length} of {filtered.length} agents
                  {selectedCategory !== "all" && ` in ${selectedCategory}`}
                </div>
              </>
            );
          })()}

          {/* Bulk Import Button */}
          {selectedAgents.length > 0 && (
            <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
              <button
                onClick={handleBulkImport}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl ring-2 ring-white/20 active:scale-95 transition-all flex items-center gap-3"
              >
                <span className="text-2xl">🚀</span>
                <div className="flex flex-col items-start">
                  <span>Import {selectedAgents.length} Agents</span>
                  <span className="text-xs opacity-80">Install all selected to workspace</span>
                </div>
              </button>
            </div>
          )}

          {installStatus && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400 shadow-2xl glass min-w-[300px] text-center backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 ring-1 ring-white/10 tech-font text-xs tracking-wider">
              {installStatus.msg}
            </div>
          )}
        </section>
      )}  <footer className="mt-auto py-12 border-t border-white/5 flex flex-col items-center gap-8 relative p-8 glass rounded-3xl targeting-reticle targeting-reticle-bl targeting-reticle-br">
        <div className="flex items-center gap-3">
          <img src="/mascot.png" alt="ClawArmy" className="w-12 h-12 grayscale hover:grayscale-0 transition-all drop-shadow-lg" />
          <p className="text-neutral-500 text-xs tech-font tracking-widest">
            // Built for the Antigravity_Ecosystem &bull; v2.0
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://www.linkedin.com/in/rikinshah787/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 rounded-xl text-neutral-400 hover:text-blue-400 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            <span className="text-xs font-semibold">LinkedIn</span>
          </a>
          <a
            href="https://github.com/Rikinshah787/ClawArmy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-neutral-500/20 border border-white/10 hover:border-neutral-500/30 rounded-xl text-neutral-400 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            <span className="text-xs font-semibold">GitHub</span>
          </a>
          {visitorCount > 0 && (
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-[10px] font-bold flex items-center gap-2 tech-font">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full led-active animate-pulse"></span>
              {visitorCount} UNIQUE_OPERATORS_DETECTED
            </span>
          )}
        </div>
        {visitorId && (
          <p className="text-neutral-600 text-[10px] font-mono">
            Your ID: {visitorId}
          </p>
        )}
      </footer>
    </main>
  );
}