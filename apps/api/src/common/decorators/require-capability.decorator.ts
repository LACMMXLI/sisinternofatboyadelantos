import { SetMetadata } from '@nestjs/common';
import type { Capability } from '@libreta/shared';

export const CAPABILITY_KEY = 'requiredCapability';

/**
 * Exige que el rol del usuario tenga la capacidad indicada (§5). La
 * autoridad real: ROLE_CAPABILITIES en @libreta/shared, evaluada en
 * CapabilityGuard. Ocultar un botón en el frontend NUNCA sustituye esto.
 */
export const RequireCapability = (capability: Capability) =>
  SetMetadata(CAPABILITY_KEY, capability);
