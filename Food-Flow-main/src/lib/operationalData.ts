import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirebase } from "./firebase";

export type RecipientStatus = "offered" | "accepted" | "received";
export type ShipmentStatus = "Dispatched" | "In transit" | "Delivered";

export type OperationalRecord =
  | {
      id: string;
      kind: "recipient";
      status: RecipientStatus;
    }
  | {
      id: string;
      kind: "shipment";
      status: ShipmentStatus;
    };

type StoredOperationalRecord = {
  id: string;
  kind: string;
  status: string;
};

function isOperationalRecord(value: Record<string, unknown>): value is Record<string, unknown> & StoredOperationalRecord {
  if (typeof value.id !== "string") return false;
  if (value.kind === "recipient") {
    return value.status === "offered" || value.status === "accepted" || value.status === "received";
  }
  if (value.kind === "shipment") {
    return value.status === "Dispatched" || value.status === "In transit" || value.status === "Delivered";
  }
  return false;
}

export function watchOperationalRecords(
  uid: string,
  onRecords: (records: OperationalRecord[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  return onSnapshot(
    collection(db, "users", uid, "operationalData"),
    (snapshot) => {
      const records = snapshot.docs.reduce<OperationalRecord[]>((items, entry) => {
        const value = entry.data();
        if (!isOperationalRecord(value)) return items;
        if (value.kind === "recipient" && (value.status === "offered" || value.status === "accepted" || value.status === "received")) {
          items.push({ id: value.id, kind: "recipient", status: value.status });
          return items;
        }
        if (value.kind === "shipment" && (value.status === "Dispatched" || value.status === "In transit" || value.status === "Delivered")) {
          items.push({ id: value.id, kind: "shipment", status: value.status });
        }
        return items;
      }, []);
      onRecords(records);
    },
    onError,
  );
}

export async function saveOperationalRecord(record: OperationalRecord, uid: string): Promise<void> {
  const { db } = requireFirebase();
  await setDoc(
    doc(db, "users", uid, "operationalData", `${record.kind}-${record.id}`),
    { ...record, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
