export default function BrandIntro({ introStage }) {
  return (
    <main className={`brand-intro brand-intro--${introStage}`} aria-label="Tugendane welcome">
      <div className="brand-intro-background" />
      <div className="brand-intro-logo">
        <img src="/tugendane-car.png" alt="Tugendane car logo" />
        <div className="brand-intro-copy" aria-label="Tugendane, Tujyane, Let's Go Together">
          <span className="brand-intro-word brand-intro-word--name">TUGENDANE</span>
          <span className="brand-intro-word brand-intro-word--group">TUJYANE</span>
          <span className="brand-intro-word brand-intro-word--slogan">LET'S GO TOGETHER</span>
        </div>
      </div>
    </main>
  );
}
