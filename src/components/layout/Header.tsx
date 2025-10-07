import { School } from 'lucide-react';
import type { FC } from 'react';

export const Header: FC = () => {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-16 items-center p-4">
        <div className="flex items-center gap-3">
          <School className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-primary">
            ClassSync AI
          </h1>
        </div>
      </div>
    </header>
  );
};
