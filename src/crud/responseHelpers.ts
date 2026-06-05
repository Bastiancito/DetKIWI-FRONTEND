type ApiLikeResponse<T = unknown> = {
  status?: number;
  data?: T;
  message?: string;
};

const SUCCESS_STATUS_MIN = 200;
const SUCCESS_STATUS_MAX = 300;

export const isSuccessfulResponse = <T,>(response: ApiLikeResponse<T>): boolean => {
  if (typeof response?.status !== 'number') {
    return false;
  }

  if (response.status < SUCCESS_STATUS_MIN || response.status >= SUCCESS_STATUS_MAX) {
    return false;
  }

  const payload = response.data as any;
  if (payload && typeof payload === 'object') {
    if (payload.success === false || payload.ok === false) {
      return false;
    }

    const message = typeof payload.msg === 'string'
      ? payload.msg
      : typeof payload.message === 'string'
        ? payload.message
        : '';

    if (message && /error|fall(a|o)|inv[aá]lid|no fue posible|failed/i.test(message)) {
      return false;
    }
  }

  return true;
};

export const getErrorMessage = (error: any, fallback = 'Operación fallida'): string => {
  return error?.message
    || error?.data?.msg
    || error?.data?.error
    || error?.response?.data?.msg
    || error?.response?.data?.error
    || fallback;
};
