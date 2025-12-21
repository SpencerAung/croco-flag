// Shared API response wrappers
export type ApiResponse<T> = {
  data: T;
};

export type ApiErrorResponse = {
  error: string;
};
