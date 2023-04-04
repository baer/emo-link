enum ErrorCodes {
  INVALID_URL = 1001,
  INVALID_TURNSTILE_TOKEN = 1002,
}

const errorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.INVALID_URL]: "The provided URL is not valid.",
  [ErrorCodes.INVALID_TURNSTILE_TOKEN]:
    "Unable to verify the profided turnstile token",
};

type ErrorMessage = {
  code: ErrorCodes;
  message: string;
};

function createErrorMessage(code: ErrorCodes): ErrorMessage {
  return {
    code,
    message: errorMessages[code],
  };
}

type JSONResponseParams = {
  data: any;
  status?: number;
  prettyPrint?: boolean;
};

const jsonResponse = ({
  data,
  status = 200,
  prettyPrint = false,
}: JSONResponseParams): Response => {
  const json = prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  return new Response(json, {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
  });
};

const errorResponse = (code: ErrorCodes, status = 400): Response => {
  return jsonResponse({
    data: createErrorMessage(code),
    status,
    prettyPrint: true,
  });
};

export { jsonResponse, errorResponse, ErrorCodes };
