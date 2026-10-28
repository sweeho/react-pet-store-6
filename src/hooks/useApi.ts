export interface UseApiResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  retry: () => void;
}

export function useApi<T>(url: string): UseApiResult<T> {
  void url;
  throw new Error("VortexNotImplemented");
}
