// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Banner, Button, Dialog, Input, Text } from "@cloudflare/kumo";
import { FloppyDiskIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";
import { useUIStore } from "~/hooks/useUIStore";

export default function ComposeEmail() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	
	const { isComposeModalOpen, closeComposeModal } = useUIStore();

	const {
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
	} = useComposeForm(mailboxId, folder);

	return (
		<Dialog.Root
			open={isComposeModalOpen}
			onOpenChange={(open) => !open && !isSending && closeComposeModal()}
		>
			<Dialog size="lg" className="p-6 max-h-[90vh] overflow-y-auto rounded-2xl border border-kumo-line/40 bg-kumo-base shadow-2xl animate-fade-in">
				<Dialog.Title className="text-lg font-bold mb-5 text-kumo-strong">
					{formTitle}
				</Dialog.Title>
				<form onSubmit={(e) => handleSend(e, closeComposeModal)} className="space-y-4">
					{error && <Banner variant="error" text={error} />}
					<div className="flex items-end gap-3">
						<div className="flex-1">
							<Input
								label="To"
								type="text"
								placeholder="recipient@example.com, another@example.com"
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
								className="shrink-0 text-xs text-kumo-brand hover:underline font-semibold mb-2.5"
							>
								CC/BCC
							</button>
						)}
					</div>
					{showCcBcc && (
						<div className="animate-fade-in">
							<Input
								label="CC"
								type="text"
								size="sm"
								value={cc}
								onChange={(e) => setCc(e.target.value)}
								placeholder="Separate multiple addresses with commas"
								className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150"
							/>
						</div>
					)}
					{showCcBcc && (
						<div className="animate-fade-in">
							<Input
								label="BCC"
								type="text"
								size="sm"
								value={bcc}
								onChange={(e) => setBcc(e.target.value)}
								placeholder="Separate multiple addresses with commas"
								className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150"
							/>
						</div>
					)}
					<Input
						label="Subject"
						type="text"
						placeholder="Email subject"
						size="sm"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						required
						className="w-full focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150 font-semibold"
					/>
					<div>
						<Text size="sm" DANGEROUS_className="font-semibold text-kumo-subtle mb-1.5 block">
							Message
						</Text>
						<div className="border border-kumo-line/60 rounded-xl overflow-hidden bg-kumo-base shadow-2xs focus-within:border-kumo-brand/60 focus-within:ring-2 focus-within:ring-kumo-brand/10 transition-all duration-150">
							<RichTextEditor value={body} onChange={setBody} />
						</div>
					</div>
					<div className="flex justify-between items-center pt-3 border-t border-kumo-line/40 mt-6">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={closeComposeModal}
							disabled={isSending}
							className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
						>
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
				</form>
			</Dialog>
		</Dialog.Root>
	);
}
