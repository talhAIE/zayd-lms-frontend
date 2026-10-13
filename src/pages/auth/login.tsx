import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login, addPhoneNumber, clearError } from "@/redux/slices/authSlice";
import { useEffect, useState } from "react";
import charactersImg from "@/assets/images/characters.png";
import zaydLogo from "@/assets/zayd-logo.png";
// import { ArrowLeft } from 'lucide-react';

// Username form schema
const usernameFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
});

// Phone number form schema
const phoneFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: "Valid phone number is required" }),
});

type UsernameFormValues = z.infer<typeof usernameFormSchema>;
type PhoneFormValues = z.infer<typeof phoneFormSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { error, isAuthenticated, user, isLoading } = useAppSelector(
    (state) => state.auth
  );

  // State to track whether we're showing the phone number input
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  // Store username for later use with phone number submission
  const [currentUsername, setCurrentUsername] = useState("");
  // Store whether we're currently submitting the phone number
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);

  // Username form
  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: "",
    },
  });

  // Phone number form
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  useEffect(() => {
    console.log("Auth status:", isAuthenticated, user);
    if (isAuthenticated && user) {
      // Check if user has phone number
      if (user.phoneNumber) {
        navigateUser(user);
      } else {
        // Show phone number input if no phone number exists
        setShowPhoneInput(true);
        // Reset form with empty phone number
        phoneForm.reset({ phoneNumber: "" });
      }
    }
  }, [isAuthenticated, user, phoneForm]);

  const navigateUser = (user: any) => {
    if (!user.role || user.role === "student") {
      navigate("/student/courses");
    } else if (user.role === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  // Handle back button click
  const handleBackToUsername = () => {
    setShowPhoneInput(false);
    dispatch(clearError()); // Clear any errors when going back
  };

  const onUsernameSubmit = async (data: UsernameFormValues) => {
    try {
      setCurrentUsername(data.username);

      const resultAction = await dispatch(
        login({
          username: data.username,
        })
      );

      if (login.fulfilled.match(resultAction)) {
        // If user has phone number, will be redirected by useEffect
        // Otherwise, phone input will be shown
        if (resultAction.payload.user.phoneNumber) {
          toast.success("Login successful");
          navigateUser(resultAction.payload.user);
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const onPhoneSubmit = async (data: PhoneFormValues) => {
    try {
      setIsSubmittingPhone(true);
      const resultAction = await dispatch(
        addPhoneNumber({
          username: currentUsername,
          phoneNumber: data.phoneNumber,
        })
      );

      if (addPhoneNumber.fulfilled.match(resultAction)) {
        toast.success("Phone number added successfully");
        setTimeout(() => {
          navigateUser(resultAction.payload.user);
        });
      }
    } catch (error) {
      console.error("Adding phone number failed:", error);
      toast.error("Failed to add phone number. Please try again.");
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  return (
    <>
      <style>{`
        .gradient-hover-animate {
          background: linear-gradient(to right, #3EA4F9 0%, #0267B5 50%, #3EA4F9 100%);
          background-size: 200% 100%;
          background-position: 0% 50%;
          transition: background-position 0.6s ease;
        }
        .gradient-hover-animate:hover {
          background-position: 100% 50%;
        }
      `}</style>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-[#F7FBFF] to-[#EFF3FF] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          <div className="hidden lg:flex relative col-span-1 lg:col-span-3 h-full items-center justify-center p-6 md:p-10">
            <img
              src={charactersImg}
              alt="ZAYD AI mentors"
              className="w-full max-w-5xl h-auto object-contain drop-shadow-[0_25px_45px_rgba(2,103,181,0.15)]"
            />
          </div>

          <div className="col-span-1 lg:col-span-2 p-8 md:p-12 flex flex-col">
            <div className="flex flex-col items-center text-center mb-8">
              <Link to="/" className="cursor-pointer">
                <img src={zaydLogo} alt="ZAYD Logo" className="w-28 mb-4" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-semibold text-[#0C1B3A]">
                {showPhoneInput ? "Verify your phone" : "Welcome Back!"}
              </h1>
              <p className="mt-2 text-[#5C6475] max-w-sm">
                {showPhoneInput
                  ? "Enter your phone number so we can complete your profile."
                  : "Please enter your credentials to continue."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex-1 flex flex-col">
              {!showPhoneInput ? (
                <Form {...usernameForm}>
                  <form
                    onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={usernameForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0C1B3A] font-semibold">
                            User Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Type your username"
                              className="h-14 rounded-2xl border border-[#dce4f3] focus-visible:ring-2 focus-visible:ring-[#3EA4F9]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="gradient-hover-animate w-full rounded-2xl h-14 text-white font-semibold flex items-center justify-center mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Log In"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...phoneForm} key="phone-form">
                  <form
                    onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={phoneForm.control}
                      name="phoneNumber"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel className="text-[#0C1B3A] font-semibold">
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your phone number"
                                className="h-14 rounded-2xl border border-[#dce4f3] focus-visible:ring-2 focus-visible:ring-[#3EA4F9]"
                                type="tel"
                                autoFocus
                                autoComplete="tel"
                                disabled={isSubmittingPhone}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const onlyNums = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  field.onChange(onlyNums);
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <Button
                      type="submit"
                      className="gradient-hover-animate w-full rounded-2xl h-14 text-white font-semibold flex items-center justify-center mt-2"
                      disabled={isSubmittingPhone}
                    >
                      {isSubmittingPhone ? "Adding..." : "Add Number"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full rounded-2xl h-14 font-semibold flex items-center justify-center mt-2 border border-transparent text-[#0267B5] hover:bg-[#E8F4FF]"
                      onClick={handleBackToUsername}
                    >
                      Back
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
