import * as SecureStore from "expo-secure-store"

/**
 * Whether this person agreed to the terms (https://www.360dep.vn/chinh-sach)
 * on this phone. Asked once, on the first sign-in; bump the version when the
 * terms change enough to ask again.
 */
const key = (uid: string) => `dep360_terms_v1_${uid}`

export async function hasAcceptedTerms(uid: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(key(uid))) === "1"
  } catch {
    return false
  }
}

export async function rememberTerms(uid: string) {
  await SecureStore.setItemAsync(key(uid), "1").catch(() => {})
}
