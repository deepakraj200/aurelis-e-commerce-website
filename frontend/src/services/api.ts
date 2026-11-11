import axios, { AxiosError } from 'axios';

export class ApiClientError extends Error {
  status: number;
  details?: { field: string; message: string }[];

  constructor(message: string, status = 500, details?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; details?: { field: string; message: string }[] }>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiClientError(
          error.code === 'ECONNABORTED'
            ? 'The request took too long. Please try again.'
            : 'We could not reach the AURELIS service. Check your connection and try again.'
        )
      );
    }
    const { status, data } = error.response;
    return Promise.reject(
      new ApiClientError(
        data?.message || 'Something went wrong. Please try again.',
        status,
        data?.details
      )
    );
  }
);

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export default api;
