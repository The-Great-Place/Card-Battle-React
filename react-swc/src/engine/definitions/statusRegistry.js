let activeStatusDefinitions = {};

function cloneTriggers(triggers) {
  return Array.isArray(triggers) ? triggers.map((trigger) => ({ ...trigger })) : [];
}

function normalizeStatusDefinition(definitionId, definition) {
  if (!definitionId || !definition) return null;

  return {
    id: definition.id ?? definitionId,
    ...definition,
    triggers: cloneTriggers(definition.triggers),
  };
}

function normalizeStatusDefinitions(definitions) {
  return Object.fromEntries(
    Object.entries(definitions ?? {})
      .map(([definitionId, definition]) => {
        const normalizedDefinition = normalizeStatusDefinition(definitionId, definition);
        return normalizedDefinition ? [definitionId, normalizedDefinition] : null;
      })
      .filter(Boolean),
  );
}

async function readStatusDefinitionsFromFileSystem() {
  if (typeof process === "undefined" || !process?.versions?.node) {
    return null;
  }

  const [{ readFile }, pathModule] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);

  const statusDefinitionsPath = pathModule.resolve(
    process.cwd(),
    "public",
    "Data",
    "statuses.json",
  );

  const rawJson = await readFile(statusDefinitionsPath, "utf8");
  return JSON.parse(rawJson);
}

async function readStatusDefinitionsFromFetch() {
  if (typeof fetch !== "function") return null;

  const candidateUrls = [];
  if (typeof window !== "undefined" && window?.location?.origin) {
    candidateUrls.push(new URL("/Data/statuses.json", window.location.origin).toString());
  }
  candidateUrls.push("./Data/statuses.json");

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // Try the next candidate or fall back to the filesystem in Node.
    }
  }

  return null;
}

async function loadCanonicalStatusDefinitions() {
  const fetchedDefinitions = await readStatusDefinitionsFromFetch();
  if (fetchedDefinitions) {
    return normalizeStatusDefinitions(fetchedDefinitions);
  }

  const fileDefinitions = await readStatusDefinitionsFromFileSystem();
  if (fileDefinitions) {
    return normalizeStatusDefinitions(fileDefinitions);
  }

  return {};
}

activeStatusDefinitions = await loadCanonicalStatusDefinitions();

export function getStatusDefinition(statusId) {
  return activeStatusDefinitions[statusId] ?? null;
}

export function getAllStatusDefinitions() {
  return { ...activeStatusDefinitions };
}

export function setStatusDefinitions(definitions) {
  activeStatusDefinitions = normalizeStatusDefinitions(definitions);
  return getAllStatusDefinitions();
}

export function mergeStatusDefinitions(definitions) {
  activeStatusDefinitions = {
    ...activeStatusDefinitions,
    ...normalizeStatusDefinitions(definitions),
  };

  return getAllStatusDefinitions();
}

export async function loadStatusDefinitions(loader) {
  const definitions = await loader();
  return setStatusDefinitions(definitions);
}
