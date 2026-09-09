export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-72 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-9 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
            <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
        </div>
    );
}