'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('No verification token found.');
      toast({
        title: "Verification Failed",
        description: "No verification token was provided.",
        variant: "destructive",
      });
      return;
    }

    const verifyEmail = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          toast({
            title: "Email Verified",
            description: "Your email has been successfully verified. You can now log in.",
          });
          // Redirect to login page after a delay
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000); // Redirect after 3 seconds

        } else {
          setVerificationStatus('error');
          setErrorMessage(data.error || 'Failed to verify email.');
          toast({
            title: "Verification Failed",
            description: data.error || "An error occurred during verification.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred.');
        toast({
          title: "Verification Failed",
          description: "An unexpected error occurred during verification.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [searchParams, router, toast]); // Depend on searchParams to re-run if token changes

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {verificationStatus === 'verifying' && 'Verifying your email address...'}
            {verificationStatus === 'success' && 'Your email has been verified!'}
            {verificationStatus === 'error' && 'Email verification failed.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {verificationStatus === 'verifying' && (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          )}
          {verificationStatus === 'success' && (
            <p>You will be redirected to the login page shortly.</p>
          )}
          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <p className="text-red-500">{errorMessage}</p>
              <p>Please try registering again or contact support if the issue persists.</p>
              <Link href="/auth/register" className="text-blue-500 hover:underline">
                Go to Registration
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 