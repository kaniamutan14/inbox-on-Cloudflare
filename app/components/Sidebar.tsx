// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Dialog, Input, Tooltip } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	CaretLeftIcon,
	FileIcon,
	FolderIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	PlusIcon,
	TrashIcon,
	TrayIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { Folders, SYSTEM_FOLDER_IDS } from "shared/folders";
import { useCreateFolder, useFolders, useDeleteFolder } from "~/queries/folders";
import { useMailbox } from "~/queries/mailboxes";
import { useUIStore } from "~/hooks/useUIStore";

const FOLDER_ICONS: Record<string, React.ReactNode> = {
	[Folders.INBOX]: <TrayIcon size={18} weight="regular" />,
	[Folders.SENT]: <PaperPlaneTiltIcon size={18} weight="regular" />,
	[Folders.DRAFT]: <FileIcon size={18} weight="regular" />,
	[Folders.ARCHIVE]: <ArchiveIcon size={18} weight="regular" />,
	[Folders.TRASH]: <TrashIcon size={18} weight="regular" />,
};

const SYSTEM_FOLDER_LINKS = [
	{ id: Folders.INBOX, label: "Inbox" },
	{ id: Folders.SENT, label: "Sent" },
	{ id: Folders.DRAFT, label: "Drafts" },
	{ id: Folders.ARCHIVE, label: "Archive" },
	{ id: Folders.TRASH, label: "Trash" },
];

interface FolderLinkProps {
	to: string;
	icon: React.ReactNode;
	label: string;
	unreadCount?: number;
	onClick?: () => void;
}

function FolderLink({
	to,
	icon,
	label,
	unreadCount,
	onClick,
}: FolderLinkProps) {
	return (
		<NavLink
			to={to}
			onClick={onClick}
			className={({ isActive }) =>
				`flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
					isActive
						? "bg-kumo-brand/10 text-kumo-brand font-semibold"
						: "text-kumo-strong hover:bg-kumo-tint/60"
				}`
			}
		>
			{({ isActive }) => (
				<>
					{isActive && (
						<span className="absolute left-0 top-0 bottom-0 w-1 bg-kumo-brand rounded-r-md" />
					)}
					<span className="shrink-0 text-current">{icon}</span>
					<span className="truncate flex-1">{label}</span>
					{unreadCount != null && unreadCount > 0 && (
						<Badge variant={isActive ? "primary" : "secondary"} className="font-semibold text-xs py-0.5 px-2 rounded-full">
							{unreadCount}
						</Badge>
					)}
				</>
			)}
		</NavLink>
	);
}

export default function Sidebar() {
	const { mailboxId, folder: currentFolderId } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const navigate = useNavigate();
	const { data: folders = [] } = useFolders(mailboxId);
	const createFolderMutation = useCreateFolder();
	const deleteFolderMutation = useDeleteFolder();
	const { startCompose, closeSidebar } = useUIStore();
	const { data: currentMailbox } = useMailbox(mailboxId);
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState("");

	const customFolders = useMemo(
		() =>
			folders.filter(
				(f) => !(SYSTEM_FOLDER_IDS as readonly string[]).includes(f.id),
			),
		[folders],
	);

	const getUnreadCount = (folderId: string) => {
		const found = folders.find((f) => f.id === folderId);
		return found?.unreadCount || 0;
	};

	const handleCreateFolder = (e: React.FormEvent) => {
		e.preventDefault();
		if (newFolderName.trim() && mailboxId) {
			createFolderMutation.mutate({ mailboxId, name: newFolderName.trim() });
			setNewFolderName("");
			setIsCreateFolderOpen(false);
		}
	};

	const handleDeleteFolder = (folderId: string, folderName: string) => {
		if (
			confirm(
				`Are you sure you want to delete the folder "${folderName}"? All emails in this folder will be permanently deleted.`,
			)
		) {
			deleteFolderMutation.mutate(
				{ mailboxId: mailboxId!, id: folderId },
				{
					onSuccess: () => {
						if (currentFolderId === folderId) {
							navigate(`/mailbox/${mailboxId}/emails/${Folders.INBOX}`);
						}
					},
				},
			);
		}
	};

	const displayName = useMemo(() => {
		if (!currentMailbox) return mailboxId?.split("@")[0] || "Mailbox";
		// Prefer settings.fromName > name > local part of email
		if (currentMailbox.settings?.fromName) {
			return currentMailbox.settings.fromName;
		}
		if (currentMailbox.name && currentMailbox.name !== currentMailbox.email) {
			return currentMailbox.name;
		}
		return currentMailbox.email.split("@")[0] || currentMailbox.name;
	}, [currentMailbox, mailboxId]);

	const handleNavClick = () => {
		// Close mobile sidebar on navigation
		closeSidebar();
	};

	return (
		<aside className="h-full w-full bg-kumo-recessed flex flex-col shrink-0 border-r border-kumo-line/80 shadow-xs">
			{/* Back + identity */}
			<div className="px-5 pt-5 pb-3">
				<button
					type="button"
					onClick={() => {
						navigate("/");
						closeSidebar();
					}}
					className="flex items-center gap-1.5 text-kumo-subtle text-xs font-medium uppercase tracking-wider hover:text-kumo-brand transition-colors mb-4 cursor-pointer bg-transparent border-0 p-0"
				>
					<CaretLeftIcon size={12} weight="bold" />
					<span>Mailboxes</span>
				</button>
				<div className="px-1 border-b border-kumo-line/30 pb-3">
					<div className="text-base font-semibold text-kumo-strong truncate">
						{displayName}
					</div>
					<div className="text-xs text-kumo-subtle truncate mt-0.5">
						{currentMailbox?.email || mailboxId}
					</div>
				</div>
			</div>

			{/* Compose */}
			<div className="px-4 py-3">
				<button
					type="button"
					onClick={() => startCompose()}
					className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-full font-semibold text-sm shadow-md text-white hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-105 active:scale-98"
				>
					<PencilSimpleIcon size={18} weight="bold" />
					<span>Compose</span>
				</button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
				{SYSTEM_FOLDER_LINKS.map((folder) => (
					<FolderLink
						key={folder.id}
						to={`/mailbox/${mailboxId}/emails/${folder.id}`}
						icon={FOLDER_ICONS[folder.id]}
						label={folder.label}
						unreadCount={getUnreadCount(folder.id)}
						onClick={handleNavClick}
					/>
				))}

				{/* Custom folders */}
				{customFolders.length > 0 && (
					<div className="pt-5">
						<div className="flex items-center justify-between px-3 mb-1.5">
							<span className="text-xs uppercase tracking-wider font-semibold text-kumo-subtle">
								Folders
							</span>
							<Tooltip content="New folder" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<PlusIcon size={16} />}
									onClick={() => setIsCreateFolderOpen(true)}
									aria-label="Create new folder"
								/>
							</Tooltip>
						</div>
						{customFolders.map((folder) => (
							<div key={folder.id} className="group relative">
								<FolderLink
									to={`/mailbox/${mailboxId}/emails/${folder.id}`}
									icon={<FolderIcon size={18} />}
									label={folder.name}
									unreadCount={folder.unreadCount}
									onClick={handleNavClick}
								/>
								<div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
									<Tooltip content="Delete folder" asChild>
										<Button
											variant="ghost"
											shape="square"
											size="xs"
											icon={<TrashIcon size={14} />}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleDeleteFolder(folder.id, folder.name);
											}}
											aria-label={`Delete folder ${folder.name}`}
										/>
									</Tooltip>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Add folder button when no custom folders */}
				{customFolders.length === 0 && (
					<div className="pt-5">
						<div className="flex items-center justify-between px-3 mb-1.5">
							<span className="text-xs uppercase tracking-wider font-semibold text-kumo-subtle">
								Folders
							</span>
							<Tooltip content="New folder" asChild>
								<Button
									variant="ghost"
									shape="square"
									size="sm"
									icon={<PlusIcon size={16} />}
									onClick={() => setIsCreateFolderOpen(true)}
									aria-label="Create new folder"
								/>
							</Tooltip>
						</div>
					</div>
				)}
			</nav>

			{/* Create folder dialog */}
			<Dialog.Root
				open={isCreateFolderOpen}
				onOpenChange={setIsCreateFolderOpen}
			>
				<Dialog size="sm" className="p-6">
					<Dialog.Title className="text-base font-semibold mb-4">
						Create folder
					</Dialog.Title>
					<form onSubmit={handleCreateFolder} className="space-y-4">
						<Input
							label="Folder name"
							placeholder="e.g. Projects"
							value={newFolderName}
							onChange={(e) => setNewFolderName(e.target.value)}
							required
						/>
						<div className="flex justify-end gap-2">
							<Dialog.Close
								render={(props) => (
									<Button {...props} variant="secondary">
										Cancel
									</Button>
								)}
							/>
							<Button
								type="submit"
								variant="primary"
								disabled={!newFolderName.trim()}
							>
								Create
							</Button>
						</div>
					</form>
				</Dialog>
			</Dialog.Root>
		</aside>
	);
}
