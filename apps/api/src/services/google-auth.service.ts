import { OAuth2Client, } from "google-auth-library";

import { env } from "../config/env.js";

const googleOAuthClient = new OAuth2Client (env.GOOGLE_CLIENT_ID);

export type VerifiedGoogleIdentity = {
    providerAccountId: string,
    email: string,
    name: string,
};

export class GoogleCredentialError extends Error {
    constructor(message="Google credential is invalid") {
        super(message);
        this.name = "GoogleCredentialError";
    }   
}


export async function verifyGoogleCredential( credential: string, ): Promise<VerifiedGoogleIdentity>  {
     try {
        const ticket = await googleOAuthClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID, });

        const payload = ticket.getPayload();

        if ( !payload?.sub || !payload.email || payload?.email_verified !== true) {
            throw new GoogleCredentialError("Google account could not be verified",);
        }

        const email = payload.email.trim().toLowerCase();

        const emailLocalPart = email.split("@")[0]?.trim();

        const name = payload.name?.trim() || emailLocalPart || "Google User";

        return {
      /*
       * Το Google `sub` αποθηκεύεται ως
       * AuthAccount.providerAccountId.
       */
            providerAccountId: payload.sub,
            email,
            name,
        };

    } catch (error) {
        if ( error instanceof GoogleCredentialError ) {
            throw error;
        }

        throw new GoogleCredentialError();
    }
}