import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const CardCarousel = ({
    items,
    renderItem,
    autoplayDelay = 1000,
    showPagination = true,
    showNavigation = true,
    className
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Determine visibility based on screen width (simplified for this logic, but ideally use hook)
    // For now, we enforce 3 items as requested, but make it responsive via loops
    // The user asked for "3 image at time", loops to "remove 1st add 4th".

    const nextSlide = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const prevSlide = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    useEffect(() => {
        if (!autoplayDelay || isPaused) return;

        const timer = setInterval(() => {
            nextSlide();
        }, autoplayDelay);

        return () => clearInterval(timer);
    }, [nextSlide, autoplayDelay, isPaused]);

    // We need to render 3 items starting from activeIndex.
    // We handle wrapping manually.
    const visibleItems = [];
    for (let i = 0; i < 3; i++) {
        const index = (activeIndex + i) % items.length;
        visibleItems.push({ ...items[index], key: `${index}-${i}` }); // Unique key strategy for animation
    }

    return (
        <div
            className={cn("relative w-full py-10", className)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative w-full overflow-hidden">
                {/* We use LayoutGroup or AnimatePresence for the list? 
            For "sliding" effect where [A,B,C] -> [B,C,D], A leaves, D enters.
        */}
                <div className="flex justify-center gap-6 px-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {/* 
                We effectively want to render the active 3 items. 
                But for true "slide left", the key needs to persist for the item.
                So if we have [Item1, Item2, Item3]
                Next step: [Item2, Item3, Item4]
                Item1 exits Left. Item4 enters Right. Item2 and Item3 shift Left.
             */}
                        {visibleItems.map((item, i) => {
                            // The "real" identity of the object is essentially its index in the original array.
                            // But for the loop, we might see the same item appear again.
                            // We use the item object itself or a stable ID if possible.
                            // Let's assume items have stable rendering. 
                            // The tricky part is the key. If we use `item.name` (assuming unique), Framer detects it.
                            // When "Mario" moves from pos 0 to pos -1 (removed), it animates out.
                            // When "Burger King" moves from pos 1 to pos 0, it animates layout.
                        })}
                        {/* 
               Actually, simpler implementation for "Carousel of 3 moving 1 by 1":
               Just map the 3 visible items. But we need stable keys.
               We will use the index from the original array as part of the key.
             */}

                        {visibleItems.map((item) => (
                            <motion.div
                                key={item.name + item.type + activeIndex} // Changing key forces re-mount? No, we want layout animation.
                                // If we want smooth shift:
                                // Key must be stable for the Content.
                                // But if 'Mario' is at index 0, then next it's gone.
                                // Wait, "Mario" is index 0 in source.
                                // In visible window [0, 1, 2]. Next [1, 2, 0].
                                // Mario (0) disappears. Burger (1) moves left. Sushi (2) moves left. Mario (0) appears on right.
                                // So we use item.name as key.
                                layout
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="min-w-[300px] md:min-w-[350px] w-full max-w-sm flex-shrink-0"
                            >
                                {renderItem(item)}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation - Optional, might be cluttered with fast autoplay */}
            {showNavigation && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    );
};