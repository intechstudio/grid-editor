import configuration from "../../configuration.json";

export interface AuthProvider {
  issuer: string;
  clientId: string;
}

export function authProviderFor(environment: string): AuthProvider {
  return environment === "production"
    ? {
        issuer: configuration.AUTH_ISSUER_PROD,
        clientId: configuration.AUTH_CLIENT_ID_PROD,
      }
    : {
        issuer:
          import.meta.env.VITE_AUTH_ISSUER_DEV ?? configuration.AUTH_ISSUER_DEV,
        clientId:
          import.meta.env.VITE_AUTH_CLIENT_ID_DEV ??
          configuration.AUTH_CLIENT_ID_DEV,
      };
}

export function isSameAuthProvider(a: AuthProvider, b: AuthProvider) {
  return a.issuer === b.issuer && a.clientId === b.clientId;
}
