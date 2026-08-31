type DeliveryFile = { name: string; url: string };

type SendDigitalDeliveryInput = {
  email: string;
  orderCode: string;
  customerName: string;
  files: DeliveryFile[];
};

/** Calls the /api/send-digital-delivery route to email a customer their digital files. */
export async function sendDigitalDelivery(input: SendDigitalDeliveryInput): Promise<void> {
  const res = await fetch("/api/send-digital-delivery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Échec de l'envoi de l'email");
  }
}
