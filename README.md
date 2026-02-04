<p align="center">
  <img src="public/mascot.png" width="200" alt="ClawArmy Mascot">
</p>

# 🛡️ ClawArmy: Tactical AI Agent Command Center

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://clawarmy.vercel.app)
[![Ecosystem](https://img.shields.io/badge/Ecosystem-Antigravity-red?style=for-the-badge)](https://github.com/vudovn/antigravity)

**ClawArmy** is an elite "Mission Control" platform for designing, deploying, and synchronizing AI Agent Specialists (**Antigravity Skills**). It enables developers to synthesize custom agent squads and inject them directly into their local workspaces with zero-friction automation.

---

## 🛰️ Mission Intelligence

### 🧬 High-Intelligence Architect
Design your perfect agent using our Smart Composer. Mix traits, define core instructions, and assign strategic priorities (MVP, Quality, Business). The system can automatically synthesize multiple marketplace agents into a single "Hybrid Specialist" using our **Synthetic Merging Logic**.

### ⚡ True One-Click Deployment
Deploying a specialist to your project has never been faster:
- **Local Injection**: If running locally, agents are hot-plugged directly into your `/agents/` folder.
- **Magic Shell Command**: On the web, click "One-Click Install" to auto-copy a PowerShell mission link. Paste it in your terminal, and the agent deploys itself instantly.
- **Tactical Kits**: Export any agent as a ready-to-use `.BAT` or `.ZIP` package with pre-configured directory hierarchies.

### ⚔️ Global HQ & Auto-Merge
Contribute your best specialists to the **Global Army**. Our backend features an **Auto-Merge Protocol**: if an agent with the same designation is published, the Command Center synthesizes their instructions and capabilities to create a stronger, evolve unit.

---

## ⚓ Deployment Steps for Users

1.  **Access the Command Center**: Navigate to [clawarmy.vercel.app](https://clawarmy.vercel.app).
2.  **Design Your Specialist**: Use the **Architect** view to define your agent's persona.
3.  **Execute Deployment**:
    *   Click **⚡ ONE-CLICK INSTALL**.
    *   If on the web, a **Magic Command** is copied to your clipboard.
    *   Open your terminal in your project root and **Paste/Run** the command.
4.  **Engage**: Your agent is now live in `agents/` and registered as a slash-command workflow in `.agent/workflows/`.

---

## 🛠️ Technical Setup (Global HQ)

If you are hosting your own ClawArmy Command Center, follow these protocols:

### 1. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_api_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
COMMANDER_KEY=your_secret_admin_key
```

### 2. Database Schema (PostgreSQL)
Execute this SQL in your Supabase SQL Editor to initialize the Marketplace:

```sql
/** 
 * ClawArmy: Tactical Marketplace Table 
 * Description: Stores global mission data and handles auto-merging designations.
 */

CREATE TABLE marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,      -- The unique designation of the specialist
  persona TEXT NOT NULL,          -- Tactical profile
  instructions TEXT NOT NULL,     -- Operational protocols
  capabilities TEXT[] NOT NULL,   -- Skill sets
  priority TEXT DEFAULT 'quality',-- Mission grade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE marketplace ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access
CREATE POLICY "Allow public read-only access" 
ON marketplace FOR SELECT 
USING (true);

-- Allow authorized publishing/merging
CREATE POLICY "Allow anyone to publish" 
ON marketplace FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow updates for merging" 
ON marketplace FOR UPDATE 
USING (true);
```

---

## 🛸 Technology Stack
- **Framework**: Next.js 15 (Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Archiving**: JSZip (Tactical Kits)
- **Intelligence**: Word-based Fuzzy Match & Permutation Synthesis

---

**Built by Rikin Shah • Operational 2026**  
*ClawArmy is an independent specialist center for the Antigravity ecosystem.*
