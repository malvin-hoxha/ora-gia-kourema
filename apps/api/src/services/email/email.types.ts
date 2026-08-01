export type EmailProviderName = | "console" | "resend";

export type SendEmailInput = {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
}

export type SendEmailResult = {
    id: String | null;
    provider: EmailProviderName;
}

export type EmailContent = {
    subject: string;
    text: string;
    html: string;
}

export type AppointmentEmailData = {
    customerName: string;
    customerEmail: string;
    barberName: string;
    serviceName: string;
    startsAt: Date;
    price: number;
    cancellationReason?: string | null;
}