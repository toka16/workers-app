import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { DeleteAccount } from "@/components/dashboard/delete-account";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireWorker } from "@/lib/data/dashboard";

export default async function AccountPage() {
  const [{ user }, t] = await Promise.all([requireWorker(), getTranslations("dashboard.account")]);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("changePassword")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="login-email">{t("email")}</Label>
              <Input id="login-email" value={user.email} readOnly disabled />
            </div>
            <ResetPasswordForm submitLabel={t("changePassword")} onDoneHref="/dashboard/account" />
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">{t("dangerZone")}</CardTitle>
            <CardDescription>{t("deleteText")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccount />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
