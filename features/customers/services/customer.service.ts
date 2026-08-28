import {
  listCustomerPlanOptions,
  listCustomers,
} from "@/features/customers/repositories/customer.repository";
import {
  parseCustomerListQuery,
  type CustomerListSearchParams,
} from "@/features/customers/schemas/customer-list.schema";
import {
  createCustomer,
  findCustomerByRouterUsername,
  findInternetPlanForCustomer,
} from "@/features/customers/repositories/customer.repository";

import {
  findRouterConnectionById,
} from "@/features/routers/repositories/router.repository";
import {
  decryptRouterPassword,
} from "@/features/routers/services/router-credential.service";

import {
  createMikroTikClient,
} from "@/services/mikrotik/client";
import {
  createMikroTikPppSecret,
} from "@/services/mikrotik/resources/ppp-secret/create";

import {
  removeMikroTikPppSecret,
} from "@/services/mikrotik/resources/ppp-secret/remove";

import type { CreateCustomerInput } from "@/features/customers/schemas/create-customer.schema";

import type { UpdateCustomerInput } from "@/features/customers/schemas/update-customer.schema";

import {
  findCustomerByRouterUsernameExceptId,
  findCustomerForEdit,
  updateCustomer,
} from "@/features/customers/repositories/customer.repository";

import {
  findMikroTikPppSecretById,
  findMikroTikPppSecretByName,
} from "@/services/mikrotik/resources/ppp-secret/find";

import {
  updateMikroTikPppSecret,
} from "@/services/mikrotik/resources/ppp-secret/update";

import { updateCustomerStatus } from "@/features/customers/repositories/customer.repository";
import { findMikroTikPppProfileByName } from "@/services/mikrotik/resources/ppp-profile/find";
import { setMikroTikPppSecretProfile } from "@/services/mikrotik/resources/ppp-secret/set-profile";

const ISOLATION_PROFILE =
  "ISOLIR";

export async function isolateCustomerService(
  customerId: number,
) {
  const customer =
    await findCustomerForEdit(
      customerId,
    );

  if (!customer) {
    throw new CustomerServiceError(
      "Customer tidak ditemukan",
    );
  }

  const router =
    await findRouterConnectionById(
      customer.routerId,
    );

  if (!router) {
    throw new CustomerServiceError(
      "Router Customer tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new CustomerServiceError(
      "Router Customer sedang nonaktif",
    );
  }

  const routerPassword =
    decryptRouterPassword(
      router.passwordEncrypted,
    );

  const client =
    createMikroTikClient({
      host:
        router.host,

      port:
        router.port,

      username:
        router.username,

      password:
        routerPassword,

      useTls:
        router.useHttps,

      timeout: 15,
    });

  try {
    await client.connect();

    /**
     * Pastikan profile isolir
     * sudah tersedia pada router.
     */
    const isolationProfile =
      await findMikroTikPppProfileByName(
        client,
        ISOLATION_PROFILE,
      );

    if (!isolationProfile) {
      throw new CustomerServiceError(
        'PPP Profile "isolir" belum tersedia pada router',
      );
    }

    /**
     * Cari Secret berdasarkan
     * mikrotikRef terlebih dahulu.
     */
    let secret =
      customer.mikrotikRef
        ? await findMikroTikPppSecretById(
            client,
            customer.mikrotikRef,
          )
        : null;

    /**
     * Fallback berdasarkan
     * username jika mikrotikRef
     * belum tersedia.
     */
    if (!secret) {
      secret =
        await findMikroTikPppSecretByName(
          client,
          customer.pppoeUsername,
        );
    }

    if (
      !secret ||
      !secret[".id"]
    ) {
      throw new CustomerServiceError(
        "PPP Secret Customer tidak ditemukan di MikroTik",
      );
    }

    const secretId =
      secret[".id"];

    /**
     * Simpan profile yang sedang
     * digunakan untuk rollback.
     *
     * Prioritas profile MikroTik.
     */
    const previousProfile =
      secret.profile ||
      customer.pppProfileName;

    /**
     * ==========================================
     * MIKROTIK
     * ==========================================
     *
     * HANYA profile yang diubah.
     */
    try {
      await setMikroTikPppSecretProfile(
        client,
        secretId,
        ISOLATION_PROFILE,
      );
    } catch (error) {
      console.error(
        `Isolir PPP Secret ${secretId}:`,
        error instanceof Error
          ? error.message
          : error,
      );

      throw new CustomerServiceError(
        "Gagal mengubah PPP Profile Customer menjadi isolir",
      );
    }

    /**
     * ==========================================
     * DATABASE
     * ==========================================
     *
     * HANYA status yang diubah.
     *
     * pppProfileName tetap profile paket asli.
     * internetPlanId juga tidak berubah.
     */
    try {
      const updated =
        await updateCustomerStatus(
          customer.id,
          "SUSPENDED",
        );

      if (!updated) {
        throw new Error(
          "Database tidak mengembalikan Customer",
        );
      }

      return updated;
    } catch (databaseError) {
      /**
       * Database gagal setelah
       * MikroTik berhasil.
       *
       * Kembalikan profile MikroTik
       * ke profile sebelumnya.
       */
      try {
        await setMikroTikPppSecretProfile(
          client,
          secretId,
          previousProfile,
        );
      } catch (
        rollbackError
      ) {
        console.error(
          `Rollback Isolir ${secretId}:`,
          rollbackError instanceof
          Error
            ? rollbackError.message
            : rollbackError,
        );

        throw new CustomerServiceError(
          "Status database gagal diubah dan rollback profile MikroTik juga gagal. Periksa PPP Secret Customer.",
        );
      }

      console.error(
        "Update status Customer:",
        databaseError instanceof
        Error
          ? databaseError.message
          : databaseError,
      );

      throw new CustomerServiceError(
        "Customer gagal diisolir. Profile MikroTik sudah dikembalikan.",
      );
    }
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      throw error;
    }

    console.error(
      `Isolir Customer ${customerId}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new CustomerServiceError(
      "Gagal melakukan isolir Customer",
    );
  } finally {
    await client
      .close()
      .catch(
        () => undefined,
      );
  }
}

export async function listCustomersService(
  params: CustomerListSearchParams,
) {
  const query =
    parseCustomerListQuery(
      params,
    );

  const result =
    await listCustomers(query);

  return {
    ...result,
    ...query,
    totalPages: Math.max(
      1,
      Math.ceil(
        result.total /
          query.pageSize,
      ),
    ),
  };
}

export async function listCustomerPlanOptionsService() {
  return listCustomerPlanOptions();
}

export class CustomerServiceError extends Error {
  constructor(
    message: string,
    public readonly field?:
      | "name"
      | "routerId"
      | "internetPlanId"
      | "pppoeUsername"
      | "pppoePassword",
  ) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

export async function createCustomerService(
  input: CreateCustomerInput,
) {
  /*
   * 1. Cek duplicate database.
   */
  const existing =
    await findCustomerByRouterUsername(
      input.routerId,
      input.pppoeUsername,
    );

  if (existing) {
    throw new CustomerServiceError(
      "PPPoE User sudah digunakan Customer pada router ini",
      "pppoeUsername",
    );
  }

  /*
   * 2. Paket harus milik router
   *    yang sedang dipilih.
   */
  const plan =
    await findInternetPlanForCustomer(
      input.internetPlanId,
      input.routerId,
    );

  if (!plan) {
    throw new CustomerServiceError(
      "Paket Internet tidak ditemukan pada router yang dipilih",
      "internetPlanId",
    );
  }

  if (plan.status !== "ACTIVE") {
    throw new CustomerServiceError(
      "Paket Internet sedang tidak aktif",
      "internetPlanId",
    );
  }

  /*
   * 3. Ambil credential Router.
   */
  const router =
    await findRouterConnectionById(
      input.routerId,
    );

  if (!router) {
    throw new CustomerServiceError(
      "Router tidak ditemukan",
      "routerId",
    );
  }

  if (!router.isActive) {
    throw new CustomerServiceError(
      "Router sedang nonaktif",
      "routerId",
    );
  }
  

  const routerPassword =
    decryptRouterPassword(
      router.passwordEncrypted,
    );

  const client =
    createMikroTikClient({
      host: router.host,
      port: router.port,
      username:
        router.username,
      password:
        routerPassword,
      useTls:
        router.useHttps,
      timeout: 15,
    });

  let createdSecretId:
    | string
    | null = null;

  try {
    /*
     * 4. Connect MikroTik.
     */
    await client.connect();

    /*
     * 5. Username juga harus unique
     *    pada PPP Secret Router.
     */
    const existingSecret =
      await findMikroTikPppSecretByName(
        client,
        input.pppoeUsername,
      );

    if (existingSecret) {
      throw new CustomerServiceError(
        "PPPoE User sudah digunakan di MikroTik",
        "pppoeUsername",
      );
    }

    /*
     * 6. CREATE PPP SECRET.
     */
    const secret =
      await createMikroTikPppSecret(
        client,
        {
          name:
            input.pppoeUsername,

          password:
            input.pppoePassword,

          /*
           * PPP Profile otomatis
           * mengikuti Internet Plan.
           */
          profile:
            plan.pppProfileName,

          /*
           * Nama Customer masuk
           * comment PPP Secret.
           */
          comment:
            input.name,

          localAddress:
            input.localAddress,

          remoteAddress:
            input.remoteAddress,

          service:
            "pppoe",

          disabled:
            input.status !==
            "ACTIVE",
        },
      );

    if (!secret[".id"]) {
      throw new CustomerServiceError(
        "PPP Secret dibuat tetapi ID MikroTik tidak ditemukan",
      );
    }

    createdSecretId =
      secret[".id"];

      
    /*
     * 7. Setelah PPP Secret benar-benar
     *    berhasil, simpan Customer Neon.
     */
    try {
      const customer =
        await createCustomer({
          name:
            input.name,

          phone:
            input.phone,

          routerId:
            input.routerId,

          internetPlanId:
            plan.id,

          pppoeUsername:
            input.pppoeUsername,

          /*
           * Plain text sesuai
           * requirement project.
           */
          pppoePassword:
            input.pppoePassword,

          pppProfileName:
            plan.pppProfileName,

          address:
            input.address,

          localAddress:
            input.localAddress,

          remoteAddress:
            input.remoteAddress,

          cpeBrand:
            input.cpeBrand,

          ontSerialNumber:
            input.ontSerialNumber,

          detail:
            input.detail,

          status:
            input.status,
          
          mikrotikRef:
            createdSecretId,
        });

      if (!customer) {
        throw new Error(
          "Database tidak mengembalikan Customer",
        );
      }

      return {
        ...customer,
        mikrotikRef:
          createdSecretId,
      };
    } catch (databaseError) {
      /*
       * COMPENSATING ROLLBACK
       *
       * MikroTik sudah berhasil tetapi
       * Neon gagal -> hapus secret yang
       * baru dibuat.
       */
      if (createdSecretId) {
        await removeMikroTikPppSecret(
          client,
          createdSecretId,
        ).catch(
          (rollbackError) => {
            console.error(
              "Rollback PPP Secret gagal:",
              rollbackError,
            );
          },
        );
      }

      console.error(
        "Create Customer DB:",
        databaseError,
      );

      throw new CustomerServiceError(
        "Customer gagal disimpan ke database. PPP Secret baru dibatalkan.",
      );
    }
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      throw error;
    }

    console.error(
      `Create Customer MikroTik ${input.routerId}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new CustomerServiceError(
      "Gagal membuat PPP Secret di MikroTik",
    );
  } finally {
    await client
      .close()
      .catch(() => undefined);
  }
}

export async function updateCustomerService(
  input: UpdateCustomerInput,
) {
  const current =
    await findCustomerForEdit(
      input.id,
    );

  if (!current) {
    throw new CustomerServiceError(
      "Customer tidak ditemukan",
    );
  }

  /**
   * Router tidak dapat dipindahkan
   * melalui Edit Customer.
   */
  const router =
    await findRouterConnectionById(
      current.routerId,
    );

  if (!router) {
    throw new CustomerServiceError(
      "Router Customer tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new CustomerServiceError(
      "Router Customer sedang nonaktif",
    );
  }

  /**
   * Paket baru harus berasal
   * dari Router Customer yang sama.
   */
  const plan =
    await findInternetPlanForCustomer(
      input.internetPlanId,
      current.routerId,
    );

  if (!plan) {
    throw new CustomerServiceError(
      "Paket Internet tidak ditemukan pada Router Customer",
      "internetPlanId",
    );
  }

  if (
    plan.status !==
    "ACTIVE"
  ) {
    throw new CustomerServiceError(
      "Paket Internet sedang tidak aktif",
      "internetPlanId",
    );
  }

  /**
   * Cek duplicate username DB.
   */
  const duplicateCustomer =
    await findCustomerByRouterUsernameExceptId(
      current.routerId,
      input.pppoeUsername,
      current.id,
    );

  if (duplicateCustomer) {
    throw new CustomerServiceError(
      "PPPoE User sudah digunakan Customer lain",
      "pppoeUsername",
    );
  }

  const routerPassword =
    decryptRouterPassword(
      router.passwordEncrypted,
    );

  const client =
    createMikroTikClient({
      host:
        router.host,

      port:
        router.port,

      username:
        router.username,

      password:
        routerPassword,

      useTls:
        router.useHttps,

      timeout: 15,
    });

  try {
    await client.connect();

    /**
     * Cari PPP Secret lama.
     *
     * Prioritas menggunakan .id
     * karena username bisa diubah.
     */
    let currentSecret =
      current.mikrotikRef
        ? await findMikroTikPppSecretById(
            client,
            current.mikrotikRef,
          )
        : null;

    if (!currentSecret) {
      currentSecret =
        await findMikroTikPppSecretByName(
          client,
          current.pppoeUsername,
        );
    }

    if (
      !currentSecret ||
      !currentSecret[".id"]
    ) {
      throw new CustomerServiceError(
        "PPP Secret Customer tidak ditemukan di MikroTik",
        "pppoeUsername",
      );
    }

    const secretId =
      currentSecret[".id"];

    /**
     * Jika username berubah,
     * pastikan username baru
     * tidak dipakai secret lain.
     */
    if (
      input.pppoeUsername !==
      current.pppoeUsername
    ) {
      const duplicateSecret =
        await findMikroTikPppSecretByName(
          client,
          input.pppoeUsername,
        );

      if (
        duplicateSecret &&
        duplicateSecret[".id"] !==
          secretId
      ) {
        throw new CustomerServiceError(
          "PPPoE User sudah digunakan di MikroTik",
          "pppoeUsername",
        );
      }
    }

    /**
     * Snapshot PPP Secret lama.
     * Digunakan jika database gagal.
     */
    const previousSecret = {
      id:
        secretId,

      name:
        currentSecret.name ??
        current.pppoeUsername,

      password:
        currentSecret.password ??
        current.pppoePassword,

      profile:
        currentSecret.profile ??
        current.pppProfileName,

      comment:
        currentSecret.comment ??
        current.name,

      localAddress:
        currentSecret[
          "local-address"
        ]?.trim() ||
        null,

      remoteAddress:
        currentSecret[
          "remote-address"
        ]?.trim() ||
        null,

      disabled:
        currentSecret.disabled ===
        "true" ||
        currentSecret.disabled ===
        "yes",
    };

    const targetMikroTikProfile =
      current.status ===
      "SUSPENDED"
        ? "ISOLIR"
        : plan.pppProfileName;
    /**
     * ============================================
     * UPDATE MIKROTIK
     * ============================================
     */
    try {
      await updateMikroTikPppSecret(
        client,
        {
          id:
            secretId,

          name:
            input.pppoeUsername,

          password:
            input.pppoePassword,

          profile:
            targetMikroTikProfile,

          /**
           * Nama Customer disimpan
           * sebagai comment PPP Secret.
           */
          comment:
            input.name,

          localAddress:
            input.localAddress,

          remoteAddress:
            input.remoteAddress,

          disabled:
            current.status ===
            "INACTIVE",
        },
      );
    } catch (error) {
       const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Update PPP Secret ${secretId}:`,
        message,
      );

      throw new CustomerServiceError(
        `Gagal memperbarui PPP Secret di MikroTik: ${message}`,
      );
    }

    /**
     * ============================================
     * UPDATE DATABASE
     * ============================================
     */
    try {
      const customer =
        await updateCustomer({
          id:
            current.id,

          name:
            input.name,

          phone:
            input.phone,

          internetPlanId:
            plan.id,

          pppoeUsername:
            input.pppoeUsername,

          pppoePassword:
            input.pppoePassword,

          pppProfileName:
            plan.pppProfileName,

          address:
            input.address,

          localAddress:
            input.localAddress,

          remoteAddress:
            input.remoteAddress,

          cpeBrand:
            input.cpeBrand,

          ontSerialNumber:
            input.ontSerialNumber,

          status:
            input.status,

          detail:
            input.detail,

          mikrotikRef:
            secretId,
        });

      if (!customer) {
        throw new Error(
          "Database tidak mengembalikan Customer",
        );
      }

      return customer;
    } catch (databaseError) {
      /**
       * MikroTik berhasil,
       * DB gagal.
       *
       * Kembalikan PPP Secret
       * ke konfigurasi sebelumnya.
       */
      try {
        await updateMikroTikPppSecret(
          client,
          previousSecret,
        );
      } catch (rollbackError) {
        console.error(
          `Rollback Edit PPP Secret ${secretId} gagal:`,
          rollbackError instanceof Error
            ? rollbackError.message
            : rollbackError,
        );

        throw new CustomerServiceError(
          "Database gagal diperbarui dan rollback MikroTik juga gagal. Periksa PPP Secret Customer.",
        );
      }

      console.error(
        "Update Customer database:",
        databaseError instanceof Error
          ? databaseError.message
          : databaseError,
      );

      throw new CustomerServiceError(
        "Customer gagal diperbarui. Perubahan PPP Secret sudah dikembalikan.",
      );
    }
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      throw error;
    }

    console.error(
      `Edit Customer ${input.id}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new CustomerServiceError(
      "Gagal memperbarui Customer",
    );
  } finally {
    await client
      .close()
      .catch(() => undefined);
  }
}

export async function restoreCustomerService(
  customerId: number,
) {
  const customer =
    await findCustomerForEdit(
      customerId,
    );

  if (!customer) {
    throw new CustomerServiceError(
      "Customer tidak ditemukan",
    );
  }

  if (
    customer.status !==
    "SUSPENDED"
  ) {
    throw new CustomerServiceError(
      "Customer tidak sedang dalam status Suspend",
    );
  }

  if (
    !customer.pppProfileName
      ?.trim()
  ) {
    throw new CustomerServiceError(
      "PPP Profile asli Customer tidak ditemukan di database",
    );
  }

  const router =
    await findRouterConnectionById(
      customer.routerId,
    );

  if (!router) {
    throw new CustomerServiceError(
      "Router Customer tidak ditemukan",
    );
  }

  if (!router.isActive) {
    throw new CustomerServiceError(
      "Router Customer sedang nonaktif",
    );
  }

  const routerPassword =
    decryptRouterPassword(
      router.passwordEncrypted,
    );

  const client =
    createMikroTikClient({
      host:
        router.host,

      port:
        router.port,

      username:
        router.username,

      password:
        routerPassword,

      useTls:
        router.useHttps,

      timeout: 15,
    });

  try {
    await client.connect();

    /**
     * Pastikan profile asli
     * memang masih tersedia
     * pada router.
     */
    const originalProfile =
      await findMikroTikPppProfileByName(
        client,
        customer.pppProfileName,
      );

    if (!originalProfile) {
      throw new CustomerServiceError(
        `PPP Profile "${customer.pppProfileName}" tidak ditemukan pada router`,
      );
    }

    /**
     * Cari PPP Secret.
     *
     * Prioritas menggunakan
     * mikrotikRef.
     */
    let secret =
      customer.mikrotikRef
        ? await findMikroTikPppSecretById(
            client,
            customer.mikrotikRef,
          )
        : null;

    if (!secret) {
      secret =
        await findMikroTikPppSecretByName(
          client,
          customer.pppoeUsername,
        );
    }

    if (
      !secret ||
      !secret[".id"]
    ) {
      throw new CustomerServiceError(
        "PPP Secret Customer tidak ditemukan di MikroTik",
      );
    }

    const secretId =
      secret[".id"];

    /**
     * Simpan profile yang sedang
     * digunakan untuk rollback.
     *
     * Normalnya profile ini isolir.
     */
    const previousProfile =
      secret.profile?.trim() ||
      "ISOLIR";

    /**
     * ==========================================
     * RESTORE MIKROTIK PROFILE
     * ==========================================
     *
     * Profile dikembalikan dari
     * database Customer.
     */
    try {
      await setMikroTikPppSecretProfile(
        client,
        secretId,
        customer.pppProfileName,
      );
    } catch (error) {
      console.error(
        `Buka Isolir PPP Secret ${secretId}:`,
        error instanceof Error
          ? error.message
          : error,
      );

      throw new CustomerServiceError(
        `Gagal mengembalikan PPP Profile ke "${customer.pppProfileName}"`,
      );
    }

    /**
     * ==========================================
     * DATABASE
     * ==========================================
     *
     * Database hanya mengubah:
     *
     * SUSPENDED -> ACTIVE
     *
     * internetPlanId tetap
     * pppProfileName tetap
     */
    try {
      const updated =
        await updateCustomerStatus(
          customer.id,
          "ACTIVE",
        );

      if (!updated) {
        throw new Error(
          "Database tidak mengembalikan Customer",
        );
      }

      return updated;
    } catch (databaseError) {
      /**
       * DB gagal setelah MikroTik
       * berhasil dikembalikan.
       *
       * Rollback MikroTik ke
       * profile sebelumnya.
       */
      try {
        await setMikroTikPppSecretProfile(
          client,
          secretId,
          previousProfile,
        );
      } catch (
        rollbackError
      ) {
        console.error(
          `Rollback Buka Isolir ${secretId}:`,
          rollbackError instanceof
          Error
            ? rollbackError.message
            : rollbackError,
        );

        throw new CustomerServiceError(
          "Status database gagal diperbarui dan rollback profile MikroTik juga gagal. Periksa PPP Secret Customer.",
        );
      }

      console.error(
        "Restore Customer database:",
        databaseError instanceof
        Error
          ? databaseError.message
          : databaseError,
      );

      throw new CustomerServiceError(
        "Customer gagal dibuka dari isolir. Profile MikroTik sudah dikembalikan.",
      );
    }
  } catch (error) {
    if (
      error instanceof
      CustomerServiceError
    ) {
      throw error;
    }

    console.error(
      `Buka Isolir Customer ${customerId}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    throw new CustomerServiceError(
      "Gagal membuka isolir Customer",
    );
  } finally {
    await client
      .close()
      .catch(
        () => undefined,
      );
  }
}


export async function getCustomerForEditService(
  customerId: number,
) {
  if (
    !Number.isSafeInteger(
      customerId,
    ) ||
    customerId <= 0
  ) {
    return null;
  }

  return findCustomerForEdit(
    customerId,
  );
}