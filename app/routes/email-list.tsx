// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Pagination, Tooltip, useKumoToastManager } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	ArrowBendUpLeftIcon,
	ArrowsClockwiseIcon,
	EnvelopeOpenIcon,
	EnvelopeSimpleIcon,
	FileIcon,
	FolderIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	StarIcon,
	TrashIcon,
	TrayIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Folders } from "shared/folders";
import { formatListDate } from "shared/dates";
import MailboxSplitView from "~/components/MailboxSplitView";
import { getSnippetText } from "~/lib/utils";
import {
	useDeleteEmail,
	useEmails,
	useMarkThreadRead,
	useUpdateEmail,
	useMoveEmail,
} from "~/queries/emails";
import { useFolders } from "~/queries/folders";
import { queryKeys } from "~/queries/keys";
import { useUIStore } from "~/hooks/useUIStore";
import type { Email } from "~/types";

const PAGE_SIZE = 25;

const FOLDER_EMPTY_STATES: Record<
	string,
	{
		icon: React.ReactNode;
		title: string;
		description: string;
		showCompose?: boolean;
	}
> = {
	[Folders.INBOX]: {
		icon: <TrayIcon size={48} weight="thin" className="text-kumo-brand" />,
		title: "Your inbox is empty",
		description:
			"New emails will appear here when they arrive. Send an email to get the conversation started.",
		showCompose: true,
	},
	[Folders.SENT]: {
		icon: (
			<PaperPlaneTiltIcon size={48} weight="thin" className="text-kumo-brand" />
		),
		title: "No sent emails",
		description: "Emails you send will show up here.",
		showCompose: true,
	},
	[Folders.DRAFT]: {
		icon: <FileIcon size={48} weight="thin" className="text-kumo-brand" />,
		title: "No drafts",
		description: "Emails you're still working on will be saved here.",
		showCompose: true,
	},
	[Folders.ARCHIVE]: {
		icon: <ArchiveIcon size={48} weight="thin" className="text-kumo-brand" />,
		title: "Archive is empty",
		description:
			"Move emails here to keep your inbox clean without deleting them.",
	},
	[Folders.TRASH]: {
		icon: <TrashIcon size={48} weight="thin" className="text-kumo-brand" />,
		title: "Trash is empty",
		description:
			"Deleted emails will appear here. You can restore them or permanently delete them.",
	},
};

function EmailListSkeleton() {
	return (
		<div className="space-y-1.5 p-3">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex items-center gap-4 px-4 py-4 rounded-xl border border-kumo-line/30 bg-kumo-base shadow-2xs">
					<div className="w-5 h-5 rounded bg-kumo-fill skeleton-shimmer shrink-0" />
					<div className="w-10 h-10 rounded-full bg-kumo-fill skeleton-shimmer shrink-0" />
					<div className="flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-4 w-28 rounded bg-kumo-fill skeleton-shimmer" />
							<div className="h-3 w-5 rounded bg-kumo-fill skeleton-shimmer" />
							<div className="h-3.5 w-32 rounded bg-kumo-fill skeleton-shimmer" />
							<div className="h-3 w-14 rounded bg-kumo-fill skeleton-shimmer ml-auto" />
						</div>
						<div className="h-3 w-3/4 rounded bg-kumo-fill skeleton-shimmer" />
					</div>
				</div>
			))}
		</div>
	);
}

function FolderEmptyState({
	folder,
	onCompose,
}: {
	folder?: string;
	onCompose: () => void;
}) {
	const config = (folder && FOLDER_EMPTY_STATES[folder]) || {
		icon: (
			<EnvelopeSimpleIcon size={48} weight="thin" className="text-kumo-brand" />
		),
		title: "No emails",
		description: "This folder is empty.",
	};

	return (
		<div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in">
			<div className="mb-4 animate-float">{config.icon}</div>
			<h3 className="text-base font-semibold text-kumo-strong mb-1.5">
				{config.title}
			</h3>
			<p className="text-sm text-kumo-subtle max-w-xs mb-5">
				{config.description}
			</p>
			{"showCompose" in config && config.showCompose && (
				<Button
					variant="primary"
					size="sm"
					icon={<PencilSimpleIcon size={16} />}
					onClick={onCompose}
					className="hover:scale-105 transition-transform"
				>
					Compose
				</Button>
			)}
		</div>
	);
}

export default function EmailListRoute() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const {
		selectedEmailId,
		isComposing,
		selectEmail,
		closePanel,
		startCompose,
	} = useUIStore();
	const [page, setPage] = useState(1);

	// Multi-select and custom dropdown states
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);

	const queryClient = useQueryClient();
	const updateEmail = useUpdateEmail();
	const markThreadRead = useMarkThreadRead();
	const deleteEmail = useDeleteEmail();
	const moveEmail = useMoveEmail();
	const toastManager = useKumoToastManager();

	const params = useMemo(
		() => ({
			folder: folder || "",
			page: String(page),
			limit: String(PAGE_SIZE),
		}),
		[folder, page],
	);

	const {
		data: emailData,
		isFetching: isRefreshing,
	} = useEmails(mailboxId, params, { refetchInterval: 30_000 });

	const emails = emailData?.emails ?? [];
	const totalCount = emailData?.totalCount ?? 0;

	const { data: folders = [] } = useFolders(mailboxId);

	const folderName = useMemo(() => {
		const found = folders.find((f) => f.id === folder);
		if (found) return found.name;
		return folder ? folder.charAt(0).toUpperCase() + folder.slice(1) : "Inbox";
	}, [folders, folder]);

	const isPanelOpen = selectedEmailId !== null || isComposing;

	// Track folder identity to detect folder changes vs page changes
	const prevFolderRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		const folderChanged = prevFolderRef.current !== `${mailboxId}/${folder}`;
		prevFolderRef.current = `${mailboxId}/${folder}`;

		if (folderChanged) {
			closePanel();
			setPage(1);
			setSelectedIds(new Set());
			setIsMoveMenuOpen(false);
		}
	}, [mailboxId, folder, closePanel]);

	const toggleStar = (e: React.MouseEvent, email: Email) => {
		e.preventDefault();
		e.stopPropagation();
		if (mailboxId)
			updateEmail.mutate({
				mailboxId,
				id: email.id,
				data: { starred: !email.starred },
			});
	};

	const handleDelete = (e: React.MouseEvent, emailId: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (mailboxId) {
			const confirmed = window.confirm("Are you sure you want to delete this email?");
			if (!confirmed) return;
			deleteEmail.mutate({ mailboxId, id: emailId });
			if (selectedEmailId === emailId) closePanel();
		}
	};

	const handleRefresh = () => {
		if (mailboxId) {
			queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
			queryClient.invalidateQueries({
				queryKey: queryKeys.folders.list(mailboxId),
			});
		}
	};

	// Thread-aware helpers
	const hasUnread = (email: Email): boolean => {
		if (email.thread_unread_count !== undefined) {
			return email.thread_unread_count > 0;
		}
		return !email.read;
	};

	const handleRowClick = (email: Email) => {
		// If in multi-select mode, click toggles selection
		if (selectedIds.size > 0) {
			const next = new Set(selectedIds);
			if (next.has(email.id)) {
				next.delete(email.id);
			} else {
				if (next.size >= 10) {
					toastManager.add({
						title: "Selection limit reached",
						description: "You can select at most 10 emails at a time to prevent server overload.",
						variant: "error",
					});
					return;
				}
				next.add(email.id);
			}
			setSelectedIds(next);
			return;
		}

		if (selectedEmailId === email.id) {
			closePanel();
			return;
		}

		selectEmail(email.id);
		if (mailboxId && hasUnread(email)) {
			if (email.thread_id && email.thread_count && email.thread_count > 1) {
				markThreadRead.mutate({
					mailboxId,
					threadId: email.thread_id,
				});
			} else {
				updateEmail.mutate({
					mailboxId,
					id: email.id,
					data: { read: true },
				});
			}
		}
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, emailId: string) => {
		e.stopPropagation();
		const next = new Set(selectedIds);
		if (e.target.checked) {
			if (next.size >= 10) {
				toastManager.add({
					title: "Selection limit reached",
					description: "You can select at most 10 emails at a time to prevent server overload.",
					variant: "error",
				});
				return;
			}
			next.add(emailId);
		} else {
			next.delete(emailId);
		}
		setSelectedIds(next);
	};

	// Bulk action implementations
	const handleDeleteBulk = async () => {
		if (!mailboxId || selectedIds.size === 0) return;
		const idsArray = Array.from(selectedIds);
		try {
			toastManager.add({ title: `Deleting ${idsArray.length} conversation(s)...` });
			await Promise.all(
				idsArray.map((id) => deleteEmail.mutateAsync({ mailboxId, id }))
			);
			setSelectedIds(new Set());
			toastManager.add({ title: `${idsArray.length} conversation(s) deleted` });
			closePanel();
		} catch (err) {
			toastManager.add({ title: "Failed to delete some conversations", variant: "error" });
		}
	};

	const handleArchiveBulk = async () => {
		if (!mailboxId || selectedIds.size === 0) return;
		const idsArray = Array.from(selectedIds);
		try {
			toastManager.add({ title: `Archiving ${idsArray.length} conversation(s)...` });
			await Promise.all(
				idsArray.map((id) => moveEmail.mutateAsync({ mailboxId, id, folderId: Folders.ARCHIVE }))
			);
			setSelectedIds(new Set());
			toastManager.add({ title: `${idsArray.length} conversation(s) archived` });
			closePanel();
		} catch (err) {
			toastManager.add({ title: "Failed to archive some conversations", variant: "error" });
		}
	};

	const handleMarkReadBulk = async (read: boolean) => {
		if (!mailboxId || selectedIds.size === 0) return;
		const idsArray = Array.from(selectedIds);
		try {
			toastManager.add({ title: `Marking ${idsArray.length} as ${read ? "read" : "unread"}...` });
			await Promise.all(
				idsArray.map((id) => updateEmail.mutateAsync({ mailboxId, id, data: { read } }))
			);
			setSelectedIds(new Set());
			toastManager.add({ title: `${idsArray.length} conversation(s) updated` });
		} catch (err) {
			toastManager.add({ title: "Failed to update some conversations", variant: "error" });
		}
	};

	const handleMoveBulk = async (folderId: string) => {
		if (!mailboxId || selectedIds.size === 0) return;
		const idsArray = Array.from(selectedIds);
		try {
			toastManager.add({ title: `Moving ${idsArray.length} conversation(s)...` });
			await Promise.all(
				idsArray.map((id) => moveEmail.mutateAsync({ mailboxId, id, folderId }))
			);
			setSelectedIds(new Set());
			setIsMoveMenuOpen(false);
			toastManager.add({ title: `${idsArray.length} conversation(s) moved` });
			closePanel();
		} catch (err) {
			toastManager.add({ title: "Failed to move some conversations", variant: "error" });
		}
	};

	const formatParticipants = (email: Email): string => {
		if (email.participants) {
			const names = email.participants
				.split(",")
				.map((p) => p.trim().split("@")[0])
				.filter((name, idx, arr) => arr.indexOf(name) === idx);
			if (names.length <= 3) return names.join(", ");
			return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
		}
		return email.sender.split("@")[0];
	};

	const getInitials = (name: string): string => {
		if (!name) return "?";
		const trimmed = name.trim();
		return trimmed.charAt(0).toUpperCase();
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

	return (
		<MailboxSplitView
			selectedEmailId={selectedEmailId}
			isComposing={isComposing}
		>
			<div className="flex flex-col h-full overflow-hidden bg-kumo-surface relative">
				{/* Bulk operations bar OR Folder header */}
				{selectedIds.size > 0 ? (
					<div className="flex items-center justify-between px-4 py-3 bg-kumo-brand/5 border-b border-kumo-brand/20 shrink-0 md:px-5 h-[57px] animate-fade-in">
						<div className="flex items-center gap-3">
							<input
								type="checkbox"
								checked={emails.slice(0, Math.min(10, emails.length)).every(e => selectedIds.has(e.id))}
								ref={el => {
									if (el) {
										const count = emails.slice(0, Math.min(10, emails.length)).filter(e => selectedIds.has(e.id)).length;
										el.indeterminate = count > 0 && count < Math.min(10, emails.length);
									}
								}}
								onChange={(e) => {
									const next = new Set(selectedIds);
									const first10 = emails.slice(0, Math.min(10, emails.length));
									if (e.target.checked) {
										first10.forEach(email => {
											if (next.size < 10) next.add(email.id);
										});
									} else {
										first10.forEach(email => next.delete(email.id));
									}
									setSelectedIds(next);
								}}
								className="h-4 w-4 rounded-sm border-kumo-line text-kumo-brand focus:ring-kumo-brand"
							/>
							<span className="text-sm font-semibold text-kumo-brand">
								{selectedIds.size} selected <span className="text-xs text-kumo-subtle font-normal">(Max 10)</span>
							</span>
						</div>
						
						{/* Bulk Action Buttons */}
						<div className="flex items-center gap-1">
							<Tooltip content="Archive" side="bottom" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<ArchiveIcon size={18} />}
									onClick={handleArchiveBulk}
									aria-label="Archive selected"
								/>
							</Tooltip>
							<Tooltip content="Delete" side="bottom" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<TrashIcon size={18} />}
									onClick={handleDeleteBulk}
									aria-label="Delete selected"
								/>
							</Tooltip>
							<Tooltip content="Mark as Read" side="bottom" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<EnvelopeOpenIcon size={18} />}
									onClick={() => handleMarkReadBulk(true)}
									aria-label="Mark read selected"
								/>
							</Tooltip>
							<Tooltip content="Mark as Unread" side="bottom" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<EnvelopeSimpleIcon size={18} />}
									onClick={() => handleMarkReadBulk(false)}
									aria-label="Mark unread selected"
								/>
							</Tooltip>
							
							{/* Move to Folder */}
							<div className="relative">
								<Tooltip content="Move to Folder" side="bottom" asChild>
									<Button
										variant="ghost"
										shape="square"
										size="sm"
										icon={<FolderIcon size={18} />}
										onClick={() => setIsMoveMenuOpen(!isMoveMenuOpen)}
										aria-label="Move selected to folder"
									/>
								</Tooltip>
								{isMoveMenuOpen && (
									<>
										<div className="fixed inset-0 z-45" onClick={() => setIsMoveMenuOpen(false)} />
										<div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-kumo-base border border-kumo-line shadow-lg py-1.5 z-50 animate-fade-in max-h-60 overflow-y-auto">
											<div className="px-3 py-1.5 text-xs font-semibold text-kumo-subtle uppercase border-b border-kumo-line/40 mb-1">
												Move to
											</div>
											{folders
												.filter(f => f.id !== folder)
												.map(f => (
													<button
														key={f.id}
														type="button"
														onClick={() => handleMoveBulk(f.id)}
														className="w-full text-left px-3.5 py-2 text-sm text-kumo-strong hover:bg-kumo-tint hover:text-kumo-default transition-colors truncate"
													>
														{f.name}
													</button>
												))}
										</div>
									</>
								)}
							</div>
							
							<Tooltip content="Deselect All" side="bottom" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<XIcon size={18} />}
									onClick={() => setSelectedIds(new Set())}
									aria-label="Deselect all"
								/>
							</Tooltip>
						</div>
					</div>
				) : (
					/* Folder header */
					<div className="flex items-center justify-between px-4 py-3.5 border-b border-kumo-line shrink-0 md:px-5">
						<div className="flex items-center gap-2">
							<h1 className="text-lg font-bold text-kumo-strong">
								{folderName}
							</h1>
							{totalCount > 0 && (
								<span className="text-xs bg-kumo-tint/50 text-kumo-subtle py-0.5 px-2 rounded-full font-semibold">
									{totalCount}
								</span>
							)}
						</div>
						<div className="flex items-center gap-1">
							<Tooltip
								content={isRefreshing ? "Refreshing..." : "Refresh"}
								side="bottom"
								asChild
							>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={
										<ArrowsClockwiseIcon
											size={18}
											className={isRefreshing ? "animate-spin" : "hover:rotate-180 transition-transform duration-300"}
										/>
									}
									onClick={handleRefresh}
									disabled={isRefreshing}
									aria-label="Refresh"
								/>
							</Tooltip>
						</div>
					</div>
				)}

				{/* Email rows */}
				<div className="flex-1 overflow-y-auto">
					{isRefreshing && emails.length === 0 ? (
						<EmailListSkeleton />
					) : emails.length > 0 ? (
						<div className="divide-y divide-kumo-line/40">
							{emails.map((email) => {
								const isSelected = selectedIds.has(email.id);
								const isRowActive = selectedEmailId === email.id;
								const snippet = getSnippetText(email.snippet);
								const senderName = formatParticipants(email);
								
								return (
									<div
										key={email.id}
										role="button"
										tabIndex={0}
										onClick={() => handleRowClick(email)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleRowClick(email);
											}
										}}
										className={`group flex items-start gap-3.5 w-full text-left cursor-pointer transition-all border-b border-kumo-line/40 px-4 py-3.5 md:px-5 md:py-4 relative overflow-hidden email-row-hover ${
											isRowActive 
												? "bg-kumo-brand/5 border-l-3 border-l-kumo-brand pl-3 md:pl-4" 
												: isSelected 
													? "bg-kumo-brand/5 border-l-3 border-l-kumo-brand/60 pl-3 md:pl-4"
													: "bg-kumo-base hover:bg-kumo-tint/30 border-l-3 border-l-transparent pl-3 md:pl-4"
										}`}
									>
										{/* Selection Checkbox & Avatar */}
										<div className="relative w-10 h-10 shrink-0 select-none">
											{/* Hover/Selected Checkbox */}
											<div className={`absolute inset-0 flex items-center justify-center transition-all bg-kumo-base z-10 rounded-full ${
												isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 focus-within:opacity-100 focus-within:scale-100"
											}`}>
												<input
													type="checkbox"
													checked={isSelected}
													onChange={(e) => handleCheckboxChange(e, email.id)}
													className="h-4.5 w-4.5 rounded border-kumo-line text-kumo-brand focus:ring-kumo-brand/40 cursor-pointer"
												/>
											</div>
											
											{/* Initials Avatar */}
											<div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-xs transition-transform ${getAvatarColorClass(senderName)}`}>
												{getInitials(senderName)}
												{hasUnread(email) && (
													<span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-kumo-base bg-kumo-brand" />
												)}
											</div>
										</div>

										{/* Star Action */}
										<button
											type="button"
											className="shrink-0 mt-2 p-0.5 bg-transparent border-0 cursor-pointer hover:scale-110 transition-transform"
											onClick={(e) => {
												e.stopPropagation();
												toggleStar(e, email);
											}}
										>
											<StarIcon
												size={18}
												weight={email.starred ? "fill" : "regular"}
												className={
													email.starred
														? "text-kumo-warning"
														: "text-kumo-subtle hover:text-kumo-warning"
												}
											/>
										</button>

										{/* Content */}
										<div className="min-w-0 flex-1 pr-6 md:pr-0">
											<div className="flex items-center gap-2">
												<span
													className={`truncate text-sm ${hasUnread(email) ? "font-bold text-kumo-strong" : "text-kumo-strong/80 font-medium"}`}
												>
													{senderName}
												</span>
												{(email.thread_count ?? 1) > 1 && (
													<span className="shrink-0 text-xs text-kumo-brand bg-kumo-brand/10 dark:bg-kumo-brand/20 rounded-full px-2 py-0.5 font-bold">
														{email.thread_count}
													</span>
												)}
												{email.has_draft && (
													<span className="shrink-0 text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
														Draft
													</span>
												)}
												{email.needs_reply && !email.has_draft && (
													<Tooltip content="Needs reply" asChild>
														<span className="shrink-0 text-kumo-warning">
															<ArrowBendUpLeftIcon size={14} weight="bold" />
														</span>
													</Tooltip>
												)}
												<span className="text-xs text-kumo-subtle shrink-0 ml-auto font-medium">
													{formatListDate(email.date)}
												</span>
											</div>
											
											{/* Comfortable 2-line preview */}
											<div className="truncate text-xs md:text-sm mt-1 text-kumo-strong">
												<span
													className={hasUnread(email) ? "font-semibold text-kumo-strong" : "text-kumo-subtle font-medium"}
												>
													{email.subject}
												</span>
												{snippet && (
													<span className="text-kumo-subtle/80 font-normal">
														{" "}&mdash; {snippet}
													</span>
												)}
											</div>
										</div>

										{/* Hover actions (desktop only) */}
										<div className="hidden group-hover:flex items-center shrink-0 ml-2 bg-gradient-to-l from-kumo-base via-kumo-base/90 to-transparent pl-8 pr-2 h-full absolute right-0 top-0 z-20">
											<Tooltip content={email.read ? "Mark unread" : "Mark read"} asChild>
												<Button
													variant="ghost"
													shape="square"
													size="sm"
													icon={email.read ? <EnvelopeSimpleIcon size={16} /> : <EnvelopeOpenIcon size={16} />}
													onClick={(e) => {
														e.stopPropagation();
														if (mailboxId)
															updateEmail.mutate({
																mailboxId,
																id: email.id,
																data: { read: !email.read },
															});
													}}
													aria-label={email.read ? "Mark unread" : "Mark read"}
													className="hover:bg-kumo-tint/60 text-kumo-subtle hover:text-kumo-strong transition-all duration-150 rounded-lg"
												/>
											</Tooltip>
											<Tooltip content="Delete" asChild>
												<Button
													variant="ghost"
													shape="square"
													size="sm"
													icon={<TrashIcon size={16} />}
													onClick={(e) => handleDelete(e, email.id)}
													aria-label="Delete"
													className="hover:bg-red-500/10 hover:text-red-500 text-kumo-subtle transition-all duration-150 rounded-lg"
												/>
											</Tooltip>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<FolderEmptyState
							folder={folder}
							onCompose={() => startCompose()}
						/>
					)}
				</div>

				{/* Pagination */}
				{totalCount > PAGE_SIZE && (
					<div className="flex justify-center py-3 border-t border-kumo-line/80 shrink-0 bg-kumo-recessed/20">
						<Pagination
							page={page}
							setPage={setPage}
							perPage={PAGE_SIZE}
							totalCount={totalCount}
						/>
					</div>
				)}
				
				{/* Mobile FAB Compose Button */}
				{!isPanelOpen && selectedIds.size === 0 && (
					<button
						type="button"
						onClick={() => startCompose()}
						className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center fab-compose cursor-pointer border-0"
						aria-label="Compose email"
					>
						<PencilSimpleIcon size={24} weight="bold" />
					</button>
				)}
			</div>
		</MailboxSplitView>
	);
}
