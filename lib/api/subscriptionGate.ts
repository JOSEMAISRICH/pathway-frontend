/** Redirige a Plan si la API indica que la suscripción o prueba ya no está activa. */
export function subscriptionRequiredPath(): string {
  return "/dashboard/planes?expired=1";
}

export function isSubscriptionRequiredStatus(status: number): boolean {
  return status === 402;
}
