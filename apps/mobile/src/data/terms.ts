import * as SecureStore from "expo-secure-store"

/**
 * Whether this person agreed to the terms (https://www.360dep.vn/chinh-sach)
 * on this phone. The login screen asks before anyone signs in or registers
 * (App Store 1.2); people who signed in before that agree once afterwards, on
 * the terms screen. Bump the version when the terms change enough to ask again.
 */
const key = (uid: string) => `dep360_terms_v1_${uid}`
/** Ticked on the login screen, before there is an account to remember it for. */
const BEFORE_SIGN_IN = "dep360_terms_v1_device"

export async function hasAcceptedTerms(uid: string): Promise<boolean> {
  try {
    if ((await SecureStore.getItemAsync(key(uid))) === "1") return true
    if ((await SecureStore.getItemAsync(BEFORE_SIGN_IN)) !== "1") return false
    await rememberTerms(uid)
    return true
  } catch {
    return false
  }
}

export async function rememberTerms(uid: string) {
  await SecureStore.setItemAsync(key(uid), "1").catch(() => {})
}

export async function agreedBeforeSignIn(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BEFORE_SIGN_IN).catch(() => null)) === "1"
}

export async function rememberAgreementBeforeSignIn(agreed: boolean) {
  if (agreed) await SecureStore.setItemAsync(BEFORE_SIGN_IN, "1").catch(() => {})
  else await SecureStore.deleteItemAsync(BEFORE_SIGN_IN).catch(() => {})
}
