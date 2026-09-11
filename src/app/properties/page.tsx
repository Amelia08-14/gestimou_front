import PropertiesClient from '@/components/properties/PropertiesClient';

// No server-side data fetch here on purpose: this app has no way to attach
// the browser's auth token to a server-side request, so it always came back
// empty/unauthenticated anyway — and doing it added a slow, blocking
// server-to-server call on every navigation. PropertiesClient fetches its
// own residences/properties client-side (with the real token) right after
// mount.
export default function PropertiesPage() {
  return <PropertiesClient residences={[]} properties={[]} />;
}
