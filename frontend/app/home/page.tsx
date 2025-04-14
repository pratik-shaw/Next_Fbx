"use client";

import React, { useEffect, useState, useRef } from 'react';
import Scene from '../components/Scene';

const HomePage = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add refs for each section
  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };
  
  // Calculate scroll position as a value between 0 and 1
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const scrollTop = window.scrollY;
        const totalHeight = container.scrollHeight - window.innerHeight;
        const normalizedPosition = Math.min(Math.max(scrollTop / totalHeight, 0), 1);
        setScrollPosition(normalizedPosition);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize position
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Handle waypoint changes from the 3D scene
  const handleWaypointChange = (index: number) => {
    setCurrentWaypoint(index);
  };
  
  // Dummy content sections that match the number of waypoints in Scene component
  const sections = [
    { title: "Battle Formation", content: "Experience the power of our advanced battle formation, designed for both offensive and defensive maneuvers." },
    { title: "Fighter Wing", content: "Our fighter wing provides exceptional speed and agility, perfect for quick response missions and strategic strikes." },
    { title: "Dramatic Side Angle", content: "The unique design of our spacecraft combines form and function, with aerodynamics optimized for both atmospheric and space travel." },
    { title: "Detailed Underside", content: "The underside features our latest defensive technology and propulsion systems, providing unmatched protection and speed." },
    { title: "Fighter Squadron Perspective", content: "Our fighter squadrons work in perfect harmony, with synchronized tactical systems and communication protocols." },
    { title: "Top View", content: "From above, you can see the perfect symmetry and engineering excellence that makes our fleet the best in the galaxy." }
  ];
  
  return (
    <div ref={containerRef} className="relative">
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
            className={`min-h-screen flex flex-col justify-center px-8 md:px-16 ${
              currentWaypoint === index ? 'opacity-100' : 'opacity-40'
            } transition-opacity duration-500`}
          >
            <div className="bg-black/50 backdrop-blur-md p-8 rounded-xl max-w-3xl mx-auto text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{section.title}</h2>
              <p className="text-xl md:text-2xl">{section.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;