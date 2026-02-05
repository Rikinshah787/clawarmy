"use client";

import { useState, useEffect } from "react";

interface Agent {
    id: string;
    name: string;
    slug: string;
    persona: string;
    instructions: string;
    capabilities: string[];
    priority: string;
    status: string;
    submitter_id: string;
    created_at: string;
}

export default function CommanderPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [key, setKey] = useState("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

    const authenticate = async () => {
        const res = await fetch("/api/commander/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key })
        });
        const data = await res.json();
        if (data.success) {
            setAuthenticated(true);
            localStorage.setItem("commander_key", key);
            fetchAgents();
        } else {
            setStatusMessage("❌ ACCESS_DENIED: Invalid Commander Key");
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const fetchAgents = async () => {
        setLoading(true);
        const storedKey = localStorage.getItem("commander_key") || key;
        const res = await fetch("/api/commander/queue", {
            headers: { "x-commander-key": storedKey }
        });
        const data = await res.json();
        if (data.agents) {
            setAgents(data.agents);
        }
        setLoading(false);
    };

    const updateStatus = async (agentId: string, newStatus: "approved" | "rejected") => {
        const storedKey = localStorage.getItem("commander_key") || key;
        const res = await fetch("/api/commander/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-commander-key": storedKey
            },
            body: JSON.stringify({ agentId, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            setStatusMessage(`✅ Agent ${newStatus.toUpperCase()}`);
            fetchAgents();
        } else {
            setStatusMessage(`❌ ${data.error}`);
        }
        setTimeout(() => setStatusMessage(null), 3000);
    };

    useEffect(() => {
        const storedKey = localStorage.getItem("commander_key");
        if (storedKey) {
            setKey(storedKey);
            setAuthenticated(true);
            fetchAgents();
        } else {
            setLoading(false);
        }
    }, []);

    const filteredAgents = filter === "all"
        ? agents
        : agents.filter(a => a.status === filter);

    if (!authenticated) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
                <div className="glass p-8 rounded-3xl max-w-md w-full flex flex-col gap-6">
                    <h1 className="text-2xl font-bold text-center tech-font tracking-tight">
                        🛡️ COMMANDER_ACCESS
                    </h1>
                    <p className="text-neutral-400 text-sm text-center">
                        Enter your Commander Key to access the approval queue.
                    </p>
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="COMMANDER_KEY"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono"
                    />
                    <button
                        onClick={authenticate}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        AUTHENTICATE
                    </button>
                    {statusMessage && (
                        <p className="text-red-400 text-sm text-center">{statusMessage}</p>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tech-font tracking-tight">
                            ⚔️ COMMANDER_HQ
                        </h1>
                        <p className="text-neutral-500 text-sm">Approve or reject soldier submissions.</p>
                    </div>
                    <div className="flex gap-2">
                        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === f
                                        ? "bg-red-500/20 border border-red-500/50 text-red-400"
                                        : "bg-white/5 border border-white/10 text-neutral-500 hover:bg-white/10"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </header>

                {statusMessage && (
                    <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        {statusMessage}
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-neutral-500 py-20">Loading queue...</div>
                ) : filteredAgents.length === 0 ? (
                    <div className="text-center text-neutral-500 py-20">
                        No agents in this queue.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAgents.map((agent) => (
                            <div
                                key={agent.id}
                                className="glass p-6 rounded-2xl flex flex-col gap-4 border border-white/10"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{agent.name}</h2>
                                        <p className="text-[10px] text-neutral-500 font-mono">/{agent.slug}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${agent.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                            agent.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                                                "bg-red-500/20 text-red-400"
                                        }`}>
                                        {agent.status}
                                    </span>
                                </div>

                                <p className="text-neutral-400 text-sm line-clamp-2">{agent.persona}</p>

                                <div className="flex flex-wrap gap-1">
                                    {agent.capabilities.slice(0, 4).map((cap, i) => (
                                        <span key={i} className="text-[9px] bg-white/5 px-2 py-1 rounded text-neutral-400">
                                            {cap}
                                        </span>
                                    ))}
                                </div>

                                <div className="text-[10px] text-neutral-600">
                                    Submitted: {new Date(agent.created_at).toLocaleDateString()}
                                </div>

                                {agent.status === "pending" && (
                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => updateStatus(agent.id, "approved")}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-sm transition-all"
                                        >
                                            ✅ APPROVE
                                        </button>
                                        <button
                                            onClick={() => updateStatus(agent.id, "rejected")}
                                            className="flex-1 bg-red-600/50 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-sm transition-all"
                                        >
                                            ❌ REJECT
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
