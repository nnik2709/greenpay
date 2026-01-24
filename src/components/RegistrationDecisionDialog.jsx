import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Clock, Camera, QrCode } from 'lucide-react';

/**
 * Registration Decision Dialog
 *
 * Asks user if they have all passports available to register now
 * Shown only for multi-voucher purchases (2-5 vouchers)
 *
 * Props:
 * - voucherCount: number of vouchers purchased
 * - onRegisterNow: callback when user chooses to register immediately
 * - onRegisterLater: callback when user chooses to register later
 */
const RegistrationDecisionDialog = ({
  voucherCount,
  onRegisterNow,
  onRegisterLater
}) => {
  return (
    <div className="min-h-screen p-4 relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg-png.jpg)',
          filter: 'brightness(1.1) blur(3px)',
        }}
      />
      <div className="absolute inset-0 bg-white/75" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-cyan-50/60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-2xl w-full"
      >
        <Card className="border-emerald-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-emerald-800">
                  Payment Successful!
                </CardTitle>
                <CardDescription className="text-emerald-600 text-base mt-1">
                  {voucherCount} vouchers purchased
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Main Question */}
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Do you have all {voucherCount} passports available now?
              </h2>
              <p className="text-slate-600 text-lg">
                Each voucher requires passport registration before use
              </p>
            </div>

            {/* Option A: Register Now */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={onRegisterNow}
                className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-left transition-all shadow-lg hover:shadow-xl border-2 border-emerald-400"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      ✓ Yes, Register All Now
                      <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded">Recommended</span>
                    </h3>
                    <p className="text-emerald-50 text-sm mb-3">
                      Scan {voucherCount} passports with your camera (takes 5-10 minutes)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">Fast camera scanning</span>
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">Ready to use immediately</span>
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">All done at once</span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Option B: Register Later */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={onRegisterLater}
                className="w-full p-6 bg-white hover:bg-slate-50 rounded-xl text-left transition-all shadow-md hover:shadow-lg border-2 border-slate-300 hover:border-slate-400"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      No, I'll Register Later
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Save vouchers and register before your trip
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> QR codes
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Registration URLs</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Email instructions</span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Why register now?
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside ml-1">
                    <li>Your vouchers become valid immediately</li>
                    <li>No need to remember registration later</li>
                    <li>Faster camera scanning than manual entry</li>
                    <li>Download ready-to-use PDFs right away</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded p-3">
              <p className="text-xs text-amber-900">
                <strong>⚠️ Important:</strong> Vouchers are NOT VALID until passports are registered.
                You can register now or later, but registration is required before airport departure.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegistrationDecisionDialog;
