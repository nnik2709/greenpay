import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';

const VOUCHER_AMOUNT = 50;

export default function IndividualPurchase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState('create'); // 'create' | 'list'
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [customerEmail, setCustomerEmail] = useState('');
  const [posTransactionRef, setPosTransactionRef] = useState('');
  const [posApprovalCode, setPosApprovalCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batchId, setBatchId] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  const totalAmount = quantity * VOUCHER_AMOUNT;

  const handleQuantityChange = (newQty) => {
    setQuantity(newQty);
    setCollectedAmount(newQty * VOUCHER_AMOUNT);
  };

  const handleCreateVouchers = async () => {
    // For card/POS payments, require transaction reference
    if ((paymentMethod === 'POS' || paymentMethod === 'CARD') && !posTransactionRef.trim()) {
      toast({
        variant: 'destructive',
        title: 'Transaction Reference Required',
        description: 'Please enter the POS transaction reference number from the receipt.'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.post('/individual-purchases/batch-simple', {
        quantity,
        paymentMethod,
        collectedAmount,
        customerEmail: customerEmail || null,
        posTransactionRef: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posTransactionRef : null,
        posApprovalCode: (paymentMethod === 'POS' || paymentMethod === 'CARD') ? posApprovalCode : null
      });

      if (response.success) {
        setBatchId(response.batchId);
        setVouchers(response.vouchers);
        setStep('list');

        toast({
          title: 'Vouchers Created!',
          description: `${quantity} voucher(s) created successfully.`
        });
      }

    } catch (error) {
      console.error('Error creating vouchers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create vouchers'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'list') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Vouchers Created - Batch: {batchId}</CardTitle>
            <CardDescription>
              Payment: PGK {totalAmount.toFixed(2)} ({paymentMethod})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vouchers.map((voucher) => (
                <Card key={voucher.id} className="p-4 border-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{voucher.voucherCode}</h3>
                      <p className="text-sm text-gray-600">
                        Status: <span className="text-yellow-600 font-semibold">Unregistered</span>
                        {' '} | Valid until: {new Date(voucher.validUntil).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(`/register/${voucher.voucherCode}`, '_blank')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Register Passport →
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: 'Print Feature',
                            description: 'Print blank voucher functionality coming soon'
                          });
                        }}
                      >
                        Print Blank
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('create');
                  setVouchers([]);
                  setBatchId(null);
                  setQuantity(1);
                  setCollectedAmount(50);
                  setCustomerEmail('');
                }}
              >
                Create More Vouchers
              </Button>
              <Button onClick={() => navigate('/app/vouchers-list')}>
                View All Vouchers →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Individual Purchase</CardTitle>
          <CardDescription>
            Create vouchers for individual passport purchases. Passports will be registered using the MRZ scanner after voucher creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quantity Selector */}
          <div>
            <Label className="text-base font-semibold">Number of Vouchers</Label>
            <p className="text-sm text-gray-500 mb-3">Select how many vouchers to create (1-5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={quantity === num ? 'default' : 'outline'}
                  onClick={() => handleQuantityChange(num)}
                  className="w-14 h-14 text-lg font-bold"
                  type="button"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="mt-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer flex-1 font-normal">
                  Cash Payment
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="POS" id="pos" />
                <Label htmlFor="pos" className="cursor-pointer flex-1 font-normal">
                  POS/Card Payment
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-base font-semibold">Collected Amount (PGK)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Expected: PGK {totalAmount.toFixed(2)} ({VOUCHER_AMOUNT} × {quantity} voucher{quantity > 1 ? 's' : ''})
            </p>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
              className="text-lg font-semibold"
            />
            {Math.abs(collectedAmount - totalAmount) > 0.01 && (
              <p className="text-sm text-amber-600 mt-1">
                {collectedAmount > totalAmount
                  ? `⚠️ Overpayment: PGK \${(collectedAmount - totalAmount).toFixed(2)}`
                  : `⚠️ Underpayment: PGK \${(totalAmount - collectedAmount).toFixed(2)}`
                }
              </p>
            )}
          </div>

          {/* Customer Email (Optional) */}
          <div>
            <Label htmlFor="email" className="text-base font-semibold">Customer Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional - used for sending voucher details later
            </p>
          </div>

          {/* POS Transaction Reference (for POS/Card payments) */}
          {paymentMethod === 'POS' && (
            <>
              <div>
                <Label htmlFor="posRef" className="text-base font-semibold">
                  POS Transaction Reference <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="posRef"
                  type="text"
                  value={posTransactionRef}
                  onChange={(e) => setPosTransactionRef(e.target.value)}
                  placeholder="Enter transaction reference from POS receipt"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Required for POS/Card payments - find this on the payment receipt
                </p>
              </div>

              <div>
                <Label htmlFor="posApproval" className="text-base font-semibold">
                  POS Approval Code (Optional)
                </Label>
                <Input
                  id="posApproval"
                  type="text"
                  value={posApprovalCode}
                  onChange={(e) => setPosApprovalCode(e.target.value)}
                  placeholder="Enter approval code (if available)"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional - approval code from POS terminal
                </p>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateVouchers}
              disabled={isSubmitting || collectedAmount <= 0}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isSubmitting
                ? 'Creating Vouchers...'
                : `Create ${quantity} Voucher${quantity > 1 ? 's' : ''} →`
              }
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps After Creation:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Click "Register Passport →" for each voucher</li>
              <li>Scan passport using KB MRZ scanner</li>
              <li>Verify details and complete registration</li>
              <li>Print or email the completed voucher</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
