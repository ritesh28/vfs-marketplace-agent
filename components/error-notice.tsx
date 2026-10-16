import { Button } from "@/components/ui/button";

export function ErrorNotice({
	message,
	onRetry,
	retrying = false,
}: {
	message: string;
	onRetry?: () => void;
	retrying?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
			<p>{message}</p>
			{onRetry ? (
				<Button
					disabled={retrying}
					onClick={onRetry}
					size="xs"
					type="button"
					variant="outline"
				>
					Retry
				</Button>
			) : null}
		</div>
	);
}
