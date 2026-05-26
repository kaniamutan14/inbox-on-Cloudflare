// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Loader, Pagination, Tooltip } from "@cloudflare/kumo";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import MailboxSplitView from "~/components/MailboxSplitView";
import { formatListDate, getSnippetText } from "~/lib/utils";
import { useUpdateEmail } from "~/queries/emails";
import { useSearchEmails, SEARCH_PAGE_SIZE } from "~/queries/search";
import { useUIStore } from "~/hooks/useUIStore";
import type { Email } from "~/types";

function highlightTerms(text: string, query: string): React.ReactNode {
	if (!query || !text) return text;
	const freeText = query.replace(/\b(?:from|to|subject|in|is|has|before|after):"[^"]*"/gi, "").replace(/\b(?:from|to|subject|in|is|has|before|after):\S+/gi, "").trim();
	if (!freeText) return text;
	try {
		const escaped = freeText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`(${escaped})`, "gi");
		const parts = text.split(regex);
		if (parts.length === 1) return text;
		// Use case-insensitive string comparison instead of regex.test() with g flag,
		// which has stateful lastIndex causing alternating true/false results.
		const lowerEscaped = escaped.toLowerCase();
		return parts.map((part, i) => part.toLowerCase() === lowerEscaped ? <mark key={i} className="bg-kumo-warning-muted text-kumo-default rounded-sm px-0.5">{part}</mark> : part);
	} catch { return text; }
}

export default function SearchResultsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { selectedEmailId, isComposing, selectEmail, closePanel } = useUIStore();
	const updateEmail = useUpdateEmail();
	const urlQuery = searchParams.get("q") || "";
	const [page, setPage] = useState(1);
	const searchKey = useMemo(
		() => `${mailboxId ?? ""}::${urlQuery}`,
		[mailboxId, urlQuery],
	);
	const prevSearchKeyRef = useRef(searchKey);
	const searchChanged = prevSearchKeyRef.current !== searchKey;
	const currentPage = searchChanged ? 1 : page;

	useEffect(() => {
		if (!searchChanged) {
			return;
		}

		prevSearchKeyRef.current = searchKey;
		setPage(1);
		closePanel();
	}, [closePanel, searchChanged, searchKey]);

	const { data: searchData, isLoading } = useSearchEmails(
		mailboxId,
		urlQuery,
		currentPage,
	);
	const results = searchData?.results ?? [];
	const totalCount = searchData?.totalCount ?? 0;
	const isPanelOpen = selectedEmailId !== null || isComposing;

	const handleRowClick = (email: Email) => { selectEmail(email.id); if (!email.read && mailboxId) updateEmail.mutate({ mailboxId, id: email.id, data: { read: true } }); };
	const folderDisplayName = (name: string | null | undefined): string => { if (!name) return ""; const map: Record<string, string> = { inbox: "Inbox", sent: "Sent", draft: "Drafts", archive: "Archive", trash: "Trash" }; return map[name.toLowerCase()] || name; };

	return (
		<MailboxSplitView
			selectedEmailId={selectedEmailId}
			isComposing={isComposing}
		>
			<>
				<div className="flex items-center gap-2 px-4 py-3.5 border-b border-kumo-line shrink-0 md:px-5">
					<Tooltip content="Back to inbox" side="bottom" asChild><Button variant="ghost" shape="square" size="sm" icon={<ArrowLeftIcon size={18} />} onClick={() => navigate(`/mailbox/${mailboxId}/emails/inbox`)} aria-label="Back to inbox" /></Tooltip>
					<div className="min-w-0 flex-1"><h1 className="text-lg font-semibold text-kumo-default truncate">Search Results</h1>{!isLoading && <span className="text-sm text-kumo-subtle">{totalCount} result{totalCount !== 1 ? "s" : ""}{urlQuery ? ` for "${urlQuery}"` : ""}</span>}</div>
				</div>
				<div className="flex-1 overflow-y-auto">
					{isLoading ? <div className="flex justify-center py-16"><Loader size="lg" /></div> : results.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 px-6 text-center">
							<div className="mb-4"><MagnifyingGlassIcon size={48} weight="thin" className="text-kumo-subtle" /></div>
							<h3 className="text-base font-semibold text-kumo-default mb-1.5">No results found</h3>
							<p className="text-sm text-kumo-subtle max-w-xs">{urlQuery ? `Nothing matched "${urlQuery}". Try different keywords or check your spelling.` : "Enter a search term to find emails by subject, sender, or content."}</p>
							{urlQuery && <p className="text-xs text-kumo-subtle mt-3 max-w-sm">Tip: Use operators like <code className="bg-kumo-tint px-1 rounded">from:name</code>, <code className="bg-kumo-tint px-1 rounded">is:unread</code>, <code className="bg-kumo-tint px-1 rounded">has:attachment</code>, <code className="bg-kumo-tint px-1 rounded">before:2025-01-01</code></p>}
						</div>
					) : (
						<div className="divide-y divide-kumo-line/45">{results.map((email) => {
							const isSelected = selectedEmailId === email.id;
							const snippet = getSnippetText(email.snippet, 120);
							const folderName = (email as Email & { folder_name?: string }).folder_name;
							const senderName = email.sender.split("@")[0];
							
							const initials = senderName.trim().charAt(0).toUpperCase();
							let hash = 0;
							for (let i = 0; i < senderName.length; i++) {
								hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
							}
							const colorIndex = Math.abs(hash) % 8;
							const avatarColorClass = `avatar-color-${colorIndex}`;

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
										isSelected 
											? "bg-kumo-brand/5 border-l-3 border-l-kumo-brand pl-3 md:pl-4" 
											: "bg-kumo-base hover:bg-kumo-tint/30 border-l-3 border-l-transparent pl-3 md:pl-4"
									}`}
								>
									{/* Avatar */}
									<div className="relative w-10 h-10 shrink-0 select-none">
										<div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-xs transition-transform ${avatarColorClass}`}>
											{initials}
											{!email.read && (
												<span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-kumo-base bg-kumo-brand" />
											)}
										</div>
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1 pr-6 md:pr-0">
										<div className="flex items-center gap-2">
											<span className={`truncate text-sm ${!email.read ? "font-bold text-kumo-strong" : "text-kumo-strong/80 font-medium"}`}>
												{highlightTerms(senderName, urlQuery)}
											</span>
											{folderName && (
												<Badge variant="outline" className="border-kumo-line bg-kumo-tint/20 text-[10px] py-0.5 px-1.5 font-bold uppercase tracking-wider">
													{folderDisplayName(folderName)}
												</Badge>
											)}
											<span className="text-xs text-kumo-subtle shrink-0 ml-auto font-medium">
												{formatListDate(email.date)}
											</span>
										</div>
										<div className="truncate text-xs md:text-sm mt-1 text-kumo-strong">
											<span className={!email.read ? "font-semibold text-kumo-strong" : "text-kumo-subtle font-medium"}>
												{highlightTerms(email.subject, urlQuery)}
											</span>
											{snippet && (
												<span className="text-kumo-subtle/80 font-normal">
													{" "}&mdash; {highlightTerms(snippet, urlQuery)}
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}</div>
					)}
				</div>
				{totalCount > SEARCH_PAGE_SIZE && <div className="flex justify-center py-3 border-t border-kumo-line shrink-0"><Pagination page={currentPage} setPage={setPage} perPage={SEARCH_PAGE_SIZE} totalCount={totalCount} /></div>}
			</>
		</MailboxSplitView>
	);
}
