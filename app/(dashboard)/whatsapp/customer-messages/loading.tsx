/**
 * ============================================
 * CUSTOMER MESSAGE LOADING
 * ============================================
 */
export default function CustomerMessagesLoading() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-72 animate-pulse rounded bg-muted" />
            </div>

            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />

            <div className="overflow-hidden rounded-lg border">
                {Array.from({
                    length: 8,
                }).map(
                    (
                        _,
                        index,
                    ) => (
                        <div
                            key={
                                index
                            }
                            className="flex gap-4 border-b p-4 last:border-0"
                        >
                            <div className="size-4 animate-pulse rounded bg-muted" />
                            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}