import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Check, AlertCircle } from 'lucide-react';

/**
 * Batch Passport List Manager Component
 *
 * Displays list of scanned passports in batch mode.
 * Shows passport details and allows removal before submission.
 *
 * Only shown when quantity > 1 (batch mode active).
 */
const BatchPassportList = ({
  passports,
  targetQuantity,
  onRemove,
  isScanning = false
}) => {
  const isComplete = passports.length === targetQuantity;
  const remaining = targetQuantity - passports.length;

  return (
    <Card className={`border-2 ${isComplete ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-blue-900">
            Batch Passport List ({passports.length}/{targetQuantity})
          </span>
          {isComplete && (
            <span className="text-green-600 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Complete
            </span>
          )}
        </CardTitle>
        {!isComplete && (
          <p className="text-sm text-blue-700 mt-2">
            {isScanning ? (
              <span className="flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                Scan {remaining} more passport{remaining > 1 ? 's' : ''}...
              </span>
            ) : (
              `Scan ${remaining} more passport${remaining > 1 ? 's' : ''} to complete the batch`
            )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {passports.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No passports scanned yet</p>
            <p className="text-xs mt-1">Scan first passport to begin</p>
          </div>
        ) : (
          <div className="space-y-2">
            {passports.map((passport, index) => (
              <div
                key={index}
                className="bg-white border border-slate-300 rounded-lg p-3 flex items-start justify-between"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">#{index + 1}</span>
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      {passport.passportNumber}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">
                      {passport.givenName} {passport.surname}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{passport.nationality}</span>
                  </div>
                  {passport.dob && (
                    <div className="text-xs text-slate-500">
                      DOB: {passport.dob}
                      {passport.sex && ` • ${passport.sex}`}
                      {passport.dateOfExpiry && ` • Expires: ${passport.dateOfExpiry}`}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {passports.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-300">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700 font-semibold">Total Amount:</span>
              <span className="text-blue-900 font-bold text-lg">
                PGK {passports.length * 50}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {passports.length} voucher{passports.length > 1 ? 's' : ''} × PGK 50 each
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchPassportList;
