import configuration from "../../configuration.json";

export interface AuthProvider {
  issuer: string;
  clientId: string;
}

export function authProviderFor(environment: string): AuthProvider {
  return {
    issuer:
      environment === "production"
        ? configuration.AUTH_ISSUER_PROD
        : import.meta.env.VITE_AUTH_ISSUER_DEV || configuration.AUTH_ISSUER_DEV,
    clientId: configuration.AUTH_CLIENT_ID,
  };
}

export function isSameAuthProvider(a: AuthProvider, b: AuthProvider) {
  return a.issuer === b.issuer && a.clientId === b.clientId;
}
