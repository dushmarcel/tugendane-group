export default function ComplianceBanner({ t }) {
  return (
    <div className="compliance-banner">
      <span className="icon">⚖️</span>
      <div>
        <strong>{t.complianceTitle}: </strong>
        <span>{t.complianceText}</span>
      </div>
    </div>
  );
}
