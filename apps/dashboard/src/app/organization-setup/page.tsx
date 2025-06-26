'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@eq-ex/ui/components/button';
import { Card } from '@eq-ex/ui/components/card';
import { Input } from '@eq-ex/ui/components/input';
import { Label } from '@eq-ex/ui/components/label';
import { createOrganization } from '@app/utils/organization';
import { useAuth } from '@app/hooks/use-auth';

export default function OrganizationSetupPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        organization_name: '',
        max_points: 100,
    });
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.email) {
            setError('User email not found');
            return;
        }

        if (!formData.organization_name.trim()) {
            setError('Organization name is required');
            return;
        }

        if (formData.max_points <= 0) {
            setError('Max points must be greater than 0');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await createOrganization({
                organization_name: formData.organization_name.trim(),
                max_points: formData.max_points,
            });

            // Redirect to dashboard after successful setup
            router.push('/dashboard');
        } catch (err) {
            console.error('Failed to create organization:', err);
            setError('Failed to create organization. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        // TODO: use shadcn form with react-hook-form for better form handling
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <Card className="p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Organization Setup
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Set up your organization to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="mt-1 bg-gray-100 dark:bg-gray-800"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This email will be associated with your organization
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="organization_name" className="text-sm font-medium">
                                Organization Name *
                            </Label>
                            <Input
                                id="organization_name"
                                type="text"
                                value={formData.organization_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('organization_name', e.target.value)}
                                placeholder="Enter your organization name"
                                className="mt-1"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="max_points" className="text-sm font-medium">
                                Maximum Points *
                            </Label>
                            <Input
                                id="max_points"
                                type="number"
                                value={formData.max_points}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('max_points', parseInt(e.target.value) || 0)}
                                placeholder="100"
                                min="1"
                                className="mt-1"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum points that can be awarded
                            </p>
                        </div>

                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Organization...' : 'Create Organization'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                            * Required fields
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
