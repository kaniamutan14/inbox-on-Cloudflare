// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Loader } from "@cloudflare/kumo";
import { PlugsIcon, RobotIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useUIStore } from "~/hooks/useUIStore";
import MCPPanel from "./MCPPanel";

function LazyAgentPanel() {
	const [AgentChat, setAgentChat] = useState<React.ComponentType | null>(
		null,
	);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		import("~/components/AgentPanel").then((mod) => {
			setAgentChat(() => mod.default);
		}).catch((err) => {
			console.error("Failed to load AgentPanel:", err);
			setLoadError("Failed to load agent panel");
		});
	}, []);

	if (loadError) {
		return (
			<div className="flex items-center justify-center h-full">
				<span className="text-xs text-kumo-error">{loadError}</span>
			</div>
		);
	}
	if (!AgentChat) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2">
				<Loader size="base" />
				<span className="text-xs text-kumo-subtle">Loading agent...</span>
			</div>
		);
	}
	return <AgentChat />;
}

export default function AgentSidebar() {
	const { closeAgentPanel } = useUIStore();
	const [activeTab, setActiveTab] = useState<"agent" | "mcp">("agent");

	return (
		<div className="flex flex-col h-full bg-kumo-surface animate-slide-right">
			{/* Tab bar */}
			<div className="flex items-center px-2 py-1 bg-kumo-base/40 border-b border-kumo-line/60 shrink-0 shadow-2xs">
				<button
					type="button"
					onClick={() => setActiveTab("agent")}
					className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 bg-transparent cursor-pointer relative ${
						activeTab === "agent"
							? "border-kumo-brand text-kumo-brand"
							: "border-transparent text-kumo-subtle hover:text-kumo-strong"
					}`}
				>
					<RobotIcon size={16} weight={activeTab === "agent" ? "fill" : "regular"} />
					<span>AI Agent</span>
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("mcp")}
					className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 bg-transparent cursor-pointer relative ${
						activeTab === "mcp"
							? "border-kumo-brand text-kumo-brand"
							: "border-transparent text-kumo-subtle hover:text-kumo-strong"
					}`}
				>
					<PlugsIcon size={16} weight={activeTab === "mcp" ? "fill" : "regular"} />
					<span>MCP Link</span>
				</button>
				<button
					type="button"
					onClick={closeAgentPanel}
					className="ml-auto p-2 rounded-full text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint/60 xl:hidden cursor-pointer mr-2 transition-all"
					aria-label="Close panel"
				>
					<XIcon size={18} weight="bold" />
				</button>
			</div>

			{/* Tab content — keep agent mounted so chat isn't lost */}
			<div className="flex-1 min-h-0 overflow-hidden">
				<div className={activeTab === "agent" ? "h-full" : "hidden"}>
					<LazyAgentPanel />
				</div>
				{activeTab === "mcp" && <MCPPanel />}
			</div>
		</div>
	);
}
