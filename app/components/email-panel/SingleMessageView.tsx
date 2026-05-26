// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import EmailAttachmentList from "~/components/EmailAttachmentList";
import EmailIframe from "~/components/EmailIframe";
import { formatDetailDate, rewriteInlineImages } from "~/lib/utils";
import type { Email } from "~/types";

interface SingleMessageViewProps {
	email: Email;
	mailboxId?: string;
	onPreviewImage: (url: string, filename: string) => void;
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

export default function SingleMessageView({
	email,
	mailboxId,
	onPreviewImage,
}: SingleMessageViewProps) {
	const senderName = email.sender.split("@")[0];
	return (
		<div className="flex flex-col h-full bg-kumo-surface/30">
			<div className="px-5 py-4.5 border-b border-kumo-line/60 md:px-6 bg-kumo-base/20">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-xs ${getAvatarColorClass(senderName)}`}>
							{getInitials(senderName)}
						</div>
						<div className="min-w-0">
							<div className="text-sm font-semibold text-kumo-strong truncate">
								{email.sender}
							</div>
							<div className="text-xs text-kumo-subtle mt-0.5">To: {email.recipient}</div>
						</div>
					</div>
					<span className="text-xs text-kumo-subtle font-medium shrink-0">
						{formatDetailDate(email.date)}
					</span>
				</div>
			</div>

			<div className="flex-1 min-h-0 px-5 py-5 md:px-6">
				<div className="rounded-2xl border border-kumo-line/30 bg-kumo-base/10 px-4 py-4 md:px-5 md:py-5 shadow-2xs h-full overflow-y-auto">
					<EmailIframe
						body={rewriteInlineImages(
							email.body || "",
							mailboxId || "",
							email.id,
							email.attachments,
						)}
					/>
				</div>
			</div>

			<EmailAttachmentList
				mailboxId={mailboxId}
				emailId={email.id}
				attachments={email.attachments}
				onPreviewImage={onPreviewImage}
				className="px-5 py-4 border-t border-kumo-line/60 shrink-0 md:px-6 bg-kumo-base/10"
				showHeading
			/>
		</div>
	);
}
