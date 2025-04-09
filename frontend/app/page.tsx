"use client"
import React from 'react';
import dynamic from 'next/dynamic';

// Import the Scene component dynamically with no SSR
const SceneWithNoSSR = dynamic(
  () => import('./components/Scene').then(mod => mod.default),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="main-container">
      <SceneWithNoSSR />
    </main>
  );
}