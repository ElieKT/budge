// Vitest stub for the "server-only" package. That package deliberately
// throws unless imported through a bundler that sets the "react-server"
// resolve condition (Next's server build) — which Vitest doesn't set — so
// it's aliased to this no-op here purely to make server-side modules
// importable in unit tests. Production builds still use the real package.
export {};
