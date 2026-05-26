// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Tooltip } from "@cloudflare/kumo";
import {
	CaretDownIcon,
	CaretUpIcon,
	CodeIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import EmailAttachmentList from "~/components/EmailAttachmentList";
import EmailIframe from "~/components/EmailIframe";
import {
	formatDetailDate,
	formatShortDate,
	rewriteInlineImages,
	stripHtml,
} from "~/lib/utils";
import type { Email } from "~/types";

interface ThreadMessageProps {
	email: Email;
	mailboxId?: string;
	mailboxEmail?: string;
	isLast: boolean;
	isDraft?: boolean;
	isSending?: boolean;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onSendDraft?: () => void;
	onEditDraft?: () => void;
	onDeleteDraft?: () => void;
	onViewSource?: () => void;
	onPreviewImage?: (url: string, filename: string) => void;
}

const getInitials = (name: string): string => {
	if (!name) return "?";
	return name.trim().charAt(0).toUpperCase();
};

const getAvatarColorClass = (name: string): string => {
	if (!name) return "avatar-color-0";
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % 8;
	return `avatar-color-${index}`;
};

function Avatar({ isDraft, isSelf, sender }: { isDraft?: boolean; isSelf: boolean; sender: string }) {
	const senderName = isSelf ? "You" : sender.split("@")[0];
	return (
		<div
			className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs transition-transform ${
				isDraft
					? "bg-gradient-to-r from-amber-500 to-amber-600"
					: getAvatarColorClass(senderName)
			}`}
		>
			{isDraft ? "D" : getInitials(senderName)}
		</div>
	);
}

export default function ThreadMessage({
	email,
	mailboxId,
	mailboxEmail,
	isLast,
	isDraft,
	isSending,
	isExpanded,
	onToggleExpand,
	onSendDraft,
	onEditDraft,
	onDeleteDraft,
	onViewSource,
	onPreviewImage,
}: ThreadMessageProps) {
	const isSelf = email.sender === mailboxEmail;
	const containerClassName = `${!isLast ? "border-b border-kumo-line/50" : ""} ${isDraft ? "border-l-3 border-l-amber-500 bg-amber-500/[0.01]" : ""}`;
	const senderLabel = isDraft ? "Draft reply" : isSelf ? "You" : email.sender;

	if (!isExpanded) {
		return (
			<div className={containerClassName}>
				<button
					type="button"
					onClick={onToggleExpand}
					className="group w-full flex items-center gap-3.5 px-4 py-3 hover:bg-kumo-tint/40 rounded-xl text-left transition-all duration-150"
				>
					<Avatar isDraft={isDraft} isSelf={isSelf} sender={email.sender} />
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold text-kumo-strong truncate">
								{senderLabel}
							</span>
							<span className="text-xs text-kumo-subtle shrink-0">
								{formatDetailDate(email.date)}
							</span>
						</div>
						<p className="text-xs text-kumo-subtle truncate mt-0.5 font-normal">
							{stripHtml(email.body || "").slice(0, 80)}
						</p>
					</div>
					<CaretDownIcon size={14} className="text-kumo-subtle shrink-0 group-hover:translate-y-0.5 transition-transform" />
				</button>
			</div>
		);
	}

	return (
		<div className={`group/thread-msg ${containerClassName} transition-all`}>
			<div className="px-4 py-5 md:px-6">
				<div className="flex items-center justify-between gap-3 mb-4">
					<div className="flex items-center gap-3 min-w-0">
						<button
							type="button"
							onClick={onToggleExpand}
							className="shrink-0"
							aria-label="Collapse message"
						>
							<div className="cursor-pointer hover:scale-105 active:scale-95 transition-transform rounded-full">
								<Avatar isDraft={isDraft} isSelf={isSelf} sender={email.sender} />
							</div>
						</button>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-kumo-strong truncate">
									{senderLabel}
								</span>
								{isDraft && <Badge variant="outline" className="border-amber-500/30 text-amber-500 font-semibold bg-amber-500/5">Draft</Badge>}
							</div>
							<div className="text-xs text-kumo-subtle mt-0.5">To: {email.recipient}</div>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<span className="text-xs text-kumo-subtle font-medium">
							{formatShortDate(email.date)}
						</span>
						{onViewSource && (
							<Tooltip content="View source" side="bottom" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<CodeIcon size={14} />}
									onClick={onViewSource}
									aria-label="View source"
									className="transition-all duration-150 !h-6 !w-6 hover:bg-kumo-tint/60"
								/>
							</Tooltip>
						)}
						<button
							type="button"
							onClick={onToggleExpand}
							className="ml-1"
							aria-label="Collapse message"
						>
							<CaretUpIcon
								size={14}
								className="text-kumo-subtle hover:text-kumo-strong hover:scale-110 transition-all duration-150"
							/>
						</button>
					</div>
				</div>

				<div className="md:ml-[48px] rounded-2xl border border-kumo-line/30 bg-kumo-base/10 px-4 py-4 md:px-5 md:py-5 shadow-2xs">
					<EmailIframe
						body={rewriteInlineImages(
							email.body || "",
							mailboxId || "",
							email.id,
							email.attachments,
						)}
						autoSize
					/>
				</div>

				{isDraft && (onSendDraft || onEditDraft || onDeleteDraft) && (
					<div className="flex gap-2 mt-4 md:ml-[48px]">
						{onSendDraft && (
							<Button
								variant="primary"
								size="sm"
								icon={<PaperPlaneTiltIcon size={14} />}
								onClick={onSendDraft}
								loading={isSending}
								disabled={isSending}
								className="hover:scale-102 transition-transform shadow-xs"
							>
								{isSending ? "Sending..." : "Send"}
							</Button>
						)}
						{onEditDraft && (
							<Button
								variant="secondary"
								size="sm"
								icon={<PencilSimpleIcon size={14} />}
								onClick={onEditDraft}
								disabled={isSending}
								className="hover:scale-102 transition-transform"
							>
								Edit
							</Button>
						)}
						{onDeleteDraft && (
							<Button
								variant="ghost"
								size="sm"
								icon={<TrashIcon size={14} />}
								onClick={onDeleteDraft}
								disabled={isSending}
								className="hover:bg-red-500/10 hover:text-red-500"
							>
								Discard
							</Button>
						)}
					</div>
				)}

				<EmailAttachmentList
					mailboxId={mailboxId}
					emailId={email.id}
					attachments={email.attachments}
					onPreviewImage={onPreviewImage}
					className="mt-4 md:ml-[48px]"
				/>
			</div>
		</div>
	);
}
