let active: object | null = null;
/** Shared by the device recorder, command voice and the isolated mono recording lab. */
export function claimMicrophone(owner: object): () => void {
  if (active)
    throw new Error(
      "The microphone is in use by another recording. Stop it before starting a new capture.",
    );
  active = owner;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (active === owner) active = null;
  };
}
