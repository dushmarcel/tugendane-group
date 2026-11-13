export default function ComplianceBanner({ t }) {
  return (
    <div className="compliance-banner">
      <span className="icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      <div>
        <strong>{t.complianceTitle}: </strong>
        <span>{t.complianceText}</span>
      </div>
    </div>
  );
}
