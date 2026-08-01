import { Resend } from "resend";
import type { EmailProviderName, SendEmailInput, SendEmailResult, } from "./email.types.js";

const emailEnabled = process.env.EMAIL_ENABLED === "true";

const emailProvider = parseEmailProvider( process.env.EMAIL_PROVIDER, );

const emailFromName = process.env.EMAIL_FROM_NAME ?? "OraGiaKourema";

const emailFromAddress = process.env.EMAIL_FROM_ADDRESS ?? "appointments@example.com";

let resendClient: | Resend | null = null;

function parseEmailProvider( value: string | undefined, ): EmailProviderName {
  if (value === "resend") {
    return "resend";
  }

  return "console";
}

function getFromAddress() {
  return `${emailFromName} <${emailFromAddress}>`;
}

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is required when EMAIL_PROVIDER=resend",
    );
  }

  resendClient = new Resend(apiKey);

  return resendClient;
}

async function sendConsoleEmail( input: SendEmailInput, ): Promise<SendEmailResult> {
  console.log(
    [
      "",
      "========== EMAIL ==========",
      `FROM: ${getFromAddress()}`,
      `TO: ${input.to}`,
      `SUBJECT: ${input.subject}`,
      "",
      input.text,
      "===========================",
      "",
    ].join("\n"),
  );

  return {
    id: null,
    provider: "console",
  };
}

async function sendResendEmail( input: SendEmailInput, ): Promise<SendEmailResult> {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,

      ...(input.replyTo
        ? {
            replyTo:
              input.replyTo,
          }
        : {}),
    });

  if (error) {
    throw new Error(
      `Resend email failed: ${error.message}`,
    );
  }

  return {
    id: data?.id ?? null,
    provider: "resend",
  };
}

export async function sendEmail( input: SendEmailInput, ): Promise<SendEmailResult> {
  if (!emailEnabled) {
    console.log(`[email disabled] ${input.subject} → ${input.to}`,);

    return {
      id: null,
      provider: emailProvider,
    };
  }

  if (emailProvider === "resend") {
    return sendResendEmail(input);
  }

  return sendConsoleEmail(input);
}