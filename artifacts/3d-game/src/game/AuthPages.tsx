import { SignIn, SignUp } from '@clerk/react';
import { dark } from '@clerk/themes';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const appearance = {
  baseTheme: dark,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#d97706',
    colorForeground: '#f5f0e0',
    colorMutedForeground: '#9ca3af',
    colorDanger: '#ef4444',
    colorBackground: '#0d0820',
    colorInput: '#1a0a30',
    colorInputForeground: '#f5f0e0',
    colorNeutral: '#4c1d95',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#0d0820] rounded-2xl w-[440px] max-w-full overflow-hidden border border-purple-800/60 shadow-2xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-amber-300 font-serif',
    headerSubtitle: 'text-gray-400',
    socialButtonsBlockButtonText: 'text-gray-200',
    formFieldLabel: 'text-gray-300',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
    footerActionText: 'text-gray-500',
    dividerText: 'text-gray-600',
    identityPreviewEditButton: 'text-amber-400',
    formFieldSuccessText: 'text-green-400',
    alertText: 'text-red-400',
    logoBox: 'flex justify-center mb-1',
    logoImage: 'w-12 h-12',
    socialButtonsBlockButton: 'border-purple-800/60 bg-[#160830] hover:bg-[#1e0e40]',
    formButtonPrimary: 'bg-amber-700 hover:bg-amber-600 text-amber-100 border-amber-500',
    formFieldInput: 'bg-[#160830] border-purple-800/60 text-gray-200',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-purple-900/60',
    alert: 'bg-red-950/40 border-red-800/60',
    otpCodeFieldInput: 'bg-[#160830] border-purple-800/60 text-amber-300',
    formFieldRow: 'gap-3',
    main: 'gap-4',
  },
};

export function SignInPage() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0840 0%, #05020f 100%)', zIndex: 99999 }}
    >
      <div className="mb-6 text-center">
        <div className="text-amber-300 font-serif text-2xl font-bold tracking-widest mb-1">Adelynn's Quest</div>
        <div className="text-gray-500 text-xs font-mono">Sign in to save scores to the leaderboard</div>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={basePath || '/'}
        appearance={appearance}
      />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0840 0%, #05020f 100%)', zIndex: 99999 }}
    >
      <div className="mb-6 text-center">
        <div className="text-amber-300 font-serif text-2xl font-bold tracking-widest mb-1">Adelynn's Quest</div>
        <div className="text-gray-500 text-xs font-mono">Create an account to join the Hall of Heroes</div>
      </div>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={basePath || '/'}
        appearance={appearance}
      />
    </div>
  );
}
