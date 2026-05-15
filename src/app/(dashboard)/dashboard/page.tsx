import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {session?.user?.name}.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-t-[3px] border-t-oau-gold shadow-sm">
          <CardHeader>
            <CardTitle className="text-oau-navy">Welcome back</CardTitle>
            <CardDescription>System Overview</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are logged in as <strong className="text-oau-navy">{session?.user?.role?.replace('_', ' ')}</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
