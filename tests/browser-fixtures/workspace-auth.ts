import { createElement } from "react";
import { useAuth } from "./creation-auth";
export { useAuth, setFixtureSession } from "./creation-auth";
export function useUser() {
  const { sessionId } = useAuth();
  return {
    isLoaded: true,
    isSignedIn: !!sessionId,
    user: sessionId
      ? {
          id: "fixture-user",
          firstName: "Asha",
          lastName: "Rao",
          fullName: "Asha Rao",
          imageUrl: "",
          primaryEmailAddress: { emailAddress: "asha@example.test" },
        }
      : null,
  };
}
export function UserProfile() {
  return createElement("div", null, "Managed account fixture");
}
