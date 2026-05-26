// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Banner, Button, Input } from "@cloudflare/kumo";
import { FloppyDiskIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";

export default function ComposePanel() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();

	const {
		from,
		setFrom,
		to,
		setTo,
		cc,
		setCc,
		bcc,
		setBcc,
		showCcBcc,
		setShowCcBcc,
		subject,
		setSubject,
		body,
		setBody,
		error,
		isSavingDraft,
		isSending,
		formTitle,
		handleSaveDraft,
		handleSend,
		closeCompose,
		closePanel,
	} = useComposeForm(mailboxId, folder);

	return (
		<div className="flex flex-col h-full bg-kumo-surface animate-fade-in">
			<div className="flex items-center justify-between px-5 py-4 border-b border-kumo-line/60 shrink-0 md:px-6 bg-kumo-base/20 shadow-xs">
				<h2 className="text-base font-bold text-kumo-strong">
					{formTitle}
				</h2>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<XIcon size={18} />}
						onClick={closeCompose}
						disabled={isSending}
						aria-label="Close compose"
						className="hover:bg-kumo-tint/60 text-kumo-subtle transition-colors"
					/>
				</div>
			</div>

			<form
				onSubmit={(e) => handleSend(e, closePanel)}
				className="flex flex-col flex-1 min-h-0 overflow-y-auto"
			>
				<div className="p-5 md:p-6 space-y-5">
					{error && <Banner variant="error" text={error} />}

					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<label className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle w-16 shrink-0">
								From
							</label>
							<div className="flex-1">
								<Input
									type="email"
									placeholder="sender@yourdomain.com"
									size="sm"
									value={from}
									onChange={(e) => setFrom(e.target.value)}
									required
									className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150"
								/>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<label className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle w-16 shrink-0">
								To
							</label>
							<div className="flex-1 flex items-center gap-3 min-w-0">
								<div className="flex-1">
									<Input
										type="text"
										placeholder="recipient@example.com"
										size="sm"
										value={to}
										onChange={(e) => setTo(e.target.value)}
										required
										className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150"
									/>
								</div>
								{!showCcBcc && (
									<button
										type="button"
										onClick={() => setShowCcBcc(true)}
										className="shrink-0 text-xs text-kumo-brand hover:underline font-semibold"
									>
										CC/BCC
									</button>
								)}
							</div>
						</div>

						{showCcBcc && (
							<div className="flex items-center gap-3 animate-fade-in">
								<label className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle w-16 shrink-0">
									CC
								</label>
								<div className="flex-1">
									<Input
										type="text"
										size="sm"
										value={cc}
										onChange={(e) => setCc(e.target.value)}
										placeholder="Separate multiple addresses with commas"
										className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150"
									/>
								</div>
							</div>
						)}

						{showCcBcc && (
							<div className="flex items-center gap-3 animate-fade-in">
								<label className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle w-16 shrink-0">
									BCC
								</label>
								<div className="flex-1">
									<Input
										type="text"
										size="sm"
										value={bcc}
										onChange={(e) => setBcc(e.target.value)}
										placeholder="Separate multiple addresses with commas"
										className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150"
									/>
								</div>
							</div>
						)}

						<div className="flex items-center gap-3">
							<label className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle w-16 shrink-0">
								Subject
							</label>
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Email subject"
									size="sm"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									required
									className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150 font-medium"
								/>
							</div>
						</div>
					</div>

					<div className="border border-kumo-line/60 rounded-xl overflow-hidden bg-kumo-base shadow-2xs focus-within:border-kumo-brand/60 focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150">
						<RichTextEditor
							value={body}
							onChange={setBody}
						/>
					</div>
				</div>

				{/* Footer actions */}
				<div className="mt-auto px-5 py-4 border-t border-kumo-line/60 bg-kumo-base/80 shrink-0 md:px-6 shadow-xs">
					<div className="flex items-center justify-between">
						<Button type="button" variant="ghost" size="sm" onClick={closeCompose} disabled={isSending} className="hover:bg-red-500/10 hover:text-red-500 transition-colors">
							Discard
						</Button>
						<div className="flex items-center gap-2.5">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								loading={isSavingDraft}
								disabled={isSending}
								icon={<FloppyDiskIcon size={14} />}
								onClick={handleSaveDraft}
								className="hover:scale-102 transition-transform"
							>
								{isSavingDraft ? "Saving..." : "Save Draft"}
							</Button>
							<Button
								type="submit"
								variant="primary"
								size="sm"
								loading={isSending}
								disabled={isSavingDraft || isSending}
								icon={<PaperPlaneTiltIcon size={14} />}
								className="hover:scale-102 transition-transform bg-gradient-to-r from-blue-600 to-blue-500 shadow-xs"
							>
								{isSending ? "Sending..." : "Send"}
							</Button>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
