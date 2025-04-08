import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Mail, User, Key, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define signup form schema
const signupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Define signup form values type
type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    try {
      // Remove confirmPassword as it's not needed for the API request
      const { confirmPassword, ...signupData } = data;
      
      const response = await apiRequest<{ token: string; username: string; id: string }>({
        url: "/api/auth/signup",
        method: "POST",
        data: signupData,
      });
      
      // Store user authentication data in localStorage
      localStorage.setItem("user", JSON.stringify({
        id: response.id,
        username: response.username,
        token: response.token
      }));
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      
      // Redirect to dashboard after successful signup
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error?.message || "An error occurred during signup. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#12121a] px-4">
      <Card className="w-full max-w-md border-[#2a2a35] bg-[#1a1a22]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            <UserPlus className="mr-2 h-6 w-6" />
            Create an Account
          </CardTitle>
          <CardDescription className="text-gray-400">
            Fill out the form below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="chef123"
                          className="border-[#2a2a35] bg-[#12121a] pl-10 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="you@example.com"
                          className="border-[#2a2a35] bg-[#12121a] pl-10 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="border-[#2a2a35] bg-[#12121a] pl-10 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="border-[#2a2a35] bg-[#12121a] pl-10 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#3a3a45] hover:bg-[#4a4a55] text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 text-[#6a6aff] hover:text-[#8a8aff]"
                onClick={() => setLocation("/login")}
              >
                Login
              </Button>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}