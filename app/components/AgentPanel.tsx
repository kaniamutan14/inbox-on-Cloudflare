// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Loader, Tooltip } from "@cloudflare/kumo";
import {
	ArrowUpIcon,
	RobotIcon,
	TrashIcon,
	UserIcon,
	EnvelopeSimpleIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	EyeIcon,
	ArrowBendUpLeftIcon,
	WrenchIcon,
	CheckCircleIcon,
	StopIcon,
	PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUIStore } from "~/hooks/useUIStore";
import type { UIMessage } from "ai";

const TOOL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
	list_emails: {
		label: "Fetching emails",
		icon: <EnvelopeSimpleIcon size={14} weight="bold" />,
	},
	get_email: {
		label: "Reading email",
		icon: <EyeIcon size={14} weight="bold" />,
	},
	get_thread: {
		label: "Loading thread",
		icon: <ArrowBendUpLeftIcon size={14} weight="bold" />,
	},
	search_emails: {
		label: "Searching",
		icon: <MagnifyingGlassIcon size={14} weight="bold" />,
	},
	draft_email: {
		label: "Drafting email",
		icon: <PaperPlaneTiltIcon size={14} weight="bold" />,
	},
	draft_reply: {
		label: "Drafting reply",
		icon: <PaperPlaneTiltIcon size={14} weight="bold" />,
	},
	discard_draft: {
		label: "Discarding draft",
		icon: <TrashIcon size={14} weight="bold" />,
	},
	mark_email_read: {
		label: "Updating status",
		icon: <CheckCircleIcon size={14} weight="bold" />,
	},
	move_email: {
		label: "Moving email",
		icon: <EnvelopeSimpleIcon size={14} weight="bold" />,
	},
};

function ToolCallBadge({
	toolName,
	state,
}: {
	toolName: string;
	state: string;
}) {
	const info = TOOL_LABELS[toolName] || {
		label: toolName,
		icon: <WrenchIcon size={14} weight="bold" />,
	};
	const isDone =
		state === "output-available" ||
		state === "result" ||
		state === "output-error";

	return (
		<div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-kumo-tint/40 border border-kumo-line/50 text-[11px] font-semibold text-kumo-strong shadow-3xs animate-fade-in my-1 select-none">
			<span className="text-kumo-brand shrink-0">{info.icon}</span>
			<span className="truncate max-w-[150px]">{info.label}</span>
			{isDone ? (
				<CheckCircleIcon
					size={14}
					weight="fill"
					className="text-emerald-500 ml-auto shrink-0"
				/>
			) : (
				<Loader size="sm" className="ml-auto shrink-0" />
			)}
		</div>
	);
}

function getToolNameFromPart(part: UIMessage["parts"][number]): string | null {
	if (part.type === "dynamic-tool") return (part as any).toolName ?? null;
	if (part.type.startsWith("tool-")) return part.type.replace("tool-", "");
	return null;
}

function hasDraftReplyTool(message: UIMessage): boolean {
	return (message.parts || []).some((part) => {
		const toolName = getToolNameFromPart(part);
		return toolName === "draft_reply";
	});
}

function DraftActions({
	onEdit,
	disabled,
}: {
	onEdit: () => void;
	disabled: boolean;
}) {
	return (
		<div className="flex gap-1.5 mt-1.5">
			<button
				type="button"
				onClick={onEdit}
				disabled={disabled}
				className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:brightness-105 active:scale-98 transition-all cursor-pointer border-0 shadow-2xs"
			>
				<PencilSimpleIcon size={14} weight="bold" />
				<span>Edit & send in composer</span>
			</button>
		</div>
	);
}

function MessageBubble({
	message,
	onAction,
	isStreaming,
}: {
	message: UIMessage;
	onAction?: (action: string) => void;
	isStreaming: boolean;
}) {
	const isUser = message.role === "user";

	return (
		<div
			className={`flex gap-2.5 ${isUser ? "flex-row-reverse animate-slide-right" : "flex-row animate-fade-in"}`}
		>
			<div
				className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-2xs ${
					isUser
						? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
						: "bg-kumo-tint text-kumo-brand"
				}`}
			>
				{isUser ? (
					<UserIcon size={13} weight="bold" />
				) : (
					<RobotIcon size={13} weight="bold" />
				)}
			</div>

			<div
				className={`flex flex-col gap-1 max-w-[85%] min-w-0 ${
					isUser ? "items-end" : "items-start"
				}`}
			>
				{(message.parts || []).map((part, i) => {
					const key = `${message.id}-part-${i}`;
					if (part.type === "text" && part.text?.trim()) {
						return (
							<div
								key={key}
								className={`rounded-2xl px-4 py-2.5 text-xs md:text-[13px] leading-relaxed break-words overflow-wrap-anywhere shadow-2xs ${
									isUser
										? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-none"
										: "bg-kumo-base text-kumo-strong border border-kumo-line/50 rounded-tl-none overflow-hidden"
								}`}
							>
								{isUser ? (
									part.text
								) : (
									<Markdown
										remarkPlugins={[remarkGfm]}
										components={{
											a: ({ href, children }) => (
												<a
													href={href}
													target="_blank"
													rel="noopener noreferrer"
													style={{
														color: "var(--color-kumo-brand)",
														textDecoration: "underline",
													}}
												>
													{children}
												</a>
											),
											p: ({ children }) => (
												<p className="mb-2 last:mb-0">
													{children}
												</p>
											),
											strong: ({ children }) => (
												<strong className="font-bold text-kumo-strong">
													{children}
												</strong>
											),
											ul: ({ children }) => (
												<ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">
													{children}
												</ul>
											),
											ol: ({ children }) => (
												<ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">
													{children}
												</ol>
											),
											li: ({ children }) => (
												<li>{children}</li>
											),
											h1: ({ children }) => (
												<h3 className="font-bold text-sm mb-1 text-kumo-strong">
													{children}
												</h3>
											),
											h2: ({ children }) => (
												<h4 className="font-bold text-[13px] mb-1 text-kumo-strong">
													{children}
												</h4>
											),
											h3: ({ children }) => (
												<h5 className="font-bold text-[13px] mb-0.5 text-kumo-strong">
													{children}
												</h5>
											),
											code: ({ children }) => (
												<code className="bg-kumo-fill/60 px-1 py-0.5 rounded text-[12px] text-kumo-brand font-medium">
													{children}
												</code>
											),
											table: ({ children }) => (
												<div className="overflow-x-auto my-2">
													<table className="w-full text-xs border-collapse">
														{children}
													</table>
												</div>
											),
											thead: ({ children }) => (
												<thead className="border-b border-kumo-line bg-kumo-fill/30">
													{children}
												</thead>
											),
											th: ({ children }) => (
												<th className="text-left px-2 py-1 font-semibold text-kumo-strong">
													{children}
												</th>
											),
											td: ({ children }) => (
												<td className="px-2 py-1 border-b border-kumo-line/50">
													{children}
												</td>
											),
										}}
									>
										{part.text}
									</Markdown>
								)}
							</div>
						);
					}
					const toolName = getToolNameFromPart(part);
					if (toolName) {
						return (
							<ToolCallBadge
								key={key}
								toolName={toolName}
								state={(part as any).state ?? "running"}
							/>
						);
					}
					return null;
				})}
				{/* Show action buttons for draft replies */}
				{!isUser && hasDraftReplyTool(message) && onAction && (
					<DraftActions
						onEdit={() => onAction("edit")}
						disabled={isStreaming}
					/>
				)}
			</div>
		</div>
	);
}

function AgentChatConnected({
	mailboxId,
	useAgent,
	useAgentChat,
}: {
	mailboxId: string;
	useAgent: typeof import("agents/react").useAgent;
	useAgentChat: typeof import("@cloudflare/ai-chat/react").useAgentChat;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [inputValue, setInputValue] = useState("");
	const { isAgentPanelOpen, startCompose, pendingAiDraft, setPendingAiDraft } = useUIStore();

	const agent = useAgent({ agent: "EmailAgent", name: mailboxId });
	const { messages, sendMessage, status, setMessages, stop, clearHistory } =
		useAgentChat({ agent });
	const isStreaming = status === "streaming" || status === "submitted";

	// Consume pending AI draft request from toolbar button
	useEffect(() => {
		if (pendingAiDraft && !isStreaming) {
			const prompt = `Draft a reply to email ${pendingAiDraft.emailId} from ${pendingAiDraft.sender}: "${pendingAiDraft.subject}"`;
			sendMessage({ text: prompt });
			setPendingAiDraft(null);
		}
	}, [pendingAiDraft, isStreaming]);

	useEffect(() => {
		const el = scrollRef.current;
		if (el) {
			const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
			if (isNearBottom || messages[messages.length - 1]?.role === "user") {
				el.scrollTop = el.scrollHeight;
			}
		}
	}, [messages]);

	useEffect(() => {
		if (isAgentPanelOpen && window.innerWidth >= 1280) {
			inputRef.current?.focus();
		}
	}, [isAgentPanelOpen]);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = "auto";
			inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
			inputRef.current.style.overflow = inputRef.current.scrollHeight > 100 ? "auto" : "hidden";
		}
	}, [inputValue]);

	const handleSend = () => {
		const text = inputValue.trim();
		if (!text || isStreaming) return;
		setInputValue("");
		sendMessage({ text });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const suggestedPrompts = [
		"Show me the latest inbox emails",
		"Any unread emails?",
		"Draft a response to the latest email",
	];

	return (
		<div className="flex flex-col h-full bg-kumo-surface/50">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-2 border-b border-kumo-line/50 shrink-0 bg-kumo-base/20">
				<div className="flex items-center gap-2">
					<Badge variant="beta" className="text-[10px] font-bold py-0.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-full">AI</Badge>
					<span className="text-xs font-semibold text-kumo-subtle">
						Email Agent Assistant
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					{isStreaming && <Loader size="sm" />}
					{messages.length > 0 && (
						<Tooltip content="Clear chat" asChild>
							<Button
								variant="ghost"
								shape="square"
								size="sm"
								icon={<TrashIcon size={15} />}
								onClick={() => {
									if (window.confirm("Clear chat history?")) {
										clearHistory();
									}
								}}
								aria-label="Clear chat"
								className="hover:bg-red-500/10 hover:text-red-500 text-kumo-subtle transition-colors rounded-full"
							/>
						</Tooltip>
					)}
				</div>
			</div>

			{/* Messages */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full gap-5">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kumo-brand/10 shadow-3xs animate-float">
							<RobotIcon
								size={28}
								weight="duotone"
								className="text-kumo-brand"
							/>
						</div>
						<p className="text-xs text-kumo-subtle text-center leading-relaxed px-5 max-w-xs">
							I am your autonomous email copilot. Ask me to search threads, draft responses, or organize folders!
						</p>
						<div className="flex flex-col gap-2 w-full max-w-xs mt-3">
							{suggestedPrompts.map((prompt) => (
								<button
									key={prompt}
									type="button"
									onClick={() =>
										sendMessage({ text: prompt })
									}
									className="text-left px-4 py-3 rounded-2xl border border-kumo-line/60 text-xs font-semibold text-kumo-strong hover:bg-kumo-brand/10 hover:border-kumo-brand/40 hover:text-kumo-brand hover:scale-[1.02] active:scale-98 transition-all duration-150 cursor-pointer bg-kumo-base/30 shadow-3xs"
								>
									{prompt}
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{messages.map((msg) => (
							<MessageBubble
								key={msg.id}
								message={msg}
								isStreaming={isStreaming}
								onAction={(action) => {
									if (action === "edit") {
										// Extract draft data from the draft_reply tool result
										let draftData: {
											to?: string;
											subject?: string;
											body?: string;
											id?: string;
										} | null = null;
										for (const part of msg.parts || []) {
											if (
												(part as any).toolName === "draft_reply" &&
												(part as any).result &&
												typeof (part as any).result === "object" &&
												!(part as any).result.error
											) {
												draftData = (part as any).result.draft || (part as any).result;
												// Safety override: if it has draftId but no id, map it.
												if (!draftData!.id && (part as any).result.draftId) {
													draftData!.id = (part as any).result.draftId;
												}
												break;
											}
										}
										if (draftData && draftData.id) {
											const draftEmail = {
												id: draftData.id,
												subject: draftData.subject || "",
												sender: mailboxId,
												recipient: draftData.to || "",
												date: new Date().toISOString(),
												read: true,
												starred: false,
												body: draftData.body || "",
											};
											startCompose({
												mode: "reply",
												originalEmail: null,
												draftEmail,
											});
										} else {
											sendMessage({
												text: "Let me edit this draft first. Show me what you have so I can modify it.",
											});
										}
									}
								}}
							/>
						))}
						{isStreaming && (
							<div className="flex gap-2.5 animate-pulse">
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kumo-fill text-kumo-brand">
									<RobotIcon size={13} weight="bold" />
								</div>
								<div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-kumo-base text-kumo-strong border border-kumo-line/50 rounded-bl-none shadow-3xs">
									<Loader size="sm" />
									<span className="text-[11px] font-semibold text-kumo-subtle">
										Thinking...
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Input */}
			<div className="shrink-0 border-t border-kumo-line/50 px-4 py-3 bg-kumo-base/30">
				{isStreaming ? (
					<div className="flex justify-center py-1">
						<Button
							variant="secondary"
							size="sm"
							icon={<StopIcon size={14} weight="fill" />}
							onClick={() => stop()}
							className="rounded-full shadow-3xs transition-transform hover:scale-105"
						>
							Stop generating
						</Button>
					</div>
				) : (
					<div className="flex items-center gap-2 bg-kumo-tint/20 border border-kumo-line/50 rounded-full px-3.5 py-1.5 focus-within:bg-kumo-recessed focus-within:border-kumo-brand/60 focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all shadow-3xs">
						<textarea
							ref={inputRef}
							id="agent-chat-input"
							name="agent-chat-input"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask your email agent..."
							rows={1}
							aria-label="Chat message input"
							className="flex-1 resize-none bg-transparent border-none outline-none focus:outline-none p-0 text-xs md:text-sm text-kumo-strong placeholder:text-kumo-subtle focus:ring-0 min-h-[28px] max-h-[100px] leading-relaxed"
							style={{ height: "auto", overflow: "hidden" }}
						/>
						<Button
							variant="primary"
							shape="square"
							size="sm"
							disabled={!inputValue.trim()}
							icon={<ArrowUpIcon size={14} weight="bold" />}
							onClick={handleSend}
							aria-label="Send message"
							className="rounded-full h-8 w-8 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-105 transition-all duration-150 shadow-xs active:scale-95 shrink-0"
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default function AgentPanel() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const [hooks, setHooks] = useState<{
		useAgent: typeof import("agents/react").useAgent;
		useAgentChat: typeof import("@cloudflare/ai-chat/react").useAgentChat;
	} | null>(null);

	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		Promise.all([
			import("agents/react"),
			import("@cloudflare/ai-chat/react"),
		]).then(([a, c]) =>
			setHooks({
				useAgent: a.useAgent,
				useAgentChat: c.useAgentChat,
			}),
		).catch((err) => {
			console.error("Failed to load agent modules:", err);
			setLoadError("Failed to connect to agent. Reload to retry.");
		});
	}, []);

	if (loadError) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
				<span className="text-xs text-kumo-error">{loadError}</span>
			</div>
		);
	}

	if (!hooks) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2">
				<Loader size="base" />
				<span className="text-xs text-kumo-subtle">
					Connecting...
				</span>
			</div>
		);
	}

	return (
		<AgentChatConnected
			mailboxId={mailboxId ?? "default"}
			useAgent={hooks.useAgent}
			useAgentChat={hooks.useAgentChat}
		/>
	);
}
