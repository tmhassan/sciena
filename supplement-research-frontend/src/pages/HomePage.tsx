import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturedCompounds } from '../components/home/FeaturedCompounds';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { Layout } from '../components/layout/Layout';

export function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <FeaturedCompounds />
      <CategoryGrid />
    </Layout>
  );
}
