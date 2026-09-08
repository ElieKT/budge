export const ALLOWED_RECEIPT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
// The client resizes to a ~1400px-longest-side JPEG before upload
// (src/lib/image.ts), so this only needs headroom for that plus the rare
// fallback of an unresizeable original.
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5MB
