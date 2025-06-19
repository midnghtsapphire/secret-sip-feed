
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onReset: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => {
  return (
    <Card className="p-4 border-2 border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h3 className="font-semibold text-red-800">Extraction Failed</h3>
          <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Another URL
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ErrorDisplay;
