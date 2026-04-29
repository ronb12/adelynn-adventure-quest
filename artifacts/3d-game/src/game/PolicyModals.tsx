import { useState } from 'react';

const GAME_NAME = "Adelynn's Adventure Quest";
const LAST_UPDATED = "April 29, 2026";
const CONTACT_EMAIL = "support@adelynnsquest.com";
const DEVELOPER_EMAIL = "ronellbradley@bradleyvs.com";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto select-text"
      style={{ zIndex: 99999, background: 'rgba(4,2,16,0.92)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#0d0820] border border-purple-800/60 rounded-2xl shadow-2xl flex flex-col"
        style={{ maxWidth: 600, width: '92vw', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/50 shrink-0">
          <h2 className="text-amber-300 font-serif font-bold text-lg tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-gray-300 text-sm leading-relaxed space-y-4">
          {children}
        </div>
        <div className="px-5 py-3 border-t border-purple-900/50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-serif rounded-lg border border-amber-500 cursor-pointer transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-amber-400 font-bold font-serif mb-1">{title}</h3>
      <div className="text-gray-400 space-y-2">{children}</div>
    </div>
  );
}

export function TermsOfServiceModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Terms of Service" onClose={onClose}>
      <p className="text-gray-500 text-xs">Last updated: {LAST_UPDATED}</p>
      <p>
        Welcome to {GAME_NAME} ("the Game"). By accessing or playing the Game, you agree to be bound
        by these Terms of Service. If you do not agree, please do not use the Game.
      </p>

      <Section title="1. Eligibility">
        <p>The Game is available to users of all ages. Players under 13 should have parental consent
        before creating an account or submitting scores to the leaderboard.</p>
      </Section>

      <Section title="2. Use of the Game">
        <p>You may use the Game solely for personal, non-commercial entertainment. You agree not to:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Use cheats, automation, bots, or hacks to manipulate scores or gameplay</li>
          <li>Submit leaderboard names containing offensive, hateful, or inappropriate content</li>
          <li>Attempt to disrupt, overload, or damage the Game's infrastructure</li>
          <li>Reverse-engineer or copy the Game's source code for commercial purposes</li>
        </ul>
      </Section>

      <Section title="3. User Content (Leaderboard)">
        <p>When you submit a score to the global leaderboard, you provide a display name. You grant us
        a non-exclusive, royalty-free licence to display that name alongside your score. We reserve the
        right to remove any name we deem inappropriate without notice.</p>
      </Section>

      <Section title="4. Sign In with Apple">
        <p>The Game optionally supports Sign In with Apple. By using this feature, you authorise us to
        receive your Apple-provided display name and a unique identifier to associate your leaderboard
        scores with your account. We do not receive your Apple ID email unless you explicitly share it.</p>
      </Section>

      <Section title="5. Intellectual Property">
        <p>All content within the Game — including artwork, music, story, and code — is owned by or
        licensed to the Game's developers. Nothing in these Terms grants you any ownership over that
        content.</p>
      </Section>

      <Section title="6. Disclaimer of Warranties">
        <p>The Game is provided "as is" without warranty of any kind. We do not guarantee
        uninterrupted access, error-free operation, or permanent leaderboard data retention.</p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>To the fullest extent permitted by law, the Game's developers are not liable for any
        indirect, incidental, or consequential damages arising from your use of the Game.</p>
      </Section>

      <Section title="8. Changes to These Terms">
        <p>We may update these Terms from time to time. Continued use of the Game after changes
        constitutes acceptance of the revised Terms.</p>
      </Section>

      <Section title="9. Contact">
        <p>For questions about these Terms, contact us at <span className="text-amber-400">{CONTACT_EMAIL}</span> or reach the developer directly at <span className="text-amber-400">{DEVELOPER_EMAIL}</span>.</p>
      </Section>
    </ModalShell>
  );
}

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Privacy Policy" onClose={onClose}>
      <p className="text-gray-500 text-xs">Last updated: {LAST_UPDATED}</p>
      <p>
        This Privacy Policy explains how {GAME_NAME} ("we", "our", "the Game") collects, uses,
        and protects information about you when you play the Game.
      </p>

      <Section title="1. Information We Collect">
        <p><span className="text-gray-300 font-semibold">Leaderboard data:</span> When you submit a score,
        we store your chosen display name, score, time, shards collected, and lore read. This data
        is publicly visible on the leaderboard.</p>
        <p><span className="text-gray-300 font-semibold">Sign In with Apple:</span> If you sign in with Apple,
        we receive an anonymised user identifier and optionally your display name from Apple. We do not
        receive your email address unless you choose to share it.</p>
        <p><span className="text-gray-300 font-semibold">Local storage:</span> Game progress (current area,
        hearts, weapons, shards) is saved locally on your device. We do not transmit gameplay
        save data to our servers.</p>
        <p><span className="text-gray-300 font-semibold">Usage data:</span> We may collect anonymised
        aggregate usage statistics (e.g. how many sessions per day) to improve the Game. This data
        cannot be used to identify you.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc ml-5 space-y-1">
          <li>Display your name and score on the global leaderboard</li>
          <li>Associate leaderboard entries with your Apple account (if signed in)</li>
          <li>Improve gameplay and fix bugs using aggregated analytics</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing">
        <p>We do not sell, trade, or share your personal data with third parties, except:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><span className="text-gray-300 font-semibold">Apple:</span> When you use Sign In with Apple,
          data is exchanged per Apple's Privacy Policy</li>
          <li><span className="text-gray-300 font-semibold">Hosting providers:</span> Our infrastructure
          partners process data solely to operate the Game</li>
          <li><span className="text-gray-300 font-semibold">Legal requirements:</span> If required by law</li>
        </ul>
      </Section>

      <Section title="4. Data Retention">
        <p>Leaderboard entries are retained indefinitely to maintain the Hall of Heroes. You may request
        removal of your leaderboard entry by contacting us. Apple sign-in data is retained while your
        account is active; you may delete it by contacting us.</p>
      </Section>

      <Section title="5. Children's Privacy">
        <p>The Game does not knowingly collect personal information from children under 13. If you believe
        a child has submitted personal data, please contact us and we will delete it promptly.</p>
      </Section>

      <Section title="6. Your Rights">
        <p>Depending on your location, you may have rights to access, correct, or delete data we hold
        about you. To exercise these rights, contact us at <span className="text-amber-400">{CONTACT_EMAIL}</span> or <span className="text-amber-400">{DEVELOPER_EMAIL}</span>.</p>
      </Section>

      <Section title="7. Security">
        <p>We implement reasonable technical and organisational measures to protect your data. However,
        no internet transmission is completely secure.</p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. The updated date will be reflected at
        the top of this document. Continued use of the Game constitutes acceptance.</p>
      </Section>

      <Section title="9. Contact">
        <p>For privacy-related questions, contact us at <span className="text-amber-400">{CONTACT_EMAIL}</span> or reach the developer directly at <span className="text-amber-400">{DEVELOPER_EMAIL}</span>.</p>
      </Section>
    </ModalShell>
  );
}

export function PolicyLinks() {
  const [showTos, setShowTos] = useState(false);
  const [showPp, setShowPp] = useState(false);

  return (
    <>
      <p className="text-gray-600 text-xs text-center mt-1">
        By playing you agree to our{' '}
        <button onClick={() => setShowTos(true)} className="text-amber-700 hover:text-amber-500 underline cursor-pointer transition-colors">
          Terms of Service
        </button>
        {' & '}
        <button onClick={() => setShowPp(true)} className="text-amber-700 hover:text-amber-500 underline cursor-pointer transition-colors">
          Privacy Policy
        </button>
      </p>
      {showTos && <TermsOfServiceModal onClose={() => setShowTos(false)} />}
      {showPp  && <PrivacyPolicyModal  onClose={() => setShowPp(false)} />}
    </>
  );
}
