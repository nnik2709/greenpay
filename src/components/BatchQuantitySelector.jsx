import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import FEATURE_FLAGS from '@/config/features';

/**
 * Batch Quantity Selector Component
 *
 * Allows Counter Agents to select 1-5 vouchers for batch purchase.
 * - Quantity 1: Single purchase mode (default, existing flow)
 * - Quantity 2-5: Batch purchase mode (new flow)
 *
 * Guarded by BATCH_PURCHASE_ENABLED feature flag.
 */
const BatchQuantitySelector = ({ quantity, onChange, disabled = false }) => {
  const maxQuantity = FEATURE_FLAGS.BATCH_PURCHASE_MAX_QUANTITY || 5;

  return (
    <Card className="border-2 border-blue-500 bg-blue-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold text-blue-900">
              Number of Vouchers (1-{maxQuantity})
            </Label>
            <p className="text-sm text-blue-700 mt-1">
              Select how many vouchers to purchase in this transaction
            </p>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                variant={quantity === num ? 'default' : 'outline'}
                size="lg"
                onClick={() => onChange(num)}
                disabled={disabled || num > maxQuantity}
                className={`flex-1 text-lg font-bold ${
                  quantity === num
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-white hover:bg-blue-100'
                }`}
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="text-xs text-blue-600 space-y-1">
            {quantity === 1 && (
              <p>✓ Single voucher purchase (standard process)</p>
            )}
            {quantity > 1 && (
              <>
                <p>✓ Batch purchase: Scan {quantity} passports sequentially</p>
                <p>✓ Single payment for all {quantity} vouchers (PGK {quantity * 50})</p>
                <p>✓ All vouchers printed together</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchQuantitySelector;
