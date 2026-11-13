import { useState, useRef, useEffect, useCallback } from "react";

const SLIDES_DATA = [
  {
    image: "/passenger-at-home.jpeg",
    alt: "Passenger at home at night searching Tugendane rides",
    title: "Frustrated by Bus Park Lines?",
    question: "Are you frustrated by the bus park lines and uncomfortable rides?",
    answer: "Tugendane Rides is for you and yours — here is your solution!",
    questionDelay: "200ms",
    answerDelay: "900ms",
  },
  {
    image: "/driver-at-home.jpeg",
    alt: "Driver at counter with car keys receiving booking alert",
    title: "Plan Your Journey Smarter",
    question: "Have you planned a journey? Fuel costs are still high nowadays.",
    answer: "With Tugendane Rides you can reduce fuel cost and move with comfort — it's simple and reliable.",
    questionDelay: "200ms",
    answerDelay: "900ms",
  },
  {
    image: "/meeting-point.jpeg",
    alt: "Meeting point by the road and fuel savings",
    title: "Share the Ride",
    question: null,
    answer: "Share your ride and move safe and save with Tugendane.",
    questionDelay: null,
    answerDelay: "200ms",
  },
];

export default function AppIntro({ onFinish, initialSlide = 0 }) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [introStage, setIntroStage] = useState("navy");
  const [isShaking, setIsShaking] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const isDragging = useRef(false);

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
      {/* Floating Skip button only — no header bar */}
      {currentSlide < TOTAL_SLIDES - 1 && (
        <button
          type="button"
          className="onboarding-skip-btn onboarding-skip-floating"
          onClick={onFinish}
          title="Skip to App"
        >
          Skip &times;
        </button>
      )}

      {/* Main Slide Track */}
      <main className="onboarding-track-container">
        <div
          className="onboarding-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {SLIDES_DATA.map((slide, idx) => (
            <section key={slide.title} className="onboarding-slide photo-onboarding-slide">
              <div className="photo-slide-container" key={`${slide.title}-${currentSlide === idx}`}>
                <div className="story-brand-header" aria-label="Tugendane Rides">
                  <img src="/tugendane-car.png" alt="" />
                  <span>TUGENDANE RIDES</span>
                </div>
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
                    Tangira / Get Started &rarr;
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
              aria-label="Previous page"
            >
              ← Back
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
              aria-label="Next page"
            >
              Next &rarr;
            </button>
          ) : <div style={{ width: "90px" }} />}
        </div>
      </footer>}
    </div>
  );
}
