// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Input, Loader, useKumoToastManager } from "@cloudflare/kumo";
import { RobotIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useMailbox, useUpdateMailbox } from "~/queries/mailboxes";

// Placeholder shown in the textarea when no custom prompt is set.
// The authoritative default prompt lives in workers/agent/index.ts (DEFAULT_SYSTEM_PROMPT).
const PROMPT_PLACEHOLDER = `You are an email assistant that helps manage this inbox. You read emails, draft replies, and help organize conversations.\n\nWrite like a real person. Short, direct, flowing prose. Plain text only.\n\n(Leave empty to use the full built-in default prompt)`;

export default function SettingsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toastManager = useKumoToastManager();
	const { data: mailbox } = useMailbox(mailboxId);
	const updateMailboxMutation = useUpdateMailbox();

	const [displayName, setDisplayName] = useState("");
	const [agentPrompt, setAgentPrompt] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (mailbox) {
			setDisplayName(mailbox.settings?.fromName || mailbox.name || "");
			setAgentPrompt(mailbox.settings?.agentSystemPrompt || "");
		}
	}, [mailbox]);

	const handleSave = async () => {
		if (!mailbox || !mailboxId) return;
		setIsSaving(true);
		const settings = {
			...mailbox.settings,
			fromName: displayName,
			agentSystemPrompt: agentPrompt.trim() || undefined,
		};
		try {
			await updateMailboxMutation.mutateAsync({ mailboxId, settings });
			toastManager.add({ title: "Settings saved!" });
		} catch {
			toastManager.add({
				title: "Failed to save settings",
				variant: "error",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleResetPrompt = () => {
		setAgentPrompt("");
	};

	if (!mailbox) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	const isCustomPrompt = agentPrompt.trim().length > 0;

	return (
		<div className="max-w-2xl px-5 py-5 md:px-8 md:py-6 h-full overflow-y-auto bg-kumo-surface/30 animate-fade-in scrollbar-thin">
			<h1 className="text-xl font-bold text-kumo-strong mb-6 tracking-tight">Settings</h1>

			<div className="space-y-6">
				{/* Account */}
				<div className="rounded-2xl border border-kumo-line/50 bg-kumo-base p-6 shadow-2xs">
					<div className="text-sm font-bold text-kumo-strong mb-4 pb-2 border-b border-kumo-line/30 uppercase tracking-wider text-[11px] text-kumo-subtle">
						Account
					</div>
					<div className="space-y-4">
						<Input
							label="Display Name"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150 font-semibold text-kumo-strong"
						/>
						<Input 
							label="Email Address" 
							type="email" 
							value={mailbox.email} 
							disabled 
							className="w-full font-medium text-kumo-subtle opacity-75"
						/>
					</div>
				</div>

				{/* Agent System Prompt */}
				<div className="rounded-2xl border border-kumo-line/50 bg-kumo-base p-6 shadow-2xs">
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-kumo-line/30">
						<div className="flex items-center gap-2">
							<RobotIcon size={18} weight="duotone" className="text-kumo-brand" />
							<span className="text-sm font-bold text-kumo-strong uppercase tracking-wider text-[11px] text-kumo-subtle">
								AI Agent Prompt
							</span>
							{isCustomPrompt ? (
								<Badge variant="primary" className="font-bold py-0.5 px-2 rounded-full text-xs">Custom</Badge>
							) : (
								<Badge variant="secondary" className="font-bold py-0.5 px-2 rounded-full text-xs bg-kumo-tint/50">Default</Badge>
							)}
						</div>
						{isCustomPrompt && (
							<Button
								variant="ghost"
								size="xs"
								icon={<ArrowCounterClockwiseIcon size={14} />}
								onClick={handleResetPrompt}
								className="hover:bg-kumo-tint/60 transition-colors rounded-lg text-kumo-brand text-xs font-semibold"
							>
								Reset to default
							</Button>
						)}
					</div>
					<p className="text-xs text-kumo-subtle mb-3.5 leading-relaxed font-medium">
						Customize how the AI agent behaves for this mailbox. Write rules about rules, formatting options, or draft instructions. Leave empty to use the built-in default prompt.
					</p>
					<textarea
						value={agentPrompt}
						onChange={(e) => setAgentPrompt(e.target.value)}
						placeholder={PROMPT_PLACEHOLDER}
						rows={12}
						className="w-full resize-y rounded-xl border border-kumo-line bg-kumo-recessed px-4 py-3 text-xs text-kumo-strong placeholder:text-kumo-subtle focus:outline-none focus:ring-2 focus:ring-kumo-brand/10 focus:border-kumo-brand/60 transition-all font-mono leading-relaxed shadow-3xs"
					/>
					<p className="text-xs text-kumo-subtle mt-2.5 leading-relaxed font-medium">
						The prompt is sent as the system message to the AI model. It controls the agent's personality, writing style, and behavior rules.
					</p>
				</div>

				{/* Save */}
				<div className="flex justify-end pt-2">
					<Button 
						variant="primary" 
						onClick={handleSave} 
						loading={isSaving}
						className="hover:scale-102 transition-transform bg-gradient-to-r from-blue-600 to-blue-500 shadow-xs px-6 py-2 rounded-xl font-semibold"
					>
						Save Changes
					</Button>
				</div>
			</div>
		</div>
	);
}
