import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from "../lib/utils";
import { Icons } from '../components/ui/icons';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
});

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting data:', data);
      const endpoint = activeTab === 'login' ? 'http://localhost:3001/api/login' : 'http://localhost:3001/api/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Server error');
      }

      if (result.success) {
        localStorage.setItem('token', result.token);
        navigate('/home');
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-black" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img src="/f1-logo.png" alt="F1 Logo" className="h-8 w-auto mr-2" />
            F1 Insider
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Join the F1 community and stay up to date with the latest news, analysis, and discussions."
              </p>
              <footer className="text-sm">Max Verstappen</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'login' 
                  ? 'Enter your credentials to access your account' 
                  : 'Enter your details to create your account'}
              </p>
            </div>
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                  {activeTab === 'register' && (
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="johndoe"
                        type="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        disabled={isLoading}
                        {...register('username')}
                      />
                      {errors.username && (
                        <p className="text-sm text-destructive">{errors.username.message}</p>
                      )}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoCapitalize="none"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <Button disabled={isLoading}>
                    {isLoading && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </div>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-gray-50" 
                  disabled={isLoading}
                >
                  <Icons.google className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-gray-50" 
                  disabled={isLoading}
                >
                  <Icons.github className="mr-2 h-4 w-4" />
                  Github
                </Button>
              </div>
            </div>
            <p className="px-8 text-center text-sm text-muted-foreground">
              {activeTab === 'login' ? (
                <>
                  Don't have an account?{" "}
                  <span
                    className="text-primary underline underline-offset-4 hover:text-primary/90 cursor-pointer"
                    onClick={() => {
                      setActiveTab('register');
                      reset();
                      setError('');
                    }}
                  >
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span
                    className="text-primary underline underline-offset-4 hover:text-primary/90 cursor-pointer"
                    onClick={() => {
                      setActiveTab('login');
                      reset();
                      setError('');
                    }}
                  >
                    Sign in
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
