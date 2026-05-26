// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { PaperclipIcon, FileIcon, ImageIcon } from "@phosphor-icons/react";
import { formatBytes, getAttachmentUrl, getNonInlineAttachments } from "~/lib/utils";
import type { Attachment } from "~/types";

interface EmailAttachmentListProps {
	mailboxId?: string;
	emailId: string;
	attachments?: Attachment[];
	onPreviewImage?: (url: string, filename: string) => void;
	className?: string;
	showHeading?: boolean;
}

export default function EmailAttachmentList({
	mailboxId,
	emailId,
	attachments,
	onPreviewImage,
	className,
	showHeading = false,
}: EmailAttachmentListProps) {
	if (!mailboxId) return null;

	const files = getNonInlineAttachments(attachments);
	if (files.length === 0) return null;

	return (
		<div className={className}>
			{showHeading && (
				<div className="flex items-center gap-2 mb-3">
					<PaperclipIcon size={16} className="text-kumo-brand" />
					<span className="text-sm font-semibold text-kumo-strong">
						{files.length} attachment{files.length !== 1 ? "s" : ""}
					</span>
				</div>
			)}
			<div className="flex flex-wrap gap-2">
				{files.map((attachment) => {
					const url = getAttachmentUrl(mailboxId, emailId, attachment.id);
					const isImage = attachment.mimetype?.startsWith("image/");

					if (isImage && onPreviewImage) {
						return (
							<button
								key={attachment.id}
								type="button"
								onClick={() => onPreviewImage(url, attachment.filename)}
								className="flex items-center gap-2.5 rounded-full border border-kumo-line/60 bg-kumo-base/40 px-4 py-2 hover:bg-kumo-tint/60 hover:border-kumo-brand/60 hover:scale-[1.02] shadow-2xs hover:shadow-xs transition-all duration-150 text-sm text-left cursor-pointer"
							>
								<ImageIcon size={16} className="text-kumo-brand shrink-0" />
								<span className="text-kumo-strong font-medium truncate max-w-[160px]">
									{attachment.filename}
								</span>
								<span className="text-xs text-kumo-subtle font-medium">{formatBytes(attachment.size)}</span>
							</button>
						);
					}

					return (
						<a
							key={attachment.id}
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2.5 rounded-full border border-kumo-line/60 bg-kumo-base/40 px-4 py-2 hover:bg-kumo-tint/60 hover:border-kumo-brand/60 hover:scale-[1.02] shadow-2xs hover:shadow-xs transition-all duration-150 text-sm no-underline"
						>
							<FileIcon size={16} className="text-kumo-subtle shrink-0" />
							<span className="text-kumo-strong font-medium truncate max-w-[160px]">
								{attachment.filename}
							</span>
							<span className="text-xs text-kumo-subtle font-medium">{formatBytes(attachment.size)}</span>
						</a>
					);
				})}
			</div>
		</div>
	);
}
