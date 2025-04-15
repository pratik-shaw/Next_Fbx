"use client";

import React, { useEffect, useState, useRef } from 'react';
import Scene from '../components/Scene';

const HomePage = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingProgrammatically = useRef(false);
  
  // Dummy content sections that match the number of waypoints in Scene component
  const sections = [
    { title: "Battle Formation", content: "Experience the power of our advanced battle formation, designed for both offensive and defensive maneuvers." },
    { title: "Fighter Wing", content: "Our fighter wing provides exceptional speed and agility, perfect for quick response missions and strategic strikes." },
    { title: "Dramatic Side Angle", content: "The unique design of our spacecraft combines form and function, with aerodynamics optimized for both atmospheric and space travel." },
    { title: "Detailed Underside", content: "The underside features our latest defensive technology and propulsion systems, providing unmatched protection and speed." },
    { title: "Fighter Squadron Perspective", content: "Our fighter squadrons work in perfect harmony, with synchronized tactical systems and communication protocols." },
    { title: "Top View", content: "From above, you can see the perfect symmetry and engineering excellence that makes our fleet the best in the galaxy." }
  ];
  
  // Clear and rebuild section refs when component mounts
  useEffect(() => {
    sectionsRef.current = [];
  }, []);
  
  // Add refs for each section
  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };
  
  // Scroll to section based on index
  const scrollToSection = (index: number) => {
    if (sectionsRef.current[index]) {
      scrollingProgrammatically.current = true;
      
      const yOffset = window.innerHeight * 0.1; // Slight offset for better positioning
      const y = sectionsRef.current[index].getBoundingClientRect().top + window.scrollY - yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
      
      // Reset the flag after animation completes
      setTimeout(() => {
        scrollingProgrammatically.current = false;
      }, 1000);
    }
  };
  
  // Handle waypoint changes from the 3D scene
  const handleWaypointChange = (index: number) => {
    if (currentWaypoint !== index) {
      setCurrentWaypoint(index);
      
      // Only programmatically scroll if the change wasn't triggered by scrolling
      if (!scrollingProgrammatically.current) {
        scrollToSection(index);
      }
    }
  };
  
  // Calculate scroll position and determine which section is visible
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current && !scrollingProgrammatically.current) {
        const container = containerRef.current;
        const scrollTop = window.scrollY;
        const totalHeight = container.scrollHeight - window.innerHeight;
        const normalizedPosition = Math.min(Math.max(scrollTop / totalHeight, 0), 1);
        setScrollPosition(normalizedPosition);
        
        // Determine which section is most visible
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;
        
        let closestSection = 0;
        let closestDistance = Infinity;
        
        sectionsRef.current.forEach((section, index) => {
          if (section) {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const distance = Math.abs(sectionCenter - viewportCenter);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestSection = index;
            }
          }
        });
        
        // Update current waypoint if different
        if (closestSection !== currentWaypoint) {
          setCurrentWaypoint(closestSection);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize position
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentWaypoint]);
  
  // Fix for mobile touch events
  useEffect(() => {
    // Fix for ScrollableCameraController.tsx to correct mobile direction
    const fixMobileScrollDirection = () => {
      if (typeof window !== 'undefined') {
        // This creates a custom event that can be listened for in the ScrollableCameraController
        // You would need to add an event listener in that component to catch this
        const event = new CustomEvent('fixMobileScroll', { detail: { fixed: true } });
        window.dispatchEvent(event);
      }
    };
    
    fixMobileScrollDirection();
  }, []);
  
  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* 3D Scene Background */}
      <Scene 
        scrollPosition={scrollPosition} 
        waypointChangeHandler={handleWaypointChange}
      />
      
      {/* Content Sections */}
      <div className="relative z-10">
        {sections.map((section, index) => (
          <div 
            key={index}
            ref={addToRefs}
            className={`min-h-screen flex flex-col justify-center px-8 md:px-16 transition-all duration-700 transform ${
              currentWaypoint === index 
                ? 'opacity-100 scale-100' 
                : 'opacity-30 scale-95'
            }`}
          >
            <div className="bg-black/50 backdrop-blur-md p-8 rounded-xl max-w-3xl mx-auto text-white border border-white/10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{section.title}</h2>
              <p className="text-xl md:text-2xl">{section.content}</p>
              
              {/* Navigation indicators */}
              <div className="flex justify-between mt-8">
                {index > 0 && (
                  <button 
                    onClick={() => scrollToSection(index - 1)} 
                    className="px-4 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                <div className="flex-1"></div>
                {index < sections.length - 1 && (
                  <button 
                    onClick={() => scrollToSection(index + 1)} 
                    className="px-4 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Scroll indicator dots */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-3">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentWaypoint === index 
                  ? 'bg-white w-4 h-4' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Scroll to section ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;