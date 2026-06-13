import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkeletonLoader from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders correctly', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.firstChild).toBeDefined();
    // Verify it has the skeleton class
    expect(container.firstChild.className).toContain('skeleton');
  });
});
