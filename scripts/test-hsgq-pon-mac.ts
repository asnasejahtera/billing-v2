import { HsgqWebClient } from "../services/olt/hsgq/web-client";

const client = new HsgqWebClient({
  baseUrl: "http://103.71.162.21:8080",
  username: "root",
  password: "kmzwa88saa",
  timeout: 15_000,
});

async function main() {
  console.log("=== PON MAC TABLE ===");

  const rows = await client.getPonMacTable();

  console.log("Raw:");
  console.dir(rows, {
    depth: null,
  });

  console.log("\nTotal:", rows.length);

  console.log("\n=== TABLE ===");

  console.table(
    rows.map((row) => ({
      MAC: row.macaddr,
      VLAN: row.vlan_id,
      PON: row.port_id,
      ONU: row.onu_id,
      Name: row.onu_name,
      Type: row.mac_type,
    })),
  );
}

main().catch((error) => {
  console.error("\n=== ERROR ===");
  console.error(error);
});