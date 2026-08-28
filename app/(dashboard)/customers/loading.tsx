import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <div className="flex justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>

                <Skeleton className="h-9 w-72" />
            </div>

            <Skeleton className="h-16 rounded-lg" />

            <div className="space-y-2 rounded-lg border p-4">
                {Array.from({
                    length: 8,
                }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-14 w-full"
                    />
                ))}
            </div>
        </div>
    );
}