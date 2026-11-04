export default function DriverSetupModal({
  isOpen,
  onClose,
  driverUpgradeForm,
  setDriverUpgradeForm,
  driverRulesAccepted,
  setDriverRulesAccepted,
  handleDriverUpgrade,
  lang,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <section
        className="modal-window driver-welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-registration-title"
      >
        <button
          className="modal-close-btn"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="driver-welcome-icon">🚗</div>
        <p className="driver-welcome-eyebrow">
          {lang === "en" ? "TUGENDANE RIDES · DRIVER COMMUNITY" : "TUGENDANE RIDES · UMURYANGO W'ABASHOFERI"}
        </p>
        <h2 id="driver-registration-title">
          {lang === "en" ? "Let’s get you on the road" : "Tangira urugendo rwawe natwe"}
        </h2>
        <p className="modal-subtitle">
          {lang === "en"
            ? "Register your vehicle and review a few simple commitments to keep every shared ride safe and respectful."
            : "Andikisha imodoka yawe kandi wemere amabwiriza yoroshye afasha buri rugendo kuba rwiza kandi rufite umutekano."}
        </p>
        <div className="driver-welcome-rules">
          <strong>{lang === "en" ? "Driver commitments" : "Amabwiriza y'umushoferi"}</strong>
          <ul>
            {lang === "en" ? (
              <>
                <li>Share only genuine, pre-planned trips in your private vehicle.</li>
                <li>Keep your vehicle, plate, licence, seats, and pickup details accurate.</li>
                <li>Be on time, drive safely, and treat every passenger respectfully.</li>
                <li>Use trip chat and passenger contact details only to coordinate the booked trip.</li>
              </>
            ) : (
              <>
                <li>Tangaza ingendo ziteguye mbere ukoresheje imodoka yawe bwite.</li>
                <li>Tanga amakuru nyayo ku modoka, pulake, uruhushya, imyanya n'aho gufatira abagenzi.</li>
                <li>Gera ku gihe, utware neza kandi wubahe buri mugenzi.</li>
                <li>Koresha ikiganiro n'amakuru y'umugenzi mu gutegura urwo rugendo gusa.</li>
              </>
            )}
          </ul>
        </div>
        <div className="driver-registration-fields">
          <div className="form-group">
            <label htmlFor="driver-vehicle">{lang === "en" ? "Vehicle" : "Ubwoko bw'imodoka"}</label>
            <input
              type="text"
              id="driver-vehicle"
              value={driverUpgradeForm.vehicle}
              onChange={(e) => setDriverUpgradeForm({ ...driverUpgradeForm, vehicle: e.target.value })}
              placeholder="e.g. Toyota Corolla"
            />
          </div>
          <div className="form-group">
            <label htmlFor="driver-plate">{lang === "en" ? "Number plate" : "Nimero ya pulake"}</label>
            <input
              type="text"
              id="driver-plate"
              value={driverUpgradeForm.plate}
              onChange={(e) => setDriverUpgradeForm({ ...driverUpgradeForm, plate: e.target.value })}
              placeholder="e.g. RAB 123 A"
            />
          </div>
          <div className="form-group">
            <label htmlFor="driver-license">
              {lang === "en" ? "Driving licence number" : "Nimero y'uruhushya rwo gutwara"}
            </label>
            <input
              type="text"
              id="driver-license"
              value={driverUpgradeForm.drivingLicense}
              onChange={(e) => setDriverUpgradeForm({ ...driverUpgradeForm, drivingLicense: e.target.value })}
            />
          </div>
        </div>
        <label className="driver-rules-consent">
          <input
            type="checkbox"
            checked={driverRulesAccepted}
            onChange={(e) => setDriverRulesAccepted(e.target.checked)}
          />
          <span>
            {lang === "en"
              ? "I have read and agree to the driver commitments above."
              : "Nasomye kandi nemeye amabwiriza y'umushoferi yavuzwe haruguru."}
          </span>
        </label>
        <button
          className="btn btn-primary btn-full"
          type="button"
          disabled={!driverRulesAccepted}
          onClick={handleDriverUpgrade}
        >
          {lang === "en" ? "Accept & become a driver" : "Emera maze ube umushoferi"}
        </button>
      </section>
    </div>
  );
}
