import { Redirect } from "expo-router"

/**
 * The "+" tab opens the request form as a modal (see (tabs)/_layout.tsx) and
 * never lands here; a deep link to it goes to the same form.
 */
export default function PostRequest() {
  return <Redirect href="/yeu-cau/moi" />
}
