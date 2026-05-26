// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Input, Tooltip } from "@cloudflare/kumo";
import { GearSixIcon, ListIcon, MagnifyingGlassIcon, MoonIcon, RobotIcon, SunIcon, XIcon } from "@phosphor-icons/react";
import { type KeyboardEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useThemeStore } from "~/hooks/useThemeStore";
import { useUIStore } from "~/hooks/useUIStore";

export default function Header() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const { toggleSidebar, toggleAgentPanel, isAgentPanelOpen } = useUIStore();
	const { theme, toggleTheme } = useThemeStore();

	// Sync search input with URL query param so it stays populated
	const urlQuery = searchParams.get("q") || "";
	useEffect(() => {
		if (location.pathname.includes("/search") && urlQuery) {
			setSearchQuery(urlQuery);
		}
	}, [urlQuery, location.pathname]);

	const performSearch = () => {
		if (mailboxId && searchQuery.trim()) {
			const q = searchQuery.trim();
			navigate(`/mailbox/${mailboxId}/search?q=${encodeURIComponent(q)}`);
			setIsSearchExpanded(false);
		}
	};

	const clearSearch = () => {
		setSearchQuery("");
		if (location.pathname.includes("/search") && mailboxId) {
			navigate(`/mailbox/${mailboxId}/emails/inbox`);
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			performSearch();
		}
		if (e.key === "Escape") {
			if (searchQuery) {
				clearSearch();
			} else {
				setIsSearchExpanded(false);
			}
		}
	};

	const isSettingsActive = location.pathname.includes("/settings");

	return (
		<header className="flex items-center gap-2 px-3 py-3 bg-kumo-base/95 backdrop-blur-md border-b border-kumo-line/70 sticky top-0 z-20 md:px-6 md:gap-4 shadow-xs">
			{/* Hamburger menu - mobile only */}
			<Button
				variant="ghost"
				shape="square"
				size="sm"
				icon={<ListIcon size={20} />}
				onClick={toggleSidebar}
				aria-label="Toggle sidebar"
				className="md:hidden shrink-0 hover:bg-kumo-tint/60 transition-colors"
			/>

			{/* Search - full on desktop, collapsible on mobile */}
			<div
				className={`flex-1 max-w-lg transition-all duration-300 flex items-center gap-1 ${
					isSearchExpanded
						? "absolute inset-x-0 top-0 h-full bg-kumo-base/98 px-3 z-30 flex"
						: "hidden md:flex"
				}`}
			>
				{isSearchExpanded && (
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<XIcon size={20} />}
						onClick={() => setIsSearchExpanded(false)}
						aria-label="Close search"
						className="md:hidden shrink-0 mr-1 hover:bg-kumo-tint/60 transition-colors"
					/>
				)}
				<div className="flex-1 relative flex items-center bg-kumo-tint/30 border border-kumo-line/40 hover:bg-kumo-tint/50 focus-within:bg-kumo-recessed focus-within:border-kumo-brand/60 focus-within:ring-2 focus-within:ring-kumo-brand/10 rounded-full px-3.5 py-1.5 transition-all shadow-xs">
					<MagnifyingGlassIcon size={18} className="text-kumo-subtle mr-2.5 shrink-0" />
					<input
						className="w-full bg-transparent border-0 outline-none focus:outline-none p-0 text-sm placeholder:text-kumo-subtle text-kumo-strong focus:ring-0"
						aria-label="Search emails"
						placeholder="Search emails... (e.g. is:unread, has:attachment)"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={clearSearch}
							className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-tint transition-all"
							aria-label="Clear search"
						>
							<XIcon size={14} />
						</button>
					)}
				</div>
				<Tooltip content="Search" side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						icon={<MagnifyingGlassIcon size={20} />}
						onClick={performSearch}
						aria-label="Search"
						className="hover:bg-kumo-tint/60 hover:scale-105 transition-all duration-150"
					/>
				</Tooltip>
			</div>

			{/* Search toggle button - mobile only, hidden when search is expanded */}
			{!isSearchExpanded && (
				<Button
					variant="ghost"
					shape="square"
					size="sm"
					icon={<MagnifyingGlassIcon size={20} />}
					onClick={() => setIsSearchExpanded(true)}
					aria-label="Search"
					className="md:hidden shrink-0 hover:bg-kumo-tint/60 transition-colors"
				/>
			)}

			<div className="flex items-center gap-1.5 ml-auto shrink-0">
				<Tooltip content={isAgentPanelOpen ? "Hide agent panel" : "Show agent panel"} side="bottom" asChild>
					<Button
						variant={isAgentPanelOpen ? "secondary" : "ghost"}
						shape="square"
						icon={<RobotIcon size={20} />}
						onClick={toggleAgentPanel}
						aria-label="Toggle agent panel"
						className="inline-flex hover:scale-105 transition-all duration-150"
					/>
				</Tooltip>
				<Tooltip content={theme === "dark" ? "Light mode" : "Dark mode"} side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						icon={theme === "dark" ? <SunIcon size={20} /> : <MoonIcon size={20} />}
						onClick={toggleTheme}
						aria-label="Toggle theme"
						className="hover:scale-105 transition-all duration-150"
					/>
				</Tooltip>
				<Tooltip content="Settings" side="bottom" asChild>
					<Button
						variant={isSettingsActive ? "secondary" : "ghost"}
						shape="square"
						icon={<GearSixIcon size={20} />}
						onClick={() =>
							navigate(
								isSettingsActive
									? `/mailbox/${mailboxId}/emails/inbox`
									: `/mailbox/${mailboxId}/settings`,
							)
						}
						aria-label="Settings"
						className="hover:scale-105 transition-all duration-150"
					/>
				</Tooltip>
			</div>
		</header>
	);
}
