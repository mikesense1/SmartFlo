import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Mail, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorVerificationProps {
  milestoneId: string;
  amount: number;
  userEmail: string;
  onVerified: (otpId: string) => void;
  onCancel: () => void;
}

export function TwoFactorVerification({
  milestoneId,
  amount,
  userEmail,
  onVerified,
  onCancel
}: TwoFactorVerificationProps) {
  const [step, setStep] = useState<'init' | 'verify'>('init');
  const [otpCode, setOtpCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Start countdown timer
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
      const response = await apiRequest("POST", "/api/payment/send-otp", {
        milestoneId,
        amount
      });

      if (response.ok) {
        const data = await response.json();
        setOtpId(data.otpId);
        setStep('verify');
        setTimeRemaining(600); // Reset timer
        setCanResend(false);
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

  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/payment/verify-otp", {
        milestoneId,
        otpCode
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          toast({
            title: "Verification Successful",
            description: "Payment approval verified",
          });
          onVerified(data.otpId);
        } else {
          toast({
            title: "Invalid Code",
            description: "Please check your code and try again",
            variant: "destructive",
          });
          setOtpCode('');
        }
      } else {
        const error = await response.json();
        toast({
          title: "Verification Failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
        setOtpCode('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
      setOtpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(cleanValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otpCode.length === 6) {
      verifyOTP();
    }
  };

  if (step === 'init') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Secure Payment Verification</CardTitle>
          <CardDescription>
            We need to verify this payment approval for your security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Payment Amount: <strong>${(amount / 100).toFixed(2)}</strong>
            </AlertDescription>
          </Alert>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              A 6-digit verification code will be sent to:
            </p>
            <p className="font-medium">{userEmail}</p>
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
                  Send Verification Code
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle>Enter Verification Code</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to {userEmail}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Input
            type="text"
            placeholder="000000"
            value={otpCode}
            onChange={(e) => handleOtpChange(e.target.value)}
            onKeyPress={handleKeyPress}
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

        <div className="space-y-2">
          <Button
            onClick={verifyOTP}
            disabled={isLoading || otpCode.length !== 6 || timeRemaining === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Approve Payment'
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={sendOTP}
              disabled={!canResend || isLoading}
              className="flex-1"
            >
              Resend Code
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>

        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription className="text-xs">
            For your security, never share this code with anyone. SmartFlo will never ask for your verification code.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}