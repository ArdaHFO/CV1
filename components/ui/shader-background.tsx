'use client';

interface ShaderBackgroundProps {
  isDark?: boolean;
}

const ShaderBackground = ({ isDark = false }: ShaderBackgroundProps) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 -z-10 ${
        isDark ? 'bg-black' : 'bg-white'
      } swiss-grid-pattern swiss-noise`}
    />
  );
};

export default ShaderBackground;
