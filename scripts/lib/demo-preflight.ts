const requirements = [
  { id: "identity", variables: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] },
  { id: "database", variables: ["DATABASE_URL"] },
  { id: "project-intake", variables: ["DEMO_CREATOR_CLERK_ID"] },
  { id: "private-storage", variables: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] },
  { id: "brainstorm", variables: ["GEMINI_API_KEY", "GEMINI_MODEL"] },
  { id: "image-generation", variables: ["GEMINI_API_KEY", "GEMINI_IMAGE_MODEL"] },
  { id: "speech", variables: ["SARVAM_API_KEY", "SARVAM_STT_MODEL"] },
] as const;

/** Presence-only projection. Never return env values, URLs, identities or secrets. */
export function demoPreflight(source: Record<string, string | undefined>) {
  const supplied = (name: string) => {
    const value = source[name]?.trim();
    return Boolean(value && !/^(?:your[_ -]|replace[_ -]?me|change[_ -]?me|<.*>$)/i.test(value));
  };
  const groups = requirements.map(({ id, variables }) => {
    const missing = variables.filter(name => !supplied(name));
    return { id, status: missing.length ? "incomplete" as const : "present_unverified" as const, missing };
  });
  return {
    configurationComplete: groups.every(group => group.missing.length === 0),
    liveVerified: false as const,
    groups,
    remainingAcceptance: [
      "Authenticate real development client and creator accounts",
      "Confirm intended database connectivity and applied migrations",
      "Upload and retrieve private files after reload",
      "Run a real Gemini brainstorm and image generation using configured models",
      "Run the image worker and verify persisted output",
      "Recognize microphone speech separately from command execution",
      "Complete the client revision and approval rehearsal",
      "Complete missing client intake and script/storyboard workflows",
    ],
  };
}
