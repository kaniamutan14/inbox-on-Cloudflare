// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Send emails via the SMTP2GO REST API.
 * Replaces the original Cloudflare Email Service binding (`env.EMAIL.send()`).
 *
 * API docs: https://apidocs.smtp2go.com/
 * Endpoint: POST https://api.smtp2go.com/v3/email/send
 */

export interface SendEmailParams {
	to: string | string[];
	from: string | { email: string; name: string };
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | { email: string; name: string };
	attachments?: {
		content: string; // base64 encoded
		filename: string;
		type: string;
		disposition: "attachment" | "inline";
		contentId?: string;
	}[];
	headers?: Record<string, string>;
}

export async function sendEmail(
	apiKey: string,
	params: SendEmailParams,
): Promise<{ messageId: string }> {
	const senderStr =
		typeof params.from === "string"
			? params.from
			: `${params.from.name} <${params.from.email}>`;

	const toArr = Array.isArray(params.to) ? params.to : [params.to];

	const body: Record<string, unknown> = {
		api_key: apiKey,
		sender: senderStr,
		to: toArr,
		subject: params.subject,
	};

	if (params.html) body.html_body = params.html;
	if (params.text) body.text_body = params.text;
	if (params.cc)
		body.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
	if (params.bcc)
		body.bcc = Array.isArray(params.bcc) ? params.bcc : [params.bcc];

	// Custom headers (In-Reply-To, References, etc.)
	if (params.headers && Object.keys(params.headers).length > 0) {
		body.custom_headers = Object.entries(params.headers).map(
			([header, value]) => ({ header, value }),
		);
	}

	// Attachments
	if (params.attachments && params.attachments.length > 0) {
		body.attachments = params.attachments.map((att) => ({
			filename: att.filename,
			fileblob: att.content,
			mimetype: att.type,
		}));
	}

	const response = await fetch("https://api.smtp2go.com/v3/email/send", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errBody = await response.text();
		throw new Error(`SMTP2GO error (${response.status}): ${errBody}`);
	}

	const result = (await response.json()) as {
		data?: { email_id?: string };
	};
	return { messageId: result.data?.email_id || crypto.randomUUID() };
}
