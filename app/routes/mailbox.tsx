// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useRef } from "react";
import { Outlet, useParams } from "react-router";
import AgentSidebar from "~/components/AgentSidebar";
import ComposeEmail from "~/components/ComposeEmail";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import { useMailbox } from "~/queries/mailboxes";
import { useUIStore } from "~/hooks/useUIStore";

export default function MailboxRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	// Prefetch mailbox data for child components
	useMailbox(mailboxId);
	const prevMailboxIdRef = useRef<string | undefined>(undefined);
	const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
	const closeSidebar = useUIStore((state) => state.closeSidebar);
	const isAgentPanelOpen = useUIStore((state) => state.isAgentPanelOpen);
	const closeAgentPanel = useUIStore((state) => state.closeAgentPanel);
	const closePanel = useUIStore((state) => state.closePanel);
	const closeComposeModal = useUIStore((state) => state.closeComposeModal);

	useEffect(() => {
		if (
			prevMailboxIdRef.current &&
			mailboxId &&
			prevMailboxIdRef.current !== mailboxId
		) {
			closeAgentPanel();
			closePanel();
			closeComposeModal();
			closeSidebar();
		}

		prevMailboxIdRef.current = mailboxId;
	}, [mailboxId, closeComposeModal, closePanel, closeSidebar, closeAgentPanel]);

	useEffect(() => {
		if (isAgentPanelOpen && window.innerWidth < 1280) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, [isAgentPanelOpen]);

	return (
		<div className="flex h-screen overflow-hidden">
			{/* Mobile sidebar overlay backdrop */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/30 md:hidden"
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
					role="button"
					tabIndex={-1}
					aria-label="Close sidebar"
				/>
			)}

			{/* Agent panel overlay backdrop for mobile */}
			{isAgentPanelOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/30 xl:hidden"
					onClick={closeAgentPanel}
					onKeyDown={(e) => e.key === "Escape" && closeAgentPanel()}
					role="button"
					tabIndex={0}
					aria-label="Close agent panel"
				/>
			)}

			{/* Sidebar: hidden on mobile by default, shown as overlay when open */}
			<div
				className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:z-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<Sidebar />
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0 bg-kumo-base">
				<Header />
				<main className="flex-1 overflow-hidden">
					<Outlet />
				</main>
			</div>

			{/* Agent + MCP sidebar -- persistent on desktop, drawer on mobile */}
			<div
				className={`fixed inset-y-0 right-0 z-40 w-[90%] max-w-[380px] transform transition-transform duration-200 ease-in-out border-l border-kumo-line bg-kumo-base flex flex-col overflow-hidden xl:relative xl:translate-x-0 xl:z-0 xl:w-[380px] ${
					isAgentPanelOpen ? "translate-x-0" : "translate-x-full xl:hidden"
				}`}
			>
				<AgentSidebar />
			</div>

			<ComposeEmail />
		</div>
	);
}
