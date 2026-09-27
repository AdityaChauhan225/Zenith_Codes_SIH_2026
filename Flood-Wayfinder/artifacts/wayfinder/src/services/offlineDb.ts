const DATABASE_NAME = "wayfinder-local-data";
const DATABASE_VERSION = 1;

type StoreName = "regions" | "savedLocations" | "downloadDrafts";

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("This browser does not support local offline storage."),
    );
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("regions")) {
        database.createObjectStore("regions", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("savedLocations")) {
        database.createObjectStore("savedLocations", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("downloadDrafts")) {
        database.createObjectStore("downloadDrafts", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error ?? new Error("Could not open local map storage."));
    };
    request.onblocked = () => {
      databasePromise = undefined;
      reject(new Error("Close other Wayfinder tabs to update local storage."));
    };
  });

  return databasePromise;
}

export async function dbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(store, "readonly").objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error("Could not read local data."));
  });
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(store, "readonly").objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error ?? new Error("Could not read local data."));
  });
}

export async function dbPut<T extends { id: string }>(store: StoreName, value: T): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, "readwrite");
    transaction.objectStore(store).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save local data."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Saving local data was interrupted."));
  });
}

export async function dbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, "readwrite");
    transaction.objectStore(store).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete local data."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Deleting local data was interrupted."));
  });
}