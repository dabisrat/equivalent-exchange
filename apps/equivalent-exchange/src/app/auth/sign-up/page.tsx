import { Loading } from "@app/components/loading";
import { SignUpForm } from "@app/components/sign-up-form";
import { PasskeySignUpForm } from "@app/components/passkey-sign-up-form";
import { Suspense } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@eq-ex/ui/components/tabs";

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Loading />}>
          <Tabs defaultValue="passkey" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="passkey"
                className="dark:data-[state=active]:bg-background dark:data-[state=active]:border-transparent"
              >
                Passkey
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="dark:data-[state=active]:bg-background dark:data-[state=active]:border-transparent"
              >
                Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="passkey">
              <PasskeySignUpForm />
            </TabsContent>
            <TabsContent value="password">
              <Suspense fallback={<Loading />}>
                <SignUpForm />
              </Suspense>
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </div>
  );
}
