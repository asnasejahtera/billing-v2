import { Skeleton } from "@/components/ui/skeleton";

export default function NewCustomerLoading() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <Skeleton className="h-4 w-40" />

            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>

            <div className="grid gap-6 rounded-lg border p-6 lg:grid-cols-2">
                {Array.from({
                    length: 10,
                }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-10 w-full"
                    />
                ))}
            </div>
        </div>
    );
}