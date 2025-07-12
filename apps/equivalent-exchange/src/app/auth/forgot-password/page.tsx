import { ForgotPasswordForm } from "@app/components/forgot-password-form";
import { Loading } from "@app/components/loading";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* TODO: Why do I need suspense boundy here? */}
        <Suspense fallback={<Loading />}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
