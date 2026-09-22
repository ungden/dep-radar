import { Redirect } from "expo-router"

/**
 * dep360://auth/callback. The Google round trip is finished inside
 * WebBrowser.openAuthSessionAsync (state/app.tsx), which reads the code from
 * this URL itself; if the OS opens the route anyway, go home.
 */
export default function AuthCallback() {
  return <Redirect href="/" />
}
