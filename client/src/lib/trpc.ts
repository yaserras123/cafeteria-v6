/**
 * Stubbed tRPC client to prevent runtime errors after removing the provider.
 * This allows components that still use trpc.useQuery or trpc.useMutation 
 * to render without crashing, though they won't fetch data.
 */
const stub: any = new Proxy(() => stub, {
  get: () => stub,
  apply: () => stub,
});

export const trpc = stub;
