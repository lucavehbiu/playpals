import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Phone, Shield, Check } from "lucide-react";

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number")
});

const verificationSchema = z.object({
  verificationCode: z.string().length(6, "Verification code must be 6 digits")
});

interface PhoneVerificationProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function PhoneVerification({ onComplete, onCancel }: PhoneVerificationProps) {
  const { user } = useAuth();
  
  const refetch = () => {
    // Refetch user data
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'verification' | 'completed'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber || ""
    }
  });

  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationCode: ""
    }
  });

  // Check if already verified
  if (user?.phoneNumber && user?.isPhoneVerified) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Phone Number Verification</h3>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Phone Number Verified</CardTitle>
            </div>
            <CardDescription>
              Your phone number {user.phoneNumber} is verified and secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onComplete}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // In a real app, this would send an SMS verification code
      // For demo purposes, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Verification code sent",
        description: `We've sent a 6-digit code to ${values.phoneNumber}`
      });
      
      setStep('verification');
    } catch (error) {
      toast({
        title: "Error sending verification code",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (values: z.infer<typeof verificationSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // In a real app, this would verify the code with SMS service
      // For demo purposes, we'll accept any 6-digit code
      const phoneNumber = phoneForm.getValues('phoneNumber');
      
      await apiRequest(`/api/users/${user.id}/phone-verification`, {
        method: 'PUT',
        body: { 
          phoneNumber,
          isVerified: true
        }
      });
      
      toast({
        title: "Phone number verified successfully",
        description: "Your phone number has been verified and added to your profile."
      });
      
      refetch();
      onComplete();
    } catch (error) {
      toast({
        title: "Invalid verification code",
        description: "Please check your code and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Phone Number Verification</h3>
      
      <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Why verify your phone?</p>
          <p className="text-blue-700">
            Verified phone numbers help build trust in the community and enable important notifications.
            Your phone number will remain private and not be shared with other users.
          </p>
        </div>
      </div>

      {step === 'phone' && (
        <Form {...phoneForm}>
          <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
            <FormField
              control={phoneForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., +1 (555) 123-4567" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include your country code for international numbers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Verification Code"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 'verification' && (
        <Form {...verificationForm}>
          <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-4">
            <FormField
              control={verificationForm.control}
              name="verificationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit code" 
                      maxLength={6}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the 6-digit code we sent to {phoneForm.getValues('phoneNumber')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Phone Number"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('phone')}
              >
                Back
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}