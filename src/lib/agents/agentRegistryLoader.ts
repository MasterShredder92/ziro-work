import { getAllAgentManifests } from "./agentManifest";
import { registerAgent } from "./runtimeRegistry";

export function loadAllAgentManifests(): void {
  try {
    const manifests = getAllAgentManifests();
    for (const manifest of Object.values(manifests)) {
      try {
        registerAgent({
          id: manifest.id,
          name: manifest.name,
          role: manifest.personality,
          description: manifest.description,
          run: async () => {},
        });
      } catch {
        // Never throw; best-effort load.
      }
    }
  } catch {
    // Never throw; best-effort load.
  }
}

