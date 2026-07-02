import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/react';

type MaybeClerkProviderProps = {
  children: ReactNode;
  signInUrl: string;
  signUpUrl: string;
  routerPush: (to: string) => void;
  routerReplace: (to: string) => void;
};

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function MaybeClerkProvider({
  children,
  signInUrl,
  signUpUrl,
  routerPush,
  routerReplace,
}: MaybeClerkProviderProps) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      routerPush={routerPush}
      routerReplace={routerReplace}
    >
      {children}
    </ClerkProvider>
  );
}
