import AsyncStorage from "@react-native-async-storage/async-storage"
import type { PublicData } from "./public"

/**
 * The last good catalogue per city, so the app opens with something on
 * screen and still works (read-only) when the network does not. AsyncStorage,
 * not SecureStore: this is public data and too big for the Keychain.
 */
const VERSION = 1
const key = (city: string | null) => `dep360.public.v${VERSION}.${city ?? "all"}`

export interface Cached {
  savedAt: number
  data: PublicData
}

export async function readCache(city: string | null): Promise<Cached | null> {
  try {
    const raw = await AsyncStorage.getItem(key(city))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    return parsed?.data?.pros ? parsed : null
  } catch {
    return null
  }
}

export async function writeCache(city: string | null, data: PublicData) {
  try {
    await AsyncStorage.setItem(key(city), JSON.stringify({ savedAt: Date.now(), data } satisfies Cached))
  } catch {
    // Full or unavailable: the next launch simply waits for the network.
  }
}
