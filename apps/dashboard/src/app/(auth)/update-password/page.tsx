import { Loading } from "@app/components/loading";
import { UpdatePasswordForm } from "@app/components/update-password-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Loading />}>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
