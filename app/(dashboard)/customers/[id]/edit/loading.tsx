import {
    Skeleton,
} from "@/components/ui/skeleton";

export default function EditCustomerLoading() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <Skeleton className="h-5 w-40" />

            <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-xl" />

                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>
            </div>

            <div className="grid gap-6 rounded-lg border p-4 sm:p-6 lg:grid-cols-2">
                {Array.from({
                    length: 2,
                }).map(
                    (_, section) => (
                        <div
                            key={
                                section
                            }
                            className="space-y-4"
                        >
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56" />

                            {Array.from({
                                length: 5,
                            }).map(
                                (
                                    _,
                                    index,
                                ) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="space-y-2"
                                    >
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-9 w-full" />
                                    </div>
                                ),
                            )}
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}