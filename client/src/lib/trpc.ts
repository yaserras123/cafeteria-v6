/**
 * Stubbed tRPC client to prevent runtime errors after removing the provider.
 * useQuery returns { data: undefined, isLoading: false, error: null }
 * useMutation returns { mutate: () => {}, mutateAsync: async () => {}, isLoading: false }
 * This prevents "Cannot convert object to primitive value" errors when
 * data values are passed to isNaN() or arithmetic operations.
 */

const queryResult = {
  data: undefined,
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve({ data: undefined }),
  isFetching: false,
  isError: false,
  isSuccess: false,
};

const mutationResult = {
  mutate: () => {},
  mutateAsync: async () => {},
  isLoading: false,
  isPending: false,
  error: null,
  isError: false,
  isSuccess: false,
  reset: () => {},
};

function createStub(): any {
  return new Proxy(
    function () {
      return queryResult;
    },
    {
      get(_target: any, prop: string | symbol) {
        if (prop === "useQuery") {
          return () => queryResult;
        }
        if (prop === "useMutation") {
          return () => mutationResult;
        }
        if (prop === "useInfiniteQuery") {
          return () => queryResult;
        }
        if (prop === "query") {
          return async () => undefined;
        }
        if (prop === "mutate") {
          return async () => undefined;
        }
        return createStub();
      },
      apply() {
        return queryResult;
      },
    }
  );
}

export const trpc = createStub();
