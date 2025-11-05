import React from 'react';
import { Layout } from '../components/layout/Layout';
import { StackBuilderProvider } from '../context/StackBuilderContext';
import { StackBuilderWizard } from '../components/stackBuilder/StackBuilderWizard';

export function StackBuilderPage() {
  return (
    <Layout>
      <StackBuilderProvider>
        <StackBuilderWizard />
      </StackBuilderProvider>
    </Layout>
  );
}
