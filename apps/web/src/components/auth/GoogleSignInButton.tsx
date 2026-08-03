import { useEffect, useRef, useState, } from "react";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (
        configuration: {
          client_id: string;

          callback: (
            response:
              GoogleCredentialResponse,
          ) => void;
        },
      ) => void;

      renderButton: (
        parent: HTMLElement,

        configuration: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "pill";
          logo_alignment: "left";
          width: number;
          locale: string;
        },
      ) => void;
    };
  };
};


type WindowWithGoogle = Window & { google?: GoogleIdentityServices; };

type GoogleSignInButtonProps = {
  disabled?: boolean;

  onCredential: (
    credential: string,
  ) => void | Promise<void>;
};

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

let googleInitialized = false;

let activeCredentialHandler: | (( credential: string, ) => void | Promise<void>) | null = null;

export function GoogleSignInButton({ disabled = false, onCredential,}: GoogleSignInButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        activeCredentialHandler = onCredential;

        let retryTimer: | number | undefined;

        let attempts = 0;
        let disposed = false;

        function renderGoogleButton() {
            if (disposed) {
                return;
            }

            if (!googleClientId) {
                setLoadError(
                "Το Google Client ID δεν έχει ρυθμιστεί.",
                );

                return;
            }

            const google = ( window as WindowWithGoogle ).google;

            const container = containerRef.current;

            if (!google || !container) {
                attempts += 1;

                if (attempts >= 50) {
                    setLoadError("Η σύνδεση με Google δεν φορτώθηκε.",);

                    return;
                }

                retryTimer = window.setTimeout( renderGoogleButton, 100, );

                return;
            }

            if (!googleInitialized) {
                google.accounts.id.initialize({
                    client_id: googleClientId,

                    callback: (response) => {
                        if ( !response.credential || !activeCredentialHandler ) {
                            return;
                        }

                        void activeCredentialHandler( response.credential, );
                    },
                });

                googleInitialized = true;
            }

            container.replaceChildren();

            const containerWidth =  Math.floor( container.getBoundingClientRect().width, );

            google.accounts.id.renderButton(
                container,
                {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "pill",
                    logo_alignment: "left",

                    width: Math.max(
                        200,
                        Math.min(
                        containerWidth,
                        400,
                        ),
                    ),

                    locale: "el",
                },
            );

            setLoadError(null);
        }

        renderGoogleButton();

        return () => {
            disposed = true;

            if (retryTimer !== undefined) {
                window.clearTimeout( retryTimer, );
            }

            if ( activeCredentialHandler === onCredential ) {
                activeCredentialHandler = null;
            }
        };
    }, [onCredential]);

    if (loadError) {
        return (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
        </div>
        );
    }

    return (
        <div
            className={
                disabled
                ? "pointer-events-none w-full opacity-60"
                : "w-full"
            }
            aria-busy={disabled}
        >
        <div
            ref={containerRef}
            className="flex w-full justify-center"
        />
        </div>
  );

}
