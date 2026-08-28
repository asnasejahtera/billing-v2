import { logoutAction } from "@/features/auth/actions/logout.action";
import { LogoutSubmitButton } from "@/features/auth/components/logout-submit-button";

export function LogoutButton() {
    return (
        <form action={logoutAction}>
            <LogoutSubmitButton />
        </form>
    );
}