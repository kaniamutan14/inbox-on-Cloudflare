// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

interface EmailPanelHeaderProps {
	subject: string;
	messageCount: number;
	showThreadCount: boolean;
}

export default function EmailPanelHeader({
	subject,
	messageCount,
	showThreadCount,
}: EmailPanelHeaderProps) {
	return (
		<div className="px-5 py-4 border-b border-kumo-line/60 shrink-0 md:px-6 bg-kumo-base/30">
			<div className="flex items-start justify-between gap-3">
				<h2 className="text-base md:text-lg font-bold text-kumo-strong tracking-tight leading-tight flex-1">
					{subject}
				</h2>
				{showThreadCount && (
					<span className="shrink-0 text-xs font-semibold text-kumo-brand bg-kumo-brand/10 dark:bg-kumo-brand/20 px-2 py-0.5 rounded-full">
						{messageCount} messages
					</span>
				)}
			</div>
		</div>
	);
}
