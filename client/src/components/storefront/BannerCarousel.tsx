import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Banner {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkText?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  theme?: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant';
  height?: string;
}

export default function BannerCarousel({
  banners,
  autoplay = true,
  autoplayInterval = 5000,
  showControls = true,
  showIndicators = true,
  theme = 'modern',
  height = 'h-96'
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isPlaying || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [isPlaying, banners.length, autoplayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!banners.length) return null;

  const currentBanner = banners[currentIndex];
  const imageUrl = isMobile && currentBanner.mobileImageUrl 
    ? currentBanner.mobileImageUrl 
    : currentBanner.imageUrl;

  const themeStyles = {
    modern: {
      container: "rounded-2xl overflow-hidden shadow-xl",
      overlay: "bg-gradient-to-t from-black/60 via-transparent to-transparent",
      content: "text-white",
      title: "text-4xl md:text-6xl font-bold mb-4",
      description: "text-lg md:text-xl mb-6 max-w-2xl",
      button: "bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105",
      controls: "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30",
      indicators: "bg-white/50 hover:bg-white"
    },
    classic: {
      container: "rounded-lg overflow-hidden shadow-lg border-2 border-gray-200",
      overlay: "bg-gradient-to-r from-black/70 via-black/30 to-transparent",
      content: "text-white",
      title: "text-3xl md:text-5xl font-serif font-bold mb-4",
      description: "text-base md:text-lg mb-6 max-w-xl",
      button: "bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-medium border-2 border-amber-500",
      controls: "bg-black/30 text-white hover:bg-black/50",
      indicators: "bg-amber-600/70 hover:bg-amber-600"
    },
    minimal: {
      container: "rounded-lg overflow-hidden",
      overlay: "bg-gradient-to-b from-transparent via-transparent to-black/40",
      content: "text-white",
      title: "text-2xl md:text-4xl font-light mb-3",
      description: "text-sm md:text-base mb-4 max-w-lg font-light",
      button: "bg-white text-gray-900 px-6 py-2 rounded-sm font-medium hover:bg-gray-100",
      controls: "bg-white/10 text-white hover:bg-white/20 rounded-full",
      indicators: "bg-white/60 hover:bg-white rounded-full"
    },
    bold: {
      container: "rounded-none overflow-hidden shadow-2xl",
      overlay: "bg-gradient-to-br from-purple-900/80 via-pink-900/60 to-orange-900/80",
      content: "text-white",
      title: "text-4xl md:text-7xl font-black mb-4 uppercase tracking-wide",
      description: "text-lg md:text-xl mb-6 max-w-2xl font-bold",
      button: "bg-gradient-to-r from-pink-500 to-orange-500 text-white px-10 py-4 rounded-none font-bold uppercase tracking-wide transform hover:scale-105 transition-transform",
      controls: "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600",
      indicators: "bg-pink-500 hover:bg-pink-400"
    },
    elegant: {
      container: "rounded-xl overflow-hidden shadow-2xl",
      overlay: "bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent",
      content: "text-white",
      title: "text-3xl md:text-5xl font-light mb-4 tracking-wide",
      description: "text-base md:text-lg mb-6 max-w-xl font-light leading-relaxed",
      button: "bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors",
      controls: "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-full",
      indicators: "bg-white/70 hover:bg-white rounded-full"
    }
  };

  const styles = themeStyles[theme];

  return (
    <div className={`relative ${height} ${styles.container}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-full"
        >
          <img
            src={imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&crop=center`;
            }}
          />
          
          <div className={`absolute inset-0 ${styles.overlay}`} />
          
          <div className={`absolute inset-0 flex items-center justify-start p-8 md:p-16 ${styles.content}`}>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-4xl"
            >
              <h2 className={styles.title}>
                {currentBanner.title}
              </h2>
              
              {currentBanner.description && (
                <p className={styles.description}>
                  {currentBanner.description}
                </p>
              )}
              
              {currentBanner.linkUrl && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Button
                    onClick={() => window.open(currentBanner.linkUrl, '_blank')}
                    className={styles.button}
                  >
                    {currentBanner.linkText || 'Saiba Mais'}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {showControls && banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 ${styles.controls}`}
            aria-label="Banner anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 ${styles.controls}`}
            aria-label="Próximo banner"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Play/Pause Control */}
          <button
            onClick={togglePlayPause}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${styles.controls}`}
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 transition-all duration-200 ${
                index === currentIndex 
                  ? styles.indicators
                  : `${styles.indicators} opacity-50`
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isPlaying && banners.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <motion.div
            className="h-full bg-white/80"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: autoplayInterval / 1000, ease: "linear" }}
            key={currentIndex}
          />
        </div>
      )}
    </div>
  );
}