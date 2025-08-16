import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Briefcase, Users } from "lucide-react";
import Navigation from "@/components/navigation";

const setupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  userType: z.enum(["freelancer", "client"], {
    required_error: "Please select your role",
  }),
  companyName: z.string().optional(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function UserSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const currentUser = userResponse?.user || userResponse;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !currentUser) {
      window.location.href = "/login";
    }
  }, [currentUser, userLoading]);

  // Redirect to dashboard if setup is already complete
  useEffect(() => {
    if (currentUser?.userType) {
      const dashboardUrl = currentUser.userType === "freelancer" ? "/dashboard" : "/client-dashboard";
      window.location.href = dashboardUrl;
    }
  }, [currentUser]);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      fullName: currentUser?.fullName || "",
      userType: undefined,
      companyName: "",
    },
  });

  const watchUserType = form.watch("userType");

  const updateUserMutation = useMutation({
    mutationFn: async (data: SetupFormValues) => {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      
      toast({
        title: "Profile Setup Complete",
        description: `Welcome to SmartFlo! Your ${data.userType} account is ready.`,
      });
      
      // Redirect to appropriate dashboard
      const dashboardUrl = data.userType === "freelancer" ? "/dashboard" : "/client-dashboard";
      setTimeout(() => {
        window.location.href = dashboardUrl;
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupFormValues) => {
    updateUserMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Set up your SmartFlo account to start managing contracts and payments
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field}
                          disabled={updateUserMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a...</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={updateUserMutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="freelancer">
                            <div className="flex items-center gap-3">
                              <Briefcase className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Freelancer</div>
                                <div className="text-xs text-muted-foreground">
                                  Create contracts and get paid faster
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="client">
                            <div className="flex items-center gap-3">
                              <Users className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Client</div>
                                <div className="text-xs text-muted-foreground">
                                  Hire freelancers and manage projects
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchUserType === "client" && (
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your company name" 
                            {...field}
                            disabled={updateUserMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          This will appear on your contracts and invoices
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Setting up your account...
                    </div>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}