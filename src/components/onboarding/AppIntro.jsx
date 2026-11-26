import { useState, useRef, useEffect, useCallback } from "react";

const getSlidesData = (lang = "en") => [
  {
    image: "/passenger-at-home.jpeg",
    alt: lang === "en" ? "Passenger at home at night searching Tugendane rides" : "Umugenzi mu rugo ari gushaka urugendo rwa Tugendane",
    title: lang === "en" ? "Frustrated by Bus Park Lines?" : "Urarambiwe Imirongo yo muri Gare?",
    question: lang === "en" ? "Are you frustrated by the bus park lines and uncomfortable rides?" : "Urarambiwe imirongo miremire yo muri gare no kugenda nabi?",
    answer: lang === "en" ? "Tugendane Rides is for you and yours — here is your solution!" : "Tugendane Rides irahari ku bwawe na bagenzi bawe — dore umuti urambye!",
    questionDelay: "200ms",
    answerDelay: "900ms",
  },
  {
    image: "/driver-at-home.jpeg",
    alt: lang === "en" ? "Driver at counter with car keys receiving booking alert" : "Umushoferi mu rugo akiriye ubutumwa bw'umugenzi",
    title: lang === "en" ? "Plan Your Journey Smarter" : "Tegura Urugendo Rwawe Neza",
    question: lang === "en" ? "Have you planned a journey? Fuel costs are still high nowadays." : "Waba uteganya urugendo? Ibiciro bya lisansi biracyari hejuru muri iki gihe.",
    answer: lang === "en" ? "With Tugendane Rides you can reduce fuel cost and move with comfort — it's simple and reliable." : "Hamwe na Tugendane Rides uragabanya ikiguzi cya lisansi unagende neza mu mudendezo — biroroshye kandi byizewe.",
    questionDelay: "200ms",
    answerDelay: "900ms",
  },
  {
    image: "/meeting-point.jpeg",
    alt: lang === "en" ? "Meeting point by the road and fuel savings" : "Aho guhurira ku muhanda no kuzigama lisansi",
    title: lang === "en" ? "Share the Ride" : "Sangira Urugendo",
    question: null,
    answer: lang === "en" ? "Share your ride and move safe and save with Tugendane." : "Sangira urugendo, ugende mu mutekano kandi uzigame hamwe na Tugendane.",
    questionDelay: null,
    answerDelay: "200ms",
  },
];

export default function AppIntro({ onFinish, initialSlide = 0, lang = "en" }) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [introStage, setIntroStage] = useState("navy");
  const [isShaking, setIsShaking] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const isDragging = useRef(false);

  const SLIDES_DATA = getSlidesData(lang);

  const TOTAL_SLIDES = 4; // 3 user photo slides + 1 final animated welcome splash

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  }, [TOTAL_SLIDES]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // When slide changes: wait for words to finish popping (1.6s), then trigger image shake
  useEffect(() => {
    let shakeTimer;
    const resetTimer = setTimeout(() => {
      setIsShaking(false);
      if (currentSlide < 3) {
        shakeTimer = setTimeout(() => {
          setIsShaking(true);
        }, 1600);
      }
    }, 0);

    return () => {
      clearTimeout(resetTimer);
      clearTimeout(shakeTimer);
    };
  }, [currentSlide]);

  // When on slide 3 (the 4th slide), trigger the usual brand animation progression
  useEffect(() => {
    if (currentSlide === 3) {
      const navyTimer = setTimeout(() => setIntroStage("navy"), 0);
      const bgTimer = setTimeout(() => setIntroStage("background"), 400);
      const logoTimer = setTimeout(() => setIntroStage("logo"), 1100);
      return () => {
        clearTimeout(navyTimer);
        clearTimeout(bgTimer);
        clearTimeout(logoTimer);
      };
    }
  }, [currentSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40;
    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, onFinish]);

  return (
    <div
      className="onboarding-viewport"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Brand Header Bar — Logo, Brand Title & Skip */}
      <header className="onboarding-top-bar">
        <div className="onboarding-brand-box">
          <div className="onboarding-logo-badge">
            <img src="/tugendane-logo.png" alt="Tugendane Logo" />
          </div>
          <span className="onboarding-brand-text">Tugendane Rides</span>
        </div>

        {currentSlide < TOTAL_SLIDES - 1 && (
          <button
            type="button"
            className="onboarding-skip-btn"
            onClick={onFinish}
            title={lang === "en" ? "Skip to App" : "Simbuka ujye muri App"}
          >
            {lang === "en" ? "Skip" : "Simbuka"} &times;
          </button>
        )}
      </header>

      {/* Main Slide Track */}
      <main className="onboarding-track-container">
        <div
          className="onboarding-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {SLIDES_DATA.map((slide, idx) => (
            <section key={slide.title} className="onboarding-slide photo-onboarding-slide">
              <div className="photo-slide-container" key={`${slide.title}-${currentSlide === idx}`}>
                {idx === 1 && slide.question && (
                  <p className="popping-sentence popping-sentence--question story-question-above">
                    {slide.question}
                  </p>
                )}
                {/* Photo occupies three fifths of the screen; story copy floats over it. */}
                <div className="photo-image-wrapper">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className={`photo-main-img ${currentSlide === idx && isShaking ? "shake-slide-cue" : ""}`}
                    loading="eager"
                  />
                  {/* Dark gradient at bottom for answer text readability */}
                  <div className="photo-gradient-overlay" />

                  {slide.question && idx !== 1 && (
                    <p
                      className="popping-sentence popping-sentence--question"
                      style={{ animationDelay: slide.questionDelay }}
                    >
                      {slide.question}
                    </p>
                  )}

                  {/* Answer text — overlaid at BOTTOM of the photo */}
                  <p
                    className={`popping-sentence popping-sentence--answer ${idx === 2 ? "story-answer-below" : "popping-sentence--on-photo"}`}
                    style={{ animationDelay: slide.answerDelay }}
                  >
                    {slide.answer}
                  </p>
                </div>

              </div>
            </section>
          ))}

          {/* SLIDE 4: Animated Tugendane brand splash */}
          <section className="onboarding-slide onboarding-slide--final">
            <div className={`brand-intro brand-intro--${introStage} brand-intro--embedded`} aria-label="Tugendane welcome">
              <div className="brand-intro-background" />
              <div className="brand-intro-logo">
                <img src="/tugendane-car.png" alt="Tugendane car logo" />
                <div className="brand-intro-copy" aria-label="Tugendane, Tujyane, Let's Go Together">
                  <span className="brand-intro-word brand-intro-word--name">TUGENDANE</span>
                  <span className="brand-intro-word brand-intro-word--group">TUJYANE</span>
                  <span className="brand-intro-word brand-intro-word--slogan">LET'S GO TOGETHER</span>
                </div>

                <div className="final-intro-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-get-started"
                    onClick={onFinish}
                  >
                    {lang === "en" ? "Get Started →" : "Tangira Urugendo →"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Floating Bottom Bar — dots + Back + Next */}
      {currentSlide < TOTAL_SLIDES - 1 && <footer className="onboarding-footer-hover">
        <div className="footer-hover-inner">
          {currentSlide > 0 && currentSlide < TOTAL_SLIDES - 1 ? (
            <button
              type="button"
              className="btn btn-secondary btn-hover-prev"
              onClick={prevSlide}
              aria-label={lang === "en" ? "Previous page" : "Subira inyuma"}
            >
              ← {lang === "en" ? "Back" : "Inyuma"}
            </button>
          ) : (
            <div style={{ width: "90px" }} />
          )}

          <div className="swipe-dots">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`swipe-dot ${idx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {currentSlide < TOTAL_SLIDES - 1 ? (
            <button
              type="button"
              className="btn btn-primary btn-hover-next"
              onClick={nextSlide}
              aria-label={lang === "en" ? "Next page" : "Komeza"}
            >
              {lang === "en" ? "Next →" : "Komeza →"}
            </button>
          ) : <div style={{ width: "90px" }} />}
        </div>
      </footer>}
    </div>
  );
}
