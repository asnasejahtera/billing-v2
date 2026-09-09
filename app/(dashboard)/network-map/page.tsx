import { NetworkGoogleMap } from "@/features/network-map/components/network-google-map";
import {
    getNetworkMapCreateOptionsService,
    listNetworkMapNodesService,
} from "@/features/network-map/services/network-topology-node.service";
import { listNetworkMapLinksService } from "@/features/network-map/services/network-topology-link.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
 * =========================
 * NETWORK MAP PAGE
 * =========================
 */
export default async function NetworkMapPage() {
    const [
        nodes,
        links,
        createOptions,
    ] = await Promise.all([
        listNetworkMapNodesService(),
        listNetworkMapLinksService(),
        getNetworkMapCreateOptionsService(),
    ]);

    console.log(
        "NETWORK MAP DB LINKS:",
        links,
    );

    return (
        <div>
            <NetworkGoogleMap
                initialNodes={nodes}
                initialLinks={links}
                createOptions={createOptions}
            />
        </div>
    );
}