import { webEnv, } from "../config/env";

const API_URL = webEnv.API_URL;

/*RequestInit => built-in TypeScript type 
    includes method: "GET", 
    headers: { "Content-Type": "application/json" },
    retryOnUnauthorized?: boolean;
    credentials: "include",
*/
type ApiRequestOptions = RequestInit & {
     retryOnUnauthorized?: boolean;
};

//custom error class for API failures insread of generic Error => throw new Error("Request failed");
export class ApiError extends Error {
    public readonly status: number;
    public readonly data: unknown;

    constructor (
        message: string,
        status: number,
        data: unknown
    ) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function parseResponseData(response: Response) { //if the response is json parse it ot return null
    const contentType = response.headers.get("content-type");

    if(!contentType?.includes("application/json")) {
        return null;
    }

    return response.json() as Promise<unknown>;
}

let refreshSessionPromise: | Promise<boolean> | null = null;

async function performSessionRefresh(): Promise<boolean> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    },
  );

  return response.ok;
}

function refreshSession(): Promise<boolean> {
  /*
   * If a refresh request is already running,
   * every other unauthorized request waits for
   * the same Promise instead of starting another
   * refresh-token rotation.
   */
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = performSessionRefresh().finally(() => {
      /*
       * After the request finishes, allow a future
       * expired access token to start a new refresh.
       */
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

export async function apiRequest<T> (
    path: string,
    options: ApiRequestOptions = {}, //empty meaning can be called as apiRequest("/auth/me")    
): Promise<T> {
    const {
        retryOnUnauthorized = true, 
        headers,
        ...requestOptions //rest of the options minus headers
    } = options;

    const response = await fetch(`${API_URL}${path}`, { //retryOnUnauthorized not included because it is custom and not part of fetch()
        ...requestOptions,
        credentials: "include", //HTTP-only cookies
        headers: {
        "Content-Type": "application/json",
        ...headers,
        },
    });

    //1 Unauthorized => expired access token / refresh token / invalid tokens
    //2 retryOnUnauthorized = true => try again / false => do not try
    //3 avoid infinite loop if path = refresh
    if (response.status === 401 && retryOnUnauthorized && path !== "/auth/refresh") {
        const sessionWasRefreshed = await refreshSession();

        if (sessionWasRefreshed) {
            return apiRequest<T>(path, {
                ...options,
                retryOnUnauthorized: false //do not try again refresh
            });
        }
    }

    const data = await parseResponseData(response);

    if(!response.ok) {
        const message = (data && typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string") // if this is all true
        ? data.message
        : "Request failed";

        throw new ApiError(message, response.status, data);
    }

    return data as T;
} 
