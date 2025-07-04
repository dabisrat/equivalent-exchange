import { redirect } from 'next/navigation';
import { getUser } from '@eq-ex/auth';
import { LoginForm } from '@app/components/login-form';

interface LoginPageProps {
    searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    // Check if user is already authenticated
    try {
        await getUser();
        // If we get here, user is authenticated, redirect to intended destination or home
        const { redirectTo } = await searchParams;
        redirect(redirectTo || '/');
    } catch (error) {
        // User is not authenticated, continue to login page
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <LoginForm />
            </div>
        </div>
    );
}
