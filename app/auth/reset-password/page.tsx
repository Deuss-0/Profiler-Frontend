'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('loading'); // 'loading', 'form', 'success', 'error'
  const [message, setMessage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');

    if (!tokenFromUrl) {
      setStatus('error');
      setMessage('No reset token found in the URL.');
      toast({
        title: "Invalid Link",
        description: "The password reset link is missing a token.",
        variant: "destructive",
      });
    } else {
      // In a real application, you might want to validate the token with the backend here
      // before showing the form, but for now, we'll just set it.
      setToken(tokenFromUrl);
      setStatus('form');
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Error",
        description: "Reset token is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset successfully. You can now log in.');
        toast({
          title: "Success",
          description: data.message || "Your password has been reset.",
        });
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000); // Redirect after 3 seconds
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password.');
        toast({
          title: "Reset Failed",
          description: data.error || "An error occurred while resetting your password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred.');
      toast({
        title: "Reset Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Checking reset token...'}
            {status === 'form' && 'Enter your new password.'}
            {status === 'success' && 'Password reset successful.'}
            {status === 'error' && 'Failed to reset password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          )}

          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-green-500">{message}</p>
              <Link href="/auth/login" className="text-blue-500 hover:underline">
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-red-500">{message}</p>
              <p>Please request a new password reset link or contact support.</p>
              {/* Link back to forgot password page might be helpful */}
               <Link href="/auth/forgot-password" className="text-blue-500 hover:underline">
                Request New Link
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 