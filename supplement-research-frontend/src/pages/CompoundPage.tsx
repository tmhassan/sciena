import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { compoundService } from '../services/api';
import { Layout } from '../components/layout/Layout';
import { CompoundHero } from '../components/compound/CompoundHero';
import { CompoundTabs } from '../components/compound/CompoundTabs';
import { Spinner } from '../components/ui/Spinner';

export function CompoundPage() {
  const { id } = useParams<{ id: string }>();

  const { data: compound, isLoading, isError } = useQuery({
    queryKey: ['compound', id],
    queryFn: () => compoundService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (isError || !compound) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Compound Not Found
            </h1>
            <p className="text-lg text-red-600 dark:text-red-400">
              Unable to load compound data. Please try again later.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CompoundHero compound={compound} />
      <CompoundTabs compound={compound} />
    </Layout>
  );
}
