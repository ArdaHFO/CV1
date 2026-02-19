'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MasonryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The number of columns to display.
   * @default 3
   */
  columns?: number;
  /**
   * The gap between items in the grid, corresponding to Tailwind's spacing scale.
   * @default 6
   */
  gap?: number;
}

const MasonryGrid = React.forwardRef<HTMLDivElement, MasonryGridProps>(
  ({ className, columns = 3, gap = 6, children }, ref) => {
    // Create grid template columns dynamically
    const gridColsClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    }[columns] || 'grid-cols-3';

    const gapClass = {
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
    }[gap] || 'gap-6';

    // Animation variants for child elements
    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
        },
      },
    };

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(`grid ${gridColsClass} ${gapClass} w-full`, className)}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {React.Children.map(children, (child) => (
          <motion.div variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }
);

MasonryGrid.displayName = 'MasonryGrid';

export { MasonryGrid };
