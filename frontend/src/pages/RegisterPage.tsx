import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ApiError } from '@/lib/api-error';
import { registerSchema, type RegisterInput } from '@/schemas/auth';

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', displayName: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(input: RegisterInput) {
    try {
      // confirmPassword es solo del cliente; aunque se mandara, Zod en el
      // servidor lo descarta (registerSchema no lo declara).
      await register({
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        password: input.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo registrar');
    }
  }

  async function handleGoogleCredential(credential: string) {
    try {
      await loginWithGoogle(credential);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta con Google');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                Crear cuenta
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="underline">
              Iniciá sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
