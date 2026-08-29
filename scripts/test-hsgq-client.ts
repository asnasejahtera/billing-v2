import { HsgqWebClient } from "../services/olt/hsgq/web-client";

const client =
  new HsgqWebClient({
    baseUrl:
      "http://103.71.162.21:8080",
    username: "root",
    password:"kmzwa88saa",
    timeout: 10_000,
  });

async function main() {
  console.log(
    "=== LOGIN ===",
  );

  await client.login();

  console.log(
    "Login berhasil",
  );

  console.log(
    "\n=== CURRENT USER ===",
  );

  const user =
    await client.getCurrentUser();

  console.log(user);

  console.log(
    "\n=== PON 1 ===",
  );

  const pon1 =
    await client.getOnusByPort(1);

  console.log(
    "Total ONU PON 1:",
    pon1.length,
  );

  console.table(
    pon1.slice(0, 5).map(
      (onu) => ({
        ONU:
          `${onu.port_id}/${onu.onu_id}`,
        Name:
          onu.onu_name,
        Status:
          onu.status,
        RX:
          onu.receive_power,
        Distance:
          onu.distance,
      }),
    ),
  );

  console.log(
    "\n=== ALL ONU ===",
  );

  const allOnus =
    await client.getAllOnus(4);

  console.log(
    "Total ONU:",
    allOnus.length,
  );

  console.log(
    "Online:",
    allOnus.filter(
      (onu) =>
        onu.status.toLowerCase() ===
        "online",
    ).length,
  );

  console.log(
    "Offline:",
    allOnus.filter(
      (onu) =>
        onu.status.toLowerCase() !==
        "online",
    ).length,
  );
}

main().catch(
  (error) => {
    console.error(
      "\n=== ERROR ===",
    );

    console.error(error);
  },
);