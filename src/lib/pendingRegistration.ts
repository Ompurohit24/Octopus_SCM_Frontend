export type PendingRegistrationLocal = {
  registrationId: string;
  entityType: "customer" | "vendor";
  entityName: string;
  expiresAt: string;
};

const KEY =
  "octopus.scm.pending.registrations.v1";

function readAll(): PendingRegistrationLocal[] {
  try {
    const raw =
      localStorage.getItem(KEY);

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function writeAll(
  items: PendingRegistrationLocal[],
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(items),
  );
}

export function savePendingRegistration(
  registration: PendingRegistrationLocal,
) {
  const items =
    readAll().filter(
      (item) =>
        item.registrationId !==
        registration.registrationId,
    );

  items.push(registration);

  writeAll(items);
}

export function getPendingRegistrations(
  entityType?: "customer" | "vendor",
): PendingRegistrationLocal[] {
  const now = Date.now();

  const active =
    readAll().filter(
      (item) => {
        const expiresAt =
          new Date(
            item.expiresAt,
          ).getTime();

        return (
          Number.isFinite(expiresAt) &&
          expiresAt > now
        );
      },
    );

  // Remove expired registrations
  // from browser storage automatically.
  if (
    active.length !==
    readAll().length
  ) {
    writeAll(active);
  }

  if (!entityType) {
    return active;
  }

  return active.filter(
    (item) =>
      item.entityType ===
      entityType,
  );
}

export function getPendingRegistration(
  registrationId: string,
):
  | PendingRegistrationLocal
  | undefined {
  return getPendingRegistrations().find(
    (item) =>
      item.registrationId ===
      registrationId,
  );
}

export function getLatestPendingRegistration(
  entityType: "customer" | "vendor",
):
  | PendingRegistrationLocal
  | undefined {
  const items =
    getPendingRegistrations(
      entityType,
    );

  return items.at(-1);
}

export function removePendingRegistration(
  registrationId: string,
) {
  const items =
    readAll().filter(
      (item) =>
        item.registrationId !==
        registrationId,
    );

  writeAll(items);
}

export function clearPendingRegistrations(
  entityType?: "customer" | "vendor",
) {
  if (!entityType) {
    localStorage.removeItem(KEY);
    return;
  }

  const remaining =
    readAll().filter(
      (item) =>
        item.entityType !==
        entityType,
    );

  writeAll(remaining);
}