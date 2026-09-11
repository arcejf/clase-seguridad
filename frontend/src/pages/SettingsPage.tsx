import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import * as usersApi from '@/api/users.api';
import { ApiError } from '@/lib/api-error';
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/auth.schemas';

export function SettingsPage() {
  const { user, setUser } = useAuth();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { displayName: user?.displayName ?? '', bio: user?.bio ?? '' },
  });

  async function onSubmit(input: UpdateProfileInput) {
    try {
      const updated = await usersApi.updateProfile(input);
      setUser(updated);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo actualizar el perfil');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajustes de perfil</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
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
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea rows={4} maxLength={280} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Guardar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
