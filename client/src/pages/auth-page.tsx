import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { loginUserData, registerUserData } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import "../styles/auth-pattern.css";
import { 
  ArrowRight, 
  Trophy, 
  Medal, 
  UserPlus, 
  Target, 
  Key, 
  Mail, 
  User, 
  Zap, 
  Activity, 
  Calendar, 
  Users, 
  MapPin, 
  ChevronsRight, 
  Lock, 
  Sparkles, 
  CheckCircle2
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import playPalsLogo from "@/assets/playpals-logo.jpg";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Golden ratio value approximation: 1.618
const GOLDEN_RATIO = 1.618;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data as loginUserData);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Remove confirmPassword field before submitting
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData as registerUserData);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Motion variants based on golden ratio
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1 * GOLDEN_RATIO
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 * (1/GOLDEN_RATIO) }
    }
  };

  const sportIcons = [
    <motion.div 
      key="basketball" 
      className="absolute top-[10%] right-[15%] text-white/30"
      animate={{ 
        y: [0, -15, 0], 
        rotate: [0, 5, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration: 4 * (1/GOLDEN_RATIO), 
        ease: "easeInOut", 
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M4.93 4.93 19.07 19.07"/>
        <path d="M4.93 19.07 19.07 4.93"/>
        <path d="M12 2a10 10 0 0 0-8.48 15.5"/>
        <path d="M12 22a10 10 0 0 0 8.48-15.5"/>
      </svg>
    </motion.div>,
    <motion.div 
      key="soccer" 
      className="absolute bottom-[20%] left-[20%] text-white/40"
      animate={{ 
        x: [0, 10, 0], 
        rotate: [0, 10, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration: 5 * (1/GOLDEN_RATIO), 
        ease: "easeInOut", 
        repeat: Infinity
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="m7.5 12 3-3 1.5 1.5L15 9l3 3-3 3-1.5-1.5L10.5 15z"/>
        <path d="M12 2a10 10 0 0 0-8.48 15.5"/>
        <path d="M12 22a10 10 0 0 0 8.48-15.5"/>
      </svg>
    </motion.div>,
    <motion.div 
      key="tennis" 
      className="absolute top-[40%] right-[5%] text-white/30"
      animate={{ 
        y: [0, 15, 0], 
        x: [0, -5, 0],
        rotate: [0, -8, 0] 
      }}
      transition={{ 
        duration: 6 * (1/GOLDEN_RATIO), 
        ease: "easeInOut", 
        repeat: Infinity,
        repeatType: "mirror"
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M18 12a6 6 0 0 0-12 0"/>
        <path d="M18 12a6 6 0 0 1-12 0"/>
      </svg>
    </motion.div>
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Left side: Auth forms */}
      <div className="flex flex-col justify-center w-full lg:w-[38.2%]"> {/* Golden ratio: 1/φ ≈ 0.618 or 61.8% of parent */}
        <motion.div 
          className="w-full max-w-md mx-auto p-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="mb-6 lg:mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary shadow-md">
                  <img src={playPalsLogo} alt="PlayPals Logo" className="h-full w-full object-cover" />
                </div>
                <motion.div 
                  className="absolute -right-1 -top-1 bg-white p-1 rounded-full shadow-md"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </motion.div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text tracking-tight">
              PlayPals
            </h1>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Connect with local sports enthusiasts
            </p>
          </motion.div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full h-12 p-1">
              <TabsTrigger value="login" className="rounded-full text-sm">
                <User className="h-4 w-4 mr-2" /> 
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-full text-sm">
                <UserPlus className="h-4 w-4 mr-2" /> 
                Register
              </TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl text-gray-800 flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        Sign in
                      </CardTitle>
                      <CardDescription>
                        Enter your credentials to access your account
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                      <CardContent className="space-y-4 pb-2">
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="login-username" className="text-sm font-medium">
                            Username
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="login-username" 
                              type="text" 
                              placeholder="Enter your username" 
                              className="pl-10 h-10 bg-gray-50/80"
                              {...loginForm.register("username")}
                            />
                          </div>
                          {loginForm.formState.errors.username && (
                            <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.username.message}</p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="login-password" className="text-sm font-medium">
                            Password
                          </Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="login-password" 
                              type="password" 
                              placeholder="••••••••"
                              className="pl-10 h-10 bg-gray-50/80"
                              {...loginForm.register("password")}
                            />
                          </div>
                          {loginForm.formState.errors.password && (
                            <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                          )}
                        </motion.div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          type="submit" 
                          className="w-full relative overflow-hidden group bg-primary hover:bg-primary/90 h-11 rounded-full" 
                          disabled={loginMutation.isPending}
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {loginMutation.isPending ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                              </>
                            ) : (
                              <>
                                Sign in
                                <ChevronsRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </span>
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-r from-primary/80 via-blue-500/80 to-primary/80"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ 
                              repeat: Infinity,
                              repeatType: "mirror",
                              duration: 3,
                              ease: "easeInOut"
                            }}
                            style={{ opacity: 0.5, zIndex: 0 }}
                          />
                        </Button>
                        
                        <div className="mt-6">
                          <div className="relative flex items-center py-3">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or continue with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                          </div>
                          
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              className="w-full h-12 bg-white hover:bg-gray-50/80 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 text-gray-700 hover:text-gray-900 font-medium shadow-sm hover:shadow-md" 
                              onClick={() => window.location.href = '/api/auth/google'}
                            >
                              <FcGoogle className="h-5 w-5" />
                              <span>Continue with Google</span>
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl text-gray-800 flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-primary" />
                        Create Account
                      </CardTitle>
                      <CardDescription>
                        Join the community of sports enthusiasts
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                      <CardContent className="space-y-4 pb-2">
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="register-username" className="text-sm font-medium">
                            Username
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="register-username" 
                              type="text" 
                              placeholder="Choose a unique username"
                              className="pl-10 h-10 bg-gray-50/80"
                              {...registerForm.register("username")}
                            />
                          </div>
                          {registerForm.formState.errors.username && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.username.message}</p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="register-name" className="text-sm font-medium">
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="register-name" 
                              type="text" 
                              placeholder="Enter your full name"
                              className="pl-10 h-10 bg-gray-50/80"
                              {...registerForm.register("name")}
                            />
                          </div>
                          {registerForm.formState.errors.name && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.name.message}</p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="register-email" className="text-sm font-medium">
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="register-email" 
                              type="email" 
                              placeholder="your.email@example.com"
                              className="pl-10 h-10 bg-gray-50/80"
                              {...registerForm.register("email")}
                            />
                          </div>
                          {registerForm.formState.errors.email && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="register-password" className="text-sm font-medium">
                            Password
                          </Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="register-password" 
                              type="password" 
                              placeholder="Create a strong password"
                              className="pl-10 h-10 bg-gray-50/80"
                              {...registerForm.register("password")}
                            />
                          </div>
                          {registerForm.formState.errors.password && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-1.5" variants={itemVariants}>
                          <Label htmlFor="register-confirm-password" className="text-sm font-medium">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                              id="register-confirm-password" 
                              type="password" 
                              placeholder="Confirm your password"
                              className="pl-10 h-10 bg-gray-50/80"
                              {...registerForm.register("confirmPassword")}
                            />
                          </div>
                          {registerForm.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </motion.div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          type="submit" 
                          className="w-full relative overflow-hidden group bg-primary hover:bg-primary/90 h-11 rounded-full" 
                          disabled={registerMutation.isPending}
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {registerMutation.isPending ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                              </>
                            ) : (
                              <>
                                Create Account
                                <ChevronsRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </span>
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-r from-primary/80 via-blue-500/80 to-primary/80"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ 
                              repeat: Infinity,
                              repeatType: "mirror",
                              duration: 3,
                              ease: "easeInOut"
                            }}
                            style={{ opacity: 0.5, zIndex: 0 }}
                          />
                        </Button>
                        
                        <div className="mt-6">
                          <div className="relative flex items-center py-3">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or sign up with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                          </div>
                          
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              className="w-full h-12 bg-white hover:bg-gray-50/80 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 text-gray-700 hover:text-gray-900 font-medium shadow-sm hover:shadow-md" 
                              onClick={() => window.location.href = '/api/auth/google'}
                            >
                              <FcGoogle className="h-5 w-5" />
                              <span>Continue with Google</span>
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      
      {/* Right side: Hero section with golden ratio proportions */}
      <div className="hidden lg:block relative w-[61.8%] bg-gradient-to-br from-primary via-blue-600 to-indigo-700 overflow-hidden"> {/* Golden ratio: φ/(1+φ) ≈ 0.618 or 61.8% of parent */}
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        {/* Animated sport icons in background */}
        {sportIcons}
        
        {/* Golden ratio spiral shape - decorative */}
        <svg 
          className="absolute top-[-15%] right-[-15%] h-[60%] w-[60%] text-white/5 transform rotate-45"
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M95,5 C95,40 67.5,67.5 32.5,67.5 C15,67.5 5,57.5 5,40 C5,30 12.5,22.5 22.5,22.5 C28.75,22.5 32.5,26.25 32.5,32.5 C32.5,36.25 30,38.75 26.25,38.75 C23.75,38.75 22.5,37.5 22.5,35 C22.5,33.75 23.12,32.5 24.38,32.5 C25,32.5 25.62,33.12 25.62,33.75 C25.62,34.38 25,35 24.38,35" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1"
          />
        </svg>
        
        {/* Hero content */}
        <div className="relative h-full flex flex-col justify-center items-center px-8 py-12">
          <motion.div 
            className="max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15,
                delay: 0.5
              }}
            >
              <div className="h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Trophy className="h-10 w-10 text-yellow-300" />
              </div>
            </motion.div>
          
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6 text-white text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              Find Your Next <span className="relative inline-block">
                <span className="relative z-10">Game</span>
                <motion.span 
                  className="absolute bottom-1 left-0 right-0 h-3 bg-yellow-400/30 rounded-full -z-0"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.7, delay: 1 }}
                ></motion.span>
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-white/90 mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Join thousands of sports enthusiasts in your area. Create, discover, and participate in local sports events.
            </motion.p>
            
            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delayChildren: 0.6, staggerChildren: 0.2 }}
            >
              {[
                { icon: <Calendar className="h-6 w-6" />, text: "Create and join events for any sport, anywhere" },
                { icon: <Users className="h-6 w-6" />, text: "Connect with like-minded sports enthusiasts in your area" },
                { icon: <MapPin className="h-6 w-6" />, text: "Discover events happening right in your neighborhood" }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center space-x-4"
                  variants={itemVariants}
                >
                  <div className="flex-shrink-0 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    {feature.icon}
                  </div>
                  <p className="text-white/90 font-medium">
                    {feature.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              className="mt-12 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              <div className="flex items-center justify-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <div className="flex -space-x-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br ${
                      i === 0 ? 'from-red-500 to-red-600' : 
                      i === 1 ? 'from-blue-500 to-blue-600' :
                      'from-green-500 to-green-600'
                    } flex items-center justify-center text-white font-bold text-xs`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-white/90 font-medium text-sm">
                  Join <span className="text-white font-bold">3,500+</span> active users
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}