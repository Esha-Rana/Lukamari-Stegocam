const DB_NAME = "lukamariDB";
const STORE_NAME = "images";
const DB_VERSION = 1;

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
      console.log("✅ Saved to IndexedDB");
    };

    request.onerror = (err) => {
      console.log("❌ Save failed", err);
      reject(err);
    };

    tx.oncomplete = () => {
      resolve(true);
    };

    tx.onerror = (err) => {
      console.log("❌ Transaction error", err);
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
      console.log("❌ Read failed", err);
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