import React from 'react';
import ImageReveal from '@/components/ui/image-reveal';

const ComponentDemo = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-12 p-8 bg-black min-h-screen text-white w-full">
      <div className="flex justify-center w-full">
        <div className="flex flex-col items-center gap-4 border p-6 rounded-xl border-white bg-black shadow-lg">
          <h2 className="text-2xl font-semibold mb-2" />
          <ImageReveal />
        </div>
      </div>
    </div>
  );
};

export { ComponentDemo as DemoOne };
