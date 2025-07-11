interface ApiResponse<T = any> {
  success: true | false;
  data?: T;
  msg?: string;
  error?: string;
}

export const successResponse = <T>(data?: T): ApiResponse<T> => {
  return {
    success: true,
    data,
  };
};

export const errorResponse = (
  msg: string,
  error: string = ""
): ApiResponse<null> => {
  return {
    success: false,
    msg,
    error,
  };
};
