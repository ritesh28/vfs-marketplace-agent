"use client";

import { useEffect } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/error-messages";

export default function RouteError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		void fetch("/api/client-error", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: error.message,
				stack: error.stack,
				digest: error.digest,
			}),
		});
	}, [error]);

	return (
		<div className="flex h-svh items-center justify-center p-6">
			<ErrorNotice message={UNEXPECTED_ERROR_MESSAGE} onRetry={reset} />
		</div>
	);
}
