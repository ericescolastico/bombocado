'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function StatCard({ 
  label, 
  value, 
  icon, 
  color = 'bg-green-50 dark:bg-green-950/20', 
  className,
  labelClassName,
  valueClassName
}: StatCardProps) {
  return (
    <Card className={`w-fit ${className || ''}`} shadow="none" radius="lg">
      <CardBody className={`${color} p-6`}>
        <div className="flex flex-col items-start justify-center">
          {icon && (
            <div className="mb-3">
              {icon}
            </div>
          )}
          <p className={`text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500 mb-1.5 whitespace-nowrap ${valueClassName || ''}`}>
            {value}
          </p>
          <p className={`text-sm font-normal text-neutral-700 dark:text-neutral-400 whitespace-nowrap ${labelClassName || ''}`}>
            {label}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

