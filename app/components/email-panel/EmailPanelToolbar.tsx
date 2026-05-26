// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Tooltip } from "@cloudflare/kumo";
import { useEffect, useRef, useState } from "react";
import {
	ArrowBendUpLeftIcon,
	ArrowBendUpRightIcon,
	ArrowLeftIcon,
	ChatCircleIcon,
	CodeIcon,
	EnvelopeOpenIcon,
	EnvelopeSimpleIcon,
	FolderSimpleIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	SparkleIcon,
	StarIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import type { Folder, Email } from "~/types";

interface EmailPanelToolbarProps {
	email: Email;
	mailboxId?: string;
	isDraftFolder: boolean;
	isTrashFolder?: boolean;
	isSending: boolean;
	moveToFolders: Folder[];
	lastReceivedMessage?: Email;
	onBack: () => void;
	onSendDraft: () => void;
	onEditDraft: () => void;
	onReply: () => void;
	onReplyAll: () => void;
	onForward: () => void;
	onToggleStar: () => void;
	onToggleRead: () => void;
	onMove: (folderId: string) => void;
	onViewSource: () => void;
	onDelete: () => void;
	onAiDraft?: () => void;
}

export default function EmailPanelToolbar({
	email,
	mailboxId,
	isDraftFolder,
	isTrashFolder,
	isSending,
	moveToFolders,
	onBack,
	onSendDraft,
	onEditDraft,
	onReply,
	onReplyAll,
	onForward,
	onToggleStar,
	onToggleRead,
	onMove,
	onViewSource,
	onDelete,
	onAiDraft,
}: EmailPanelToolbarProps) {
	return (
		<div className="flex items-center gap-1.5 px-3 py-2.5 bg-kumo-base/95 backdrop-blur-md border-b border-kumo-line/70 sticky top-0 z-10 md:px-5 shadow-xs">
			<Button
				variant="ghost"
				shape="square"
				size="sm"
				icon={<ArrowLeftIcon size={18} weight="bold" />}
				onClick={onBack}
				aria-label="Back to list"
				className="md:hidden shrink-0 hover:bg-kumo-tint/60 text-kumo-brand"
			/>

			{isDraftFolder ? (
				<>
					<Button
						variant="primary"
						size="sm"
						icon={<PaperPlaneTiltIcon size={16} />}
						onClick={onSendDraft}
						loading={isSending}
						className="hover:scale-102 transition-transform"
					>
						{isSending ? "Sending..." : "Send"}
					</Button>
					<Button
						variant="secondary"
						size="sm"
						icon={<PencilSimpleIcon size={16} />}
						onClick={onEditDraft}
						className="hover:scale-102 transition-transform"
					>
						Edit
					</Button>
				</>
			) : (
				<>
					<Tooltip content="Reply" side="bottom" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<ArrowBendUpLeftIcon size={18} />}
							onClick={onReply}
							aria-label="Reply"
							className="hover:bg-kumo-tint/60 transition-colors"
						/>
					</Tooltip>
					<Tooltip content="Reply All" side="bottom" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<ChatCircleIcon size={18} />}
							onClick={onReplyAll}
							aria-label="Reply All"
							className="hover:bg-kumo-tint/60 transition-colors"
						/>
					</Tooltip>
					<Tooltip content="Forward" side="bottom" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<ArrowBendUpRightIcon size={18} />}
							onClick={onForward}
							aria-label="Forward"
							className="hover:bg-kumo-tint/60 transition-colors"
						/>
					</Tooltip>
					{onAiDraft && (
						<Tooltip content="AI Draft Reply" side="bottom" asChild>
							<button
								type="button"
								onClick={onAiDraft}
								aria-label="AI Draft Reply"
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150 shrink-0 ml-1 border-0 cursor-pointer shadow-2xs shadow-blue-500/20"
							>
								<SparkleIcon size={14} weight="fill" className="text-white animate-spin-slow" />
								<span>AI Reply</span>
							</button>
						</Tooltip>
					)}
				</>
			)}

			<div className="h-5 w-px bg-kumo-line/80 mx-1" />

			<Tooltip content={email.starred ? "Unstar" : "Star"} side="bottom" asChild>
				<Button
					variant="ghost"
					shape="square"
					size="sm"
					icon={
						<StarIcon
							size={18}
							weight={email.starred ? "fill" : "regular"}
							className={email.starred ? "text-kumo-warning" : "text-kumo-subtle"}
						/>
					}
					onClick={onToggleStar}
					aria-label={email.starred ? "Unstar" : "Star"}
					className="hover:bg-kumo-tint/60 transition-colors"
				/>
			</Tooltip>

			<Tooltip content={email.read ? "Mark as unread" : "Mark as read"} side="bottom" asChild>
				<Button
					variant="ghost"
					shape="square"
					size="sm"
					icon={email.read ? <EnvelopeSimpleIcon size={18} /> : <EnvelopeOpenIcon size={18} />}
					onClick={onToggleRead}
					aria-label={email.read ? "Mark as unread" : "Mark as read"}
					className="hover:bg-kumo-tint/60 transition-colors"
				/>
			</Tooltip>

			<MoveToFolderMenu folders={moveToFolders} onMove={onMove} />

			<div className="ml-auto flex items-center gap-0.5">
				<Tooltip content="View source" side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<CodeIcon size={18} />}
						onClick={onViewSource}
						aria-label="View source"
						className="hover:bg-kumo-tint/60 text-kumo-subtle transition-colors"
					/>
				</Tooltip>
				<Tooltip content={isTrashFolder ? "Delete Permanently" : "Move to Trash"} side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<TrashIcon size={18} />}
						onClick={onDelete}
						aria-label={isTrashFolder ? "Delete Permanently" : "Move to Trash"}
						className="hover:bg-red-500/10 hover:text-red-500 text-kumo-subtle transition-colors"
					/>
				</Tooltip>
				<Tooltip content="Close" side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<XIcon size={18} />}
						onClick={onBack}
						aria-label="Close"
						className="hidden md:inline-flex hover:bg-kumo-tint/60 text-kumo-subtle transition-colors"
					/>
				</Tooltip>
			</div>
		</div>
	);
}

function MoveToFolderMenu({ folders, onMove }: { folders: Folder[]; onMove: (id: string) => void }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div ref={ref} className="relative">
			<Tooltip content="Move to folder" side="bottom" asChild>
				<Button
					variant="ghost"
					shape="square"
					size="sm"
					icon={<FolderSimpleIcon size={18} />}
					onClick={() => setOpen((o) => !o)}
					aria-label="Move to folder"
				/>
			</Tooltip>
			{open && (
				<div className="absolute top-full left-0 z-50 mt-1 min-w-[160px] rounded-lg border border-kumo-line bg-kumo-elevated shadow-lg py-1">
					<div className="px-3 py-1.5 text-xs font-medium text-kumo-subtle">Move to</div>
					<div className="h-px bg-kumo-line my-1" />
					{folders.map((f) => (
						<button
							key={f.id}
							type="button"
							className="w-full text-left px-3 py-1.5 text-sm text-kumo-default hover:bg-kumo-overlay transition-colors"
							onClick={() => { onMove(f.id); setOpen(false); }}
						>
							{f.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
