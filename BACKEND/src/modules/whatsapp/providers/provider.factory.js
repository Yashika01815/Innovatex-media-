import { SimulationProvider } from './simulation.provider.js';

const PROVIDERS = Object.freeze({
  simulation: new SimulationProvider(),
});

/**
 * Resolve a provider by name. Only the simulation provider exists for now;
 * unknown names fall back to it.
 */
export function getProvider(name = 'simulation') {
  return PROVIDERS[name] || PROVIDERS.simulation;
}
