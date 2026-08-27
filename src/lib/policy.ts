// Rules shared by the browser and the server. Kept free of node imports so
// client components can use them (src/lib/password.ts pulls in node:crypto).
export const MIN_PASSWORD_LENGTH = 6;
