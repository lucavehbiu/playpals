import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { loginUserData, registerUserData } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { User, Lock, Star, ArrowRight, Mail } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import playPalsLogo from '@/assets/playpals-logo.jpg';

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Registration schema
const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <motion.div
            className="relative inline-block mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-primary to-secondary shadow-md overflow-hidden relative flex items-center justify-center">
              <img src={playPalsLogo} alt="PlayPals" className="w-full h-full object-cover" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PlayPals</h1>
          <p className="text-gray-600">Connect with local sports enthusiasts</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all ${
                activeTab === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all ${
                activeTab === 'register'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Account
            </button>
          </nav>
        </div>

        {/* Auth Card */}
        <motion.div
          className="bg-white rounded-b-lg shadow-md border border-gray-200 border-t-0 overflow-hidden"
          layout
        >
          {activeTab === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Welcome back</h2>

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                <div>
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-900 mb-2 block"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="h-11 border-gray-200 focus:border-primary focus:ring-primary"
                    {...loginForm.register('username')}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1.5">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-900 mb-2 block"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-11 border-gray-200 focus:border-primary focus:ring-primary"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1.5">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-gray-500 uppercase tracking-wider">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (window.location.href = '/api/auth/google')}
                  className="w-full h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <FcGoogle className="w-5 h-5 mr-3" />
                  <span className="text-gray-700 font-medium">Google</span>
                </Button>
              </form>
            </motion.div>
          )}

          {activeTab === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
              </div>
              <p className="text-gray-600 text-sm mb-6">Join the community of sports enthusiasts</p>

              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="register-username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a unique username"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      {...registerForm.register('username')}
                    />
                  </div>
                  {registerForm.formState.errors.username && (
                    <p className="text-xs text-red-500 mt-1">
                      {registerForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      {...registerForm.register('name')}
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      {...registerForm.register('email')}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a strong password"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      {...registerForm.register('password')}
                    />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="register-confirm-password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      {...registerForm.register('confirmPassword')}
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  {registerMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (window.location.href = '/api/auth/google')}
                  className="w-full h-12 border-gray-200 hover:bg-gray-50 flex items-center justify-center space-x-3"
                >
                  <FcGoogle className="w-5 h-5" />
                  <span className="text-gray-700 font-medium">Continue with Google</span>
                </Button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
