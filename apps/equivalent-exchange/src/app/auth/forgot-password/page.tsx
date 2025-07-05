import { ForgotPasswordForm } from '@app/components/forgot-password-form'
import { Suspense } from 'react'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* TODO: Why do I need suspense boundy here? */}
        <Suspense fallback={<div>Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
