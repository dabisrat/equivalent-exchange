import { Loading } from "@app/components/loading";
import { SignUpForm } from "@app/components/sign-up-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Loading />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
