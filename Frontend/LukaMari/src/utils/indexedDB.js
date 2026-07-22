const DB_NAME = "lukamariDB";
const STORE_NAME = "images";
const DB_VERSION = 2;
const TRANSFER_STORE_NAME = "transferBlobs";

// ---------- OPEN DB ----------
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });
      }

      if (!db.objectStoreNames.contains(TRANSFER_STORE_NAME)) {
        db.createObjectStore(TRANSFER_STORE_NAME, { keyPath: "roomId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------- SAVE IMAGE (FIXED & RELIABLE) ----------
export async function saveImage(imageData) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.add({
      image: imageData,
      createdAt: Date.now()
    });

    request.onsuccess = () => {
      console.log(" Saved to IndexedDB");
    };

    request.onerror = (err) => {
      console.log(" Save failed", err);
      reject(err);
    };

    tx.oncomplete = () => {
      resolve(true);
    };

    tx.onerror = (err) => {
      console.log(" Transaction error", err);
      reject(err);
    };
  });
}

// ---------- GET IMAGES ----------
export async function getImages() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (err) => {
      console.log(" Read failed", err);
      reject(err);
    };
  });
}

// ---------- DELETE IMAGE (OPTIONAL BUT USEFUL) ----------
export async function deleteImage(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (err) => reject(err);
  });
}

// ---------- CLEAR DB (FOR TESTING) ----------
export async function clearImages() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => {
      console.log("🧹 DB cleared");
      resolve(true);
    };

    request.onerror = (err) => reject(err);
  });
}

// ---------- TEMPORARY TRANSFER BLOBS ----------
// IndexedDB stores Blob data directly, unlike sessionStorage which has a small
// string-only quota and requires an even larger Base64 representation.
export async function saveTransferBlob(roomId, blob) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSFER_STORE_NAME, "readwrite");
    tx.objectStore(TRANSFER_STORE_NAME).put({ roomId, blob, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getTransferBlob(roomId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction(TRANSFER_STORE_NAME, "readonly")
      .objectStore(TRANSFER_STORE_NAME)
      .get(roomId);
    request.onsuccess = () => resolve(request.result?.blob ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTransferBlob(roomId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSFER_STORE_NAME, "readwrite");
    tx.objectStore(TRANSFER_STORE_NAME).delete(roomId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
