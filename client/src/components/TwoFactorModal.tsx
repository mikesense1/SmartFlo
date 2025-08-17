import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Clock, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorModalProps {
  open: boolean;
  amount: number;
  milestoneIds?: string[];
  userEmail: string;
  reason?: string;
  onSuccess: (otpId: string, trustDevice?: boolean) => void;
  onCancel: () => void;
}

export function TwoFactorModal({
  open,
  amount,
  milestoneIds = [],
  userEmail,
  reason,
  onSuccess,
  onCancel
}: TwoFactorModalProps) {
  const [step, setStep] = useState<'init' | 'verify'>('init');
  const [otpCode, setOtpCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [isLoading, setIsLoading] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const isBatchApproval = milestoneIds.length > 1;
  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('init');
      setOtpCode('');
      setBackupCode('');
      setTimeRemaining(600);
      setCanResend(false);
      setShowBackupCode(false);
      setTrustDevice(false);
      setStartTime(null);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (step === 'verify' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const endpoint = isBatchApproval ? '/api/payment/batch-send-otp' : '/api/payment/send-otp';
      const payload = isBatchApproval 
        ? { milestoneIds, totalAmount: amount }
        : { milestoneId: milestoneIds[0], amount };

      const response = await apiRequest("POST", endpoint, payload);

      if (response.ok) {
        const data = await response.json();
        setOtpId(data.otpId);
        setStep('verify');
        setTimeRemaining(600);
        setCanResend(false);
        setStartTime(new Date());
        toast({
          title: "Verification Code Sent",
          description: `A 6-digit code has been sent to ${userEmail}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Send Code",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code: string, isBackupCode = false) => {
    if (!isBackupCode && code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isBackupCode 
        ? '/api/payment/verify-backup-code'
        : '/api/payment/verify-otp';
      
      const payload = isBatchApproval
        ? { milestoneIds, [isBackupCode ? 'backupCode' : 'otpCode']: code }
        : { milestoneId: milestoneIds[0], [isBackupCode ? 'backupCode' : 'otpCode']: code };

      const response = await apiRequest("POST", endpoint, payload);

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          const timeToComplete = startTime ? 
            (new Date().getTime() - startTime.getTime()) / 1000 : 0;
          
          // Track completion time
          await apiRequest("POST", "/api/analytics/2fa-event", {
            type: '2fa_success',
            method: isBackupCode ? 'backup_code' : 'email',
            timeToComplete,
            amount
          });

          toast({
            title: "Verification Successful",
            description: isBackupCode ? "Backup code verified" : "Payment approval verified",
          });
          
          onSuccess(data.otpId, trustDevice);
        } else {
          toast({
            title: "Invalid Code",
            description: "Please check your code and try again",
            variant: "destructive",
          });
          if (isBackupCode) {
            setBackupCode('');
          } else {
            setOtpCode('');
          }
        }
      } else {
        const error = await response.json();
        toast({
          title: "Verification Failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
        if (isBackupCode) {
          setBackupCode('');
        } else {
          setOtpCode('');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
      if (isBackupCode) {
        setBackupCode('');
      } else {
        setOtpCode('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(cleanValue);
    
    // Auto-verify when 6 digits entered
    if (cleanValue.length === 6) {
      verifyCode(cleanValue);
    }
  };

  const handleBackupCodeSubmit = () => {
    if (backupCode.trim()) {
      verifyCode(backupCode.trim(), true);
    }
  };

  if (step === 'init') {
    return (
      <Dialog open={open} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center">
              {isBatchApproval ? 'Batch Payment Verification' : 'Payment Verification Required'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {reason || 'Additional security verification is required for this payment'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <strong>
                  {isBatchApproval 
                    ? `Total Amount: ${formatCurrency(amount)} (${milestoneIds.length} milestones)`
                    : `Payment Amount: ${formatCurrency(amount)}`
                  }
                </strong>
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                A 6-digit verification code will be sent to:
              </p>
              <p className="font-medium">{userEmail}</p>
              {reason && (
                <p className="text-xs text-gray-500 italic">
                  Reason: {reason}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={sendOTP} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Code
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">
            Enter Verification Code
          </DialogTitle>
          <DialogDescription className="text-center">
            Code sent to {userEmail}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showBackupCode ? (
            <>
              <div className="text-center">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {timeRemaining > 0 ? (
                  <span>Code expires in {formatTime(timeRemaining)}</span>
                ) : (
                  <span className="text-red-600">Code expired</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trust-device"
                  checked={trustDevice}
                  onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
                />
                <label htmlFor="trust-device" className="text-sm text-gray-600">
                  Trust this device for 30 days
                </label>
              </div>

              <div className="flex gap-2 text-sm">
                <Button
                  variant="outline"
                  onClick={sendOTP}
                  disabled={!canResend || isLoading}
                  className="flex-1"
                  size="sm"
                >
                  Resend Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCode(true)}
                  className="flex-1"
                  size="sm"
                >
                  Use Backup Code
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  Enter one of your backup recovery codes
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter backup code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  className="text-center"
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleBackupCodeSubmit}
                    disabled={!backupCode.trim() || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Backup Code'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBackupCode(false)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </>
          )}

          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
            size="sm"
          >
            Cancel Payment
          </Button>

          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Never share verification codes. SmartFlo will never ask for your codes via phone or email.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}