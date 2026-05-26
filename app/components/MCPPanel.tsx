// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Tooltip } from "@cloudflare/kumo";
import {
	CheckIcon,
	CopyIcon,
	PlugsIcon,
	WrenchIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useParams } from "react-router";

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API unavailable or permission denied — ignore silently
		}
	};

	return (
		<Tooltip content={copied ? "Copied!" : "Copy"} asChild>
			<Button
				variant="ghost"
				shape="square"
				size="sm"
				icon={
					copied ? (
						<CheckIcon size={12} weight="bold" className="text-kumo-success" />
					) : (
						<CopyIcon size={12} />
					)
				}
				onClick={handleCopy}
				aria-label="Copy to clipboard"
			/>
		</Tooltip>
	);
}

const TOOLS = [
	{ name: "list_mailboxes", desc: "List all mailboxes" },
	{ name: "list_emails", desc: "List emails in a folder" },
	{ name: "get_email", desc: "Read a full email with body" },
	{ name: "get_thread", desc: "Load a conversation thread" },
	{ name: "search_emails", desc: "Search emails by query" },
	{ name: "draft_reply", desc: "Draft a reply to an email" },
	{ name: "send_reply", desc: "Send a reply" },
	{ name: "send_email", desc: "Send a new email" },
	{ name: "mark_email_read", desc: "Mark email as read/unread" },
	{ name: "move_email", desc: "Move email to a folder" },
];

export default function MCPPanel() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const baseUrl =
		typeof window !== "undefined" ? window.location.origin : "https://your-app.workers.dev";
	const mcpUrl = `${baseUrl}/mcp`;

	return (
		<div className="flex flex-col h-full bg-kumo-surface animate-fade-in">
			{/* Content */}
			<div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin">
				{/* Intro */}
				<div className="space-y-2.5">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kumo-brand/10 shadow-3xs animate-float">
							<PlugsIcon
								size={22}
								weight="duotone"
								className="text-kumo-brand"
							/>
						</div>
						<div>
							<h3 className="text-sm font-bold text-kumo-strong">
								Connect via MCP
							</h3>
							<p className="text-xs text-kumo-subtle font-medium">
								Model Context Protocol Link
							</p>
						</div>
					</div>
					<p className="text-xs text-kumo-subtle leading-relaxed bg-kumo-tint/20 px-3.5 py-3 rounded-xl border border-kumo-line/30 font-medium">
						This email agent exposes a standard MCP server. You can connect coding assistants (like Cursor, Claude Code, or Windsurf) to securely query your mailbox, read threads, and draft replies using natural language.
					</p>
				</div>

				{/* MCP URL */}
				<div className="space-y-2">
					<label className="text-xs font-bold uppercase tracking-wider text-kumo-subtle block px-0.5">
						Server Endpoint URL
					</label>
					<div className="relative group">
						<div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
							<CopyButton text={mcpUrl} />
						</div>
						<div className="bg-kumo-recessed text-kumo-strong font-mono text-[11px] px-3.5 py-3.5 pr-12 rounded-xl border border-kumo-line/50 break-all leading-relaxed shadow-3xs hover:border-kumo-brand/40 transition-colors">
							{mcpUrl}
						</div>
					</div>
				</div>

				{/* Available tools */}
				<div className="space-y-2.5">
					<h4 className="text-xs uppercase tracking-wider font-bold text-kumo-subtle px-0.5">
						Available Tools
					</h4>
					<div className="border border-kumo-line/50 rounded-xl divide-y divide-kumo-line/40 bg-kumo-base/10 overflow-hidden shadow-3xs">
						{TOOLS.map((tool) => (
							<div
								key={tool.name}
								className="flex items-center gap-3 px-4 py-3 hover:bg-kumo-tint/40 transition-all duration-150 group"
							>
								<WrenchIcon
									size={14}
									weight="bold"
									className="text-kumo-brand shrink-0 group-hover:scale-110 transition-transform"
								/>
								<div className="min-w-0 flex-1">
									<span className="text-xs font-mono font-bold text-kumo-strong">
										{tool.name}
									</span>
								</div>
								<span className="text-[11px] font-medium text-kumo-subtle shrink-0">
									{tool.desc}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
